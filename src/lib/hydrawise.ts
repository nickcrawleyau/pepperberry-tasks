const API_BASE = 'https://api.hydrawise.com/api/v1';

export interface WateringZone {
  relayId: number;
  zone: number;
  name: string;
  isRunning: boolean;
  isSuspended: boolean;
  remainingSeconds: number;
  nextRunNice: string;
  nextRunSeconds: number;
  runDurationSeconds: number;
  lastWatered: string;
}

export interface WateringData {
  zones: WateringZone[];
  nextPollSeconds: number;
  fetchedAt: string;
}

interface HydrawiseRelay {
  relay_id: number;
  relay: number;
  name: string;
  run: number;
  time: number;
  timestr: string;
  nicetime: string;
  lastwater: string;
  is_running: boolean;
  suspended: number;
  running: number | boolean;
  period: number;
  type: number;
}

interface HydrawiseStatusResponse {
  relays: HydrawiseRelay[];
  nextpoll: number;
  message?: string;
}

function getApiKey(): string {
  const key = process.env.HYDRAWISE_API_KEY;
  if (!key) throw new Error('HYDRAWISE_API_KEY not configured');
  return key;
}

export async function fetchWateringData(): Promise<WateringData> {
  const url = `${API_BASE}/statusschedule.php?api_key=${getApiKey()}`;

  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`Hydrawise API error: ${res.status}`);
  }

  const data: HydrawiseStatusResponse = await res.json();

  if (!data.relays) {
    throw new Error('Unexpected Hydrawise response format');
  }

  const zones: WateringZone[] = data.relays.map((r) => ({
    relayId: r.relay_id,
    zone: r.relay,
    name: r.name,
    isRunning: !!r.running || r.is_running,
    isSuspended: r.suspended > 0,
    remainingSeconds: typeof r.running === 'number' ? r.running : 0,
    nextRunNice: r.nicetime || '',
    nextRunSeconds: r.time,
    runDurationSeconds: r.run,
    lastWatered: r.lastwater || 'Never',
  }));

  return {
    zones,
    nextPollSeconds: data.nextpoll || 300,
    fetchedAt: new Date().toISOString(),
  };
}

export async function controlZone(
  action: 'run' | 'stop' | 'suspend' | 'stopall' | 'runall' | 'suspendall',
  relayId?: number,
  durationSeconds?: number
): Promise<{ message: string }> {
  const params = new URLSearchParams({
    api_key: getApiKey(),
    action,
  });

  if (relayId !== undefined) {
    params.set('relay_id', String(relayId));
  }

  // For run actions: duration in seconds via custom parameter
  if (action === 'run' && durationSeconds) {
    params.set('custom', String(durationSeconds));
  }

  // Suspend actions: no duration params (v1 API doesn't support timed suspend reliably)
  // Suspend is indefinite — timed resume handled separately via cron

  const url = `${API_BASE}/setzone.php?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Hydrawise control error: ${res.status} ${text}`);
  }

  // Hydrawise may return plain text errors with 200 status
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    // Non-JSON response — treat as error if it looks like one
    if (text.toLowerCase().includes('fail') || text.toLowerCase().includes('error')) {
      throw new Error(text.trim());
    }
    return { message: text.trim() || 'OK' };
  }

  if (data.error_msg) {
    throw new Error(String(data.error_msg));
  }

  return { message: String(data.message || 'OK') };
}

// ── V2 GraphQL API (for suspend/resume — v1 suspend is broken) ───

