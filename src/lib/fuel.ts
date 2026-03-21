import { supabaseAdmin } from '@/lib/supabase/admin';

// --- Types ---

export interface FuelStation {
  stationCode: string;
  name: string;
  brand: string;
  suburb: string;
}

export interface FuelPriceHistory {
  price: number;
  fetchedAt: string;
}

export interface FuelStationPrice {
  station: FuelStation;
  currentPrice: number;
  history: FuelPriceHistory[];
}

export interface FuelData {
  pdl: FuelStationPrice[];
  u91: FuelStationPrice[];
  p98: FuelStationPrice[];
  fetchedAt: string;
}

// --- OAuth2 Token Cache ---

const FUELCHECK_AUTH_URL = 'https://api.onegov.nsw.gov.au/oauth/client_credential/accesstoken?grant_type=client_credentials';
const FUELCHECK_PRICES_URL = 'https://api.onegov.nsw.gov.au/FuelCheckApp/v1/fuel/prices/bylocation';

const FUEL_TYPES = ['U91', 'P98', 'PDL'] as const;
const SUBURBS = ['Berry', 'Shoalhaven Heads', 'Bomaderry'] as const;
const CACHE_MINUTES = 30;
const RETENTION_DAYS = 14;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const key = process.env.FUELCHECK_CONSUMER_KEY;
  const secret = process.env.FUELCHECK_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error('FUELCHECK_CONSUMER_KEY and FUELCHECK_CONSUMER_SECRET must be set');
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch(FUELCHECK_AUTH_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`FuelCheck auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
  return cachedToken.token;
}

// --- FuelCheck API Types ---

interface FuelCheckStation {
  code: string;
  name: string;
  brand: string;
  address: string;
}

interface FuelCheckPrice {
  stationcode: string;
  fueltype: string;
  price: number;
  lastupdated: string;
}

interface FuelCheckResponse {
  stations: FuelCheckStation[];
  prices: FuelCheckPrice[];
}

async function fetchPricesFromAPI(fuelType: string, suburb: string): Promise<{
  stations: FuelCheckStation[];
  prices: FuelCheckPrice[];
}> {
  const token = await getAccessToken();
  const apiKey = process.env.FUELCHECK_CONSUMER_KEY!;

  const res = await fetch(FUELCHECK_PRICES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': apiKey,
      'Content-Type': 'application/json',
      'transactionid': crypto.randomUUID(),
      'requesttimestamp': new Date().toISOString(),
    },
    body: JSON.stringify({ fueltype: fuelType, suburb }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`FuelCheck API failed for ${fuelType}/${suburb}: ${res.status}`);
  }

  return res.json() as Promise<FuelCheckResponse>;
}

// --- Cache, Store, Cleanup ---

async function isCacheFresh(): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('fuel_prices')
    .select('fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return false;

  const lastFetch = new Date(data[0].fetched_at).getTime();
  return Date.now() - lastFetch < CACHE_MINUTES * 60 * 1000;
}

async function storePrices(
  stations: FuelCheckStation[],
  prices: FuelCheckPrice[],
  fuelType: string,
  suburb: string,
  fetchedAt: string
): Promise<void> {
  const stationMap = new Map(stations.map(s => [s.code, s]));

  const rows = prices
    .filter(p => stationMap.has(p.stationcode))
    .map(p => {
      const station = stationMap.get(p.stationcode)!;
      return {
        station_code: p.stationcode,
        station_name: station.name,
        station_brand: station.brand,
        suburb,
        fuel_type: fuelType,
        price: p.price,
        fetched_at: fetchedAt,
      };
    });

  if (rows.length > 0) {
    await supabaseAdmin.from('fuel_prices').insert(rows);
  }
}

async function cleanupOldPrices(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from('fuel_prices').delete().lt('fetched_at', cutoff);
}

async function queryHistory(): Promise<FuelData> {
  // Get recent prices, ordered by fetched_at desc (bounded to prevent loading too many rows)
  const { data, error } = await supabaseAdmin
    .from('fuel_prices')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(`Failed to query fuel prices: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No fuel price data available');

  const latestFetchedAt = data[0].fetched_at;

  // Group by fuel_type -> station_code
  const grouped: Record<string, Record<string, {
    station: FuelStation;
    prices: FuelPriceHistory[];
  }>> = {};

  for (const row of data) {
    if (!grouped[row.fuel_type]) grouped[row.fuel_type] = {};
    const byStation = grouped[row.fuel_type];

    if (!byStation[row.station_code]) {
      byStation[row.station_code] = {
        station: {
          stationCode: row.station_code,
          name: row.station_name,
          brand: row.station_brand,
          suburb: row.suburb,
        },
        prices: [],
      };
    }

    // Keep up to 4 entries (1 current + 3 history)
    if (byStation[row.station_code].prices.length < 4) {
      byStation[row.station_code].prices.push({
        price: Number(row.price),
        fetchedAt: row.fetched_at,
      });
    }
  }

  function buildSection(fuelType: string): FuelStationPrice[] {
    const stations = grouped[fuelType] || {};
    return Object.values(stations)
      .map(({ station, prices }) => ({
        station,
        currentPrice: prices[0].price,
        history: prices.slice(1), // Skip current, keep up to 3 previous
      }))
      .sort((a, b) => a.currentPrice - b.currentPrice); // Cheapest first
  }

  return {
    pdl: buildSection('PDL'),
    u91: buildSection('U91'),
    p98: buildSection('P98'),
    fetchedAt: latestFetchedAt,
  };
}

export async function fetchFuelData(): Promise<FuelData> {
  const fresh = await isCacheFresh();

  if (!fresh) {
    const fetchedAt = new Date().toISOString();

    // Fetch all combinations from FuelCheck API
    for (const fuelType of FUEL_TYPES) {
      for (const suburb of SUBURBS) {
        try {
          const { stations, prices } = await fetchPricesFromAPI(fuelType, suburb);
          await storePrices(stations, prices, fuelType, suburb, fetchedAt);
        } catch (err) {
          console.error(`Failed to fetch ${fuelType} for ${suburb}:`, err);
          // Continue with other combinations even if one fails
        }
      }
    }

    // Cleanup old data
    await cleanupOldPrices();
  }

  return queryHistory();
}
