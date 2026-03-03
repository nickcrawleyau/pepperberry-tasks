'use client';

import { useState, useCallback, useEffect } from 'react';
import { WateringData, WateringZone } from '@/lib/hydrawise';

interface WateringDisplayProps {
  data: WateringData;
  isAdmin: boolean;
}

const RUN_DURATIONS = [
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
];

const SUSPEND_DAYS = [
  { label: '1 day', seconds: 86400 },
  { label: '2 days', seconds: 172800 },
  { label: '3 days', seconds: 259200 },
  { label: '7 days', seconds: 604800 },
];

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function ZoneCard({
  zone,
  isAdmin,
  onAction,
  loading,
}: {
  zone: WateringZone;
  isAdmin: boolean;
  onAction: (action: string, relayId: number, duration?: number) => void;
  loading: string | null;
}) {
  const [showDurations, setShowDurations] = useState(false);

  const stripeColor = zone.isRunning
    ? 'bg-emerald-500'
    : zone.isSuspended
      ? 'bg-fw-text/20'
      : 'bg-amber-500';

  const statusText = zone.isRunning
    ? `Running — ${formatDuration(zone.remainingSeconds)} left`
    : zone.isSuspended
      ? 'Suspended'
      : zone.nextRunNice
        ? `Next: ${zone.nextRunNice}`
        : 'Idle';

  const statusColor = zone.isRunning
    ? 'text-emerald-400'
    : zone.isSuspended
      ? 'text-fw-text/40'
      : 'text-fw-text/60';

  const isLoading = loading === String(zone.relayId);

  return (
    <div
      className={`bg-fw-surface rounded-xl border border-fw-surface overflow-hidden ${
        zone.isRunning ? 'ring-1 ring-emerald-500/30' : ''
      }`}
    >
      <div className="flex">
        <div className={`w-1.5 shrink-0 ${stripeColor}`} />
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`text-sm font-medium ${zone.isSuspended ? 'text-fw-text/40' : 'text-fw-text'}`}>
                {zone.name}
              </h3>
              <p className={`text-xs mt-0.5 ${statusColor}`}>
                {zone.isRunning && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1 align-middle" />
                )}
                {statusText}
              </p>
            </div>
            {zone.lastWatered && zone.lastWatered !== 'Never' && (
              <span className="text-xs text-fw-text/50 shrink-0">
                Last: {zone.lastWatered}
              </span>
            )}
          </div>

          {isAdmin && (
            <div className="mt-3 flex items-center gap-1.5">
              {zone.isRunning ? (
                <button
                  type="button"
                  onClick={() => onAction('stop', zone.relayId)}
                  disabled={!!loading}
                  className="px-2.5 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs font-medium hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  {isLoading ? 'Stopping...' : 'Stop'}
                </button>
              ) : (
                <>
                  {showDurations ? (
                    <div className="flex items-center gap-1">
                      {RUN_DURATIONS.map((d) => (
                        <button
                          key={d.seconds}
                          type="button"
                          onClick={() => {
                            onAction('run', zone.relayId, d.seconds);
                            setShowDurations(false);
                          }}
                          disabled={!!loading}
                          className="px-2 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 text-xs font-medium hover:bg-emerald-500/10 transition disabled:opacity-50"
                        >
                          {d.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowDurations(false)}
                        className="px-2 py-1.5 rounded-lg text-fw-text/40 text-xs hover:text-fw-text/60 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDurations(true)}
                      disabled={!!loading || zone.isSuspended}
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 text-xs font-medium hover:bg-emerald-500/10 transition disabled:opacity-50"
                    >
                      {isLoading ? 'Starting...' : 'Run'}
                    </button>
                  )}
                  {zone.isSuspended ? (
                    <button
                      type="button"
                      onClick={() => onAction('suspend', zone.relayId, 0)}
                      disabled={!!loading}
                      className="px-2.5 py-1.5 rounded-lg border border-fw-text/20 text-fw-text/50 text-xs font-medium hover:bg-fw-text/5 transition disabled:opacity-50"
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAction('suspend', zone.relayId)}
                      disabled={!!loading}
                      className="px-2.5 py-1.5 rounded-lg border border-fw-text/20 text-fw-text/50 text-xs font-medium hover:bg-fw-text/5 transition disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WateringDisplay({ data, isAdmin }: WateringDisplayProps) {
  const [zones, setZones] = useState<WateringZone[]>(data.zones);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [showSuspendAll, setShowSuspendAll] = useState(false);

  const runningCount = zones.filter((z) => z.isRunning).length;
  const suspendedCount = zones.filter((z) => z.isSuspended).length;
  const allSuspended = suspendedCount === zones.length && zones.length > 0;

  const handleAction = useCallback(async (action: string, relayId: number, duration?: number) => {
    setLoading(String(relayId));
    setError('');

    try {
      const res = await fetch('/api/watering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, relayId, duration }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Action failed');
        return;
      }

      // Refresh zone data after a short delay to let the controller update
      setTimeout(async () => {
        try {
          const refreshRes = await fetch('/api/watering');
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setZones(refreshData.zones);
          }
        } finally {
          setLoading(null);
        }
      }, 2000);
    } catch {
      setError('Connection error. Try again.');
      setLoading(null);
    }
  }, []);

  const handleGlobalAction = useCallback(async (action: 'stopall' | 'runall' | 'suspendall', duration?: number) => {
    setLoading('global');
    setError('');

    try {
      const res = await fetch('/api/watering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, duration }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Action failed');
        setLoading(null);
        return;
      }

      setTimeout(async () => {
        try {
          const refreshRes = await fetch('/api/watering');
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setZones(refreshData.zones);
          }
        } finally {
          setLoading(null);
        }
      }, 2000);
    } catch {
      setError('Connection error. Try again.');
      setLoading(null);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fw-text/50">
            {zones.length} zone{zones.length !== 1 ? 's' : ''}
          </span>
          {runningCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {runningCount} running
            </span>
          )}
          {suspendedCount > 0 && (
            <span className="text-xs text-fw-text/50">
              {suspendedCount} suspended
            </span>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-1.5">
            {runningCount > 0 && (
              <button
                type="button"
                onClick={() => handleGlobalAction('stopall')}
                disabled={!!loading}
                className="px-2.5 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs font-medium hover:bg-red-500/10 transition disabled:opacity-50"
              >
                Stop All
              </button>
            )}
            {allSuspended ? (
              <button
                type="button"
                onClick={() => handleGlobalAction('suspendall', 0)}
                disabled={!!loading}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 text-xs font-medium hover:bg-emerald-500/10 transition disabled:opacity-50"
              >
                {loading === 'global' ? 'Resuming...' : 'Resume All'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSuspendAll(!showSuspendAll)}
                disabled={!!loading}
                className="px-2.5 py-1.5 rounded-lg border border-fw-text/20 text-fw-text/50 text-xs font-medium hover:bg-fw-text/5 transition disabled:opacity-50"
              >
                Suspend All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Suspend All day picker */}
      {showSuspendAll && isAdmin && (
        <div className="bg-fw-surface rounded-xl border border-fw-surface p-4">
          <p className="text-xs text-fw-text/60 mb-3">Suspend all zones for:</p>
          <div className="flex flex-wrap gap-2">
            {SUSPEND_DAYS.map((d) => (
              <button
                key={d.seconds}
                type="button"
                onClick={() => {
                  handleGlobalAction('suspendall', d.seconds);
                  setShowSuspendAll(false);
                }}
                disabled={!!loading}
                className="px-3 py-2 rounded-lg border border-amber-500/40 text-amber-400 text-xs font-medium hover:bg-amber-500/10 transition disabled:opacity-50"
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowSuspendAll(false)}
              className="px-3 py-2 rounded-lg text-fw-text/40 text-xs hover:text-fw-text/60 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Zone cards */}
      <div className="space-y-2">
        {zones.map((zone) => (
          <ZoneCard
            key={zone.relayId}
            zone={zone}
            isAdmin={isAdmin}
            onAction={handleAction}
            loading={loading}
          />
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-fw-text/50">No zones found on your Hydrawise controller.</p>
        </div>
      )}

      {/* 7-day history */}
      {zones.length > 0 && <WeekHistory zones={zones} />}
    </div>
  );
}

interface HistoryEntry {
  relay_id: number;
  zone_name: string;
  event: string;
  duration_seconds: number | null;
  recorded_at: string;
}

function getLast7Days(): { label: string; dateStr: string }[] {
  const days: { label: string; dateStr: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-AU', { weekday: 'short' }),
      dateStr: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

function WeekHistory({ zones }: { zones: WateringZone[] }) {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!showHistory) return;
    fetch('/api/watering/history')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.history) setHistory(data.history);
      })
      .catch(() => {});
  }, [showHistory]);

  const days = getLast7Days();

  // Build a map: relayId -> Set of dateStrings where it ran
  const runDays = new Map<number, Set<string>>();
  if (history) {
    for (const entry of history) {
      if (entry.event === 'running') {
        const dateStr = new Date(entry.recorded_at).toLocaleDateString('en-CA');
        if (!runDays.has(entry.relay_id)) {
          runDays.set(entry.relay_id, new Set());
        }
        runDays.get(entry.relay_id)!.add(dateStr);
      }
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 w-full text-left mb-3"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-fw-text/40 transition-transform ${showHistory ? '' : '-rotate-90'}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wider text-fw-text/50">
          7-Day History
        </span>
      </button>

      {showHistory && (
        <div className="bg-fw-surface rounded-xl border border-fw-surface p-4 overflow-x-auto">
          {history === null ? (
            <p className="text-xs text-fw-text/50 text-center py-4">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-fw-text/50 text-center py-4">
              No history yet. Data will appear as zones run.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-fw-text/50 font-medium pb-2 pr-3 whitespace-nowrap">Zone</th>
                  {days.map((d) => (
                    <th key={d.dateStr} className="text-center text-fw-text/50 font-medium pb-2 px-1 w-10">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => {
                  const zoneRuns = runDays.get(zone.relayId);
                  return (
                    <tr key={zone.relayId}>
                      <td className="text-fw-text/70 pr-3 py-1.5 whitespace-nowrap">{zone.name}</td>
                      {days.map((d) => {
                        const ran = zoneRuns?.has(d.dateStr);
                        return (
                          <td key={d.dateStr} className="text-center px-1 py-1.5">
                            <div
                              className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center ${
                                ran
                                  ? 'bg-emerald-500/20 border border-emerald-500/40'
                                  : 'bg-fw-text/5 border border-fw-text/10'
                              }`}
                              title={ran ? `Ran on ${d.dateStr}` : `No run on ${d.dateStr}`}
                            >
                              {ran && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                                  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
                                </svg>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