const GRAPHQL_URL = 'https://app.hydrawise.com/api/v2/graph';
const TOKEN_URL = 'https://app.hydrawise.com/api/v2/oauth/access-token';
const OAUTH_CLIENT_ID = 'hydrawise_app';
const OAUTH_CLIENT_SECRET = 'zn3CrjglwNV1';

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getOAuthToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.accessToken;
  }

  // Try refresh token first
  if (tokenCache?.refreshToken) {
    try {
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: OAUTH_CLIENT_ID,
          client_secret: OAUTH_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: tokenCache.refreshToken,
        }).toString(),
        cache: 'no-store',
      });
      if (res.ok) {
        const d = await res.json();
        tokenCache = {
          accessToken: d.access_token,
          refreshToken: d.refresh_token,
          expiresAt: Date.now() + (d.expires_in || 3600) * 1000,
        };
        return d.access_token;
      }
    } catch {
      // Fall through to password grant
    }
    tokenCache = null;
  }

  // Password grant
  const username = process.env.HYDRAWISE_USERNAME;
  const password = process.env.HYDRAWISE_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'HYDRAWISE_USERNAME and HYDRAWISE_PASSWORD are required for suspend/resume'
    );
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
      grant_type: 'password',
      scope: 'all',
      username,
      password,
    }).toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Hydrawise login failed (${res.status}): ${errText}`
    );
  }

  const d = await res.json();
  tokenCache = {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    expiresAt: Date.now() + (d.expires_in || 3600) * 1000,
  };
  return d.access_token;
}

async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = await getOAuthToken();

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hydrawise GraphQL error (${res.status}): ${text}`);
  }

  const result = await res.json();
  if (result.errors?.length) {
    throw new Error(result.errors[0].message || 'GraphQL error');
  }

  return result.data as T;
}

// Controller + zone cache (stable data, rarely changes)
interface V2Controller {
  id: number;
  zones: { id: number; name: string }[];
}
let allControllersCache: V2Controller[] | null = null;

async function getAllControllers(): Promise<V2Controller[]> {
  if (allControllersCache) return allControllersCache;

  const data = await graphqlRequest<{
    me: {
      controllers: { id: number; zones: { id: number; name: string }[] }[];
    };
  }>(`query { me { controllers { id zones { id name } } } }`);

  if (!data.me.controllers.length) throw new Error('No Hydrawise controller found');
  allControllersCache = data.me.controllers;
  return allControllersCache;
}

// Match v1 name (truncated to 15 chars) to v2 full name
function zoneNamesMatch(v1Name: string, v2Name: string): boolean {
  const a = v1Name.trim();
  const b = v2Name.trim();
  return a === b || b.startsWith(a) || a.startsWith(b);
}

// Find the v2 controller that matches the v1 API zones
async function getMatchingController(): Promise<V2Controller> {
  const v1Data = await fetchWateringData();
  if (!v1Data.zones.length) throw new Error('No v1 zones found');

  const controllers = await getAllControllers();
  const v1Name = v1Data.zones[0].name.trim();

  for (const ctrl of controllers) {
    if (ctrl.zones.some((z) => zoneNamesMatch(v1Name, z.name))) {
      return ctrl;
    }
  }

  throw new Error('No v2 controller matches v1 zones');
}

function formatSuspendUntil(durationSeconds: number): string {
  const date = new Date(Date.now() + durationSeconds * 1000);
  const tz = 'Australia/Sydney';

  // Timezone offset
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const local = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  const diffMin = Math.round((local.getTime() - utc.getTime()) / 60000);
  const sign = diffMin >= 0 ? '+' : '-';
  const a = Math.abs(diffMin);
  const offset = `${sign}${String(Math.floor(a / 60)).padStart(2, '0')}${String(a % 60).padStart(2, '0')}`;

  // Extract date parts in target timezone
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    year: '2-digit',
    month: 'numeric',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const h = get('hour') === '24' ? '00' : get('hour');

  // pydrawise format: "Mon, 03 Mar 26 14:00:00 +1100"
  return `${get('weekday')}, ${get('day')} ${monthNames[parseInt(get('month')) - 1]} ${get('year')} ${h}:${get('minute')}:${get('second')} ${offset}`;
}

