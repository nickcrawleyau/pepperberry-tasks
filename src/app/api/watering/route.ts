import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  fetchWateringData,
  suspendAllZonesV2,
  resumeAllZonesV2,
  suspendZoneV2,
  resumeZoneV2,
  startZoneV2,
  stopZoneV2,
  stopAllZonesV2,
} from '@/lib/hydrawise';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function logRunningZones() {
  try {
    const data = await fetchWateringData();
    const running = data.zones.filter((z) => z.isRunning);
    if (running.length === 0) return;

    // Check if we already logged these zones in the last 10 minutes to avoid duplicates
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from('watering_history')
      .select('relay_id')
      .eq('event', 'running')
      .gte('recorded_at', tenMinAgo);

    const recentRelayIds = new Set((recent || []).map((r) => r.relay_id));
    const newRunning = running.filter((z) => !recentRelayIds.has(z.relayId));

    if (newRunning.length > 0) {
      await supabaseAdmin.from('watering_history').insert(
        newRunning.map((z) => ({
          zone_name: z.name,
          relay_id: z.relayId,
          event: 'running',
          duration_seconds: z.runDurationSeconds,
        }))
      );
    }
  } catch {
    // Non-critical, don't fail the request
  }
}

function actionToEvent(action: string): string {
  switch (action) {
    case 'run':
    case 'runall':
      return 'running';
    case 'stop':
    case 'stopall':
      return 'stopped';
    case 'suspend':
    case 'suspendall':
      return 'suspended';
    default:
      return action;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'admin' && !session.allowedSections?.includes('watering')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  try {
    const data = await fetchWateringData();

    // Log running zones in the background
    logRunningZones();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch watering data' },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json();
  const { action, relayId, duration } = body as {
    action: string;
    relayId?: number;
    duration?: number;
  };

  const validActions = ['run', 'stop', 'suspend', 'stopall', 'runall', 'suspendall'];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const needsRelay = ['run', 'stop', 'suspend'];
  if (needsRelay.includes(action) && relayId === undefined) {
    return NextResponse.json({ error: 'relayId required' }, { status: 400 });
  }

  try {
    // Suspend/resume uses v2 GraphQL API (v1 suspend is broken)
    if (action === 'suspendall') {
      const actualEvent = duration === 0 ? 'resumed' : 'suspended';

      if (duration === 0) {
        await resumeAllZonesV2();
      } else {
        await suspendAllZonesV2(duration || 604800);
      }

      // Log to history
      try {
        const data = await fetchWateringData();
        if (data.zones.length > 0) {
          await supabaseAdmin.from('watering_history').insert(
            data.zones.map((z) => ({
              zone_name: z.name,
              relay_id: z.relayId,
              event: actualEvent,
              duration_seconds: duration || null,
            }))
          );
        }
      } catch { /* non-critical */ }
      return NextResponse.json({ message: `All zones ${actualEvent}` });
    }

    if (action === 'suspend') {
      const isResume = duration === 0;

      if (isResume) {
        await resumeZoneV2(relayId!);
      } else {
        // Indefinite suspend (individual zones have no duration picker)
        await suspendZoneV2(relayId!, duration || 365 * 24 * 60 * 60);
      }

      // Log to history
      const actualEvent = isResume ? 'resumed' : 'suspended';
      try {
        const data = await fetchWateringData();
        const zone = data.zones.find((z) => z.relayId === relayId);
        await supabaseAdmin.from('watering_history').insert({
          zone_name: zone?.name || `Zone ${relayId}`,
          relay_id: relayId,
          event: actualEvent,
          duration_seconds: duration || null,
        });
      } catch { /* non-critical */ }
      return NextResponse.json({ message: `Zone ${actualEvent}` });
    }

    // All control actions use v2 GraphQL API (v1 setzone is broken)
    if (action === 'run') {
      await startZoneV2(relayId!, duration);
    } else if (action === 'stop') {
      await stopZoneV2(relayId!);
    } else if (action === 'stopall') {
      await stopAllZonesV2();
    }

    // Log the action to history
    const event = actionToEvent(action);
    try {
      if (relayId !== undefined) {
        const data = await fetchWateringData();
        const zone = data.zones.find((z) => z.relayId === relayId);
        await supabaseAdmin.from('watering_history').insert({
          zone_name: zone?.name || `Zone ${relayId}`,
          relay_id: relayId,
          event,
          duration_seconds: duration || null,
        });
      } else {
        const data = await fetchWateringData();
        if (data.zones.length > 0) {
          await supabaseAdmin.from('watering_history').insert(
            data.zones.map((z) => ({
              zone_name: z.name,
              relay_id: z.relayId,
              event,
              duration_seconds: duration || null,
            }))
          );
        }
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({ message: `Zone ${event}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Watering control error:', msg);
    return NextResponse.json(
      { error: `Failed to control zone: ${msg}` },
      { status: 502 }
    );
  }
}