export async function suspendAllZonesV2(
  durationSeconds: number
): Promise<{ message: string }> {
  const { id: controllerId } = await getMatchingController();
  const until = formatSuspendUntil(durationSeconds);

  await graphqlRequest(
    `mutation($controllerId: Int!, $until: String!) {
      suspendAllZones(controllerId: $controllerId, until: $until) {
        status
        summary
      }
    }`,
    { controllerId, until }
  );

  return { message: 'All zones suspended' };
}

export async function resumeAllZonesV2(): Promise<{ message: string }> {
  const { id: controllerId } = await getMatchingController();

  await graphqlRequest(
    `mutation($controllerId: Int!) {
      resumeAllZones(controllerId: $controllerId) {
        status
        summary
      }
    }`,
    { controllerId }
  );

  return { message: 'All zones resumed' };
}

async function findV2ZoneId(
  relayId: number
): Promise<{ v2Id: number; name: string; controllerId: number }> {
  const v1Data = await fetchWateringData();
  const v1Zone = v1Data.zones.find((z) => z.relayId === relayId);
  if (!v1Zone) throw new Error(`Zone with relay ID ${relayId} not found`);

  const controllers = await getAllControllers();
  const v1Name = v1Zone.name.trim();

  for (const ctrl of controllers) {
    const v2Zone = ctrl.zones.find((z) => zoneNamesMatch(v1Name, z.name));
    if (v2Zone) {
      return { v2Id: v2Zone.id, name: v2Zone.name.trim(), controllerId: ctrl.id };
    }
  }

  throw new Error(`V2 zone for "${v1Name}" not found`);
}

export async function suspendZoneV2(
  relayId: number,
  durationSeconds: number
): Promise<{ message: string }> {
  const { v2Id, name } = await findV2ZoneId(relayId);
  const until = formatSuspendUntil(durationSeconds);

  await graphqlRequest(
    `mutation($zoneId: Int!, $until: String!) {
      suspendZone(zoneId: $zoneId, until: $until) {
        status
        summary
      }
    }`,
    { zoneId: v2Id, until }
  );

  return { message: `Zone "${name}" suspended` };
}

export async function resumeZoneV2(
  relayId: number
): Promise<{ message: string }> {
  const { v2Id, name } = await findV2ZoneId(relayId);

  await graphqlRequest(
    `mutation($zoneId: Int!) {
      resumeZone(zoneId: $zoneId) {
        status
        summary
      }
    }`,
    { zoneId: v2Id }
  );

  return { message: `Zone "${name}" resumed` };
}

// ── V2 Run/Stop (v1 setzone is broken for this controller) ───

export async function startZoneV2(
  relayId: number,
  durationSeconds?: number
): Promise<{ message: string }> {
  const { v2Id, name } = await findV2ZoneId(relayId);

  const vars: Record<string, unknown> = { zoneId: v2Id };
  if (durationSeconds) {
    vars.customRunDuration = durationSeconds;
  }

  await graphqlRequest(
    `mutation($zoneId: Int!, $customRunDuration: Int) {
      startZone(zoneId: $zoneId, customRunDuration: $customRunDuration) {
        status
        summary
      }
    }`,
    vars
  );

  return { message: `Zone "${name}" started` };
}

export async function stopZoneV2(
  relayId: number
): Promise<{ message: string }> {
  const { v2Id, name } = await findV2ZoneId(relayId);

  await graphqlRequest(
    `mutation($zoneId: Int!) {
      stopZone(zoneId: $zoneId) {
        status
        summary
      }
    }`,
    { zoneId: v2Id }
  );

  return { message: `Zone "${name}" stopped` };
}

export async function stopAllZonesV2(): Promise<{ message: string }> {
  const { id: controllerId } = await getMatchingController();

  await graphqlRequest(
    `mutation($controllerId: Int!) {
      stopAllZones(controllerId: $controllerId) {
        status
        summary
      }
    }`,
    { controllerId }
  );

  return { message: 'All zones stopped' };
}
