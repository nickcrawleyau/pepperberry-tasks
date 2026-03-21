# Fuel Prices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fuel prices panel showing live PDL, P91, and P98 prices from Berry, Shoalhaven Heads, and Bomaderry via the NSW FuelCheck API, with a fuel type selector, cheapest station highlighting, cost calculations, and 3-fetch history.

**Architecture:** Server component page fetches from FuelCheck API, stores prices in Supabase `fuel_prices` table, queries last 3 fetches for history, and passes structured data to an interactive client display component. 30-minute cache prevents excessive API calls. Follows existing Weather/Watering data panel pattern.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres), Tailwind CSS, NSW FuelCheck API (OAuth2)

**Spec:** `docs/superpowers/specs/2026-03-21-fuel-prices-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/20260321000000_create_fuel_prices.sql` | Create | DB table + index |
| `src/lib/fuel.ts` | Create | FuelCheck API client: OAuth token, fetch prices, store to DB, query history |
| `src/components/fuel/FuelDisplay.tsx` | Create | Interactive UI: fuel selector, sections, station cards, cost calcs |
| `src/app/fuel/page.tsx` | Create | Server component: auth, permission, data fetch, render |
| `src/app/fuel/loading.tsx` | Create | Loading skeleton |
| `src/app/dashboard/page.tsx` | Modify (lines 222-242) | Add Fuel nav button after Weather |
| `src/app/admin/users/UserManagement.tsx` | Modify (line 23-30) | Add `fuel` to SECTIONS array |
| `CLAUDE.md` | Modify | Add `fuel_prices` table to schema docs + env vars |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260321000000_create_fuel_prices.sql`
- Modify: `CLAUDE.md` (schema section)

- [ ] **Step 1: Create migration file**

```sql
-- Migration: Create fuel_prices table for caching FuelCheck API responses
-- Created: 2026-03-21
-- Rollback: DROP TABLE IF EXISTS public.fuel_prices;

CREATE TABLE IF NOT EXISTS public.fuel_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  station_code TEXT NOT NULL,
  station_name TEXT NOT NULL,
  station_brand TEXT NOT NULL,
  suburb TEXT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('U91', 'P98', 'PDL')),
  price NUMERIC NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient history queries (last N fetches per station+fuel_type)
CREATE INDEX idx_fuel_prices_lookup ON public.fuel_prices (station_code, fuel_type, fetched_at DESC);

-- Index for cache freshness check
CREATE INDEX idx_fuel_prices_fetched_at ON public.fuel_prices (fetched_at DESC);

-- No RLS needed — read-only data, access controlled at app level
```

Write this to `supabase/migrations/20260321000000_create_fuel_prices.sql`.

- [ ] **Step 2: Update CLAUDE.md schema section and env vars**

Add after the `shopping_items` table section in `CLAUDE.md`:

```markdown
### `fuel_prices`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| station_code | text | Unique station identifier from FuelCheck API |
| station_name | text | Station display name |
| station_brand | text | Brand (Shell, Caltex, etc.) |
| suburb | text | Berry, Shoalhaven Heads, or Bomaderry |
| fuel_type | text | `U91`, `P98`, or `PDL` |
| price | numeric | Price in cents per litre (e.g. 189.9) |
| fetched_at | timestamptz | When this price was fetched |
```

Also add to the Environment Variables section in `CLAUDE.md`:

```
FUELCHECK_CONSUMER_KEY=           # NSW FuelCheck API consumer key (api.nsw.gov.au)
FUELCHECK_CONSUMER_SECRET=        # NSW FuelCheck API consumer secret
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260321000000_create_fuel_prices.sql CLAUDE.md
git commit -m "Add fuel_prices table migration and schema docs"
```

---

### Task 2: FuelCheck API Client Library

**Files:**
- Create: `src/lib/fuel.ts`

This is the core data layer. It handles OAuth2 token exchange, fetching prices from FuelCheck API, storing results in Supabase, querying history, and data retention cleanup.

- [ ] **Step 1: Create `src/lib/fuel.ts` with types and token management**

```typescript
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
```

- [ ] **Step 2: Add API fetch function**

Append to `src/lib/fuel.ts`:

```typescript
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
```

- [ ] **Step 3: Add cache check, store, cleanup, and main fetch function**

Append to `src/lib/fuel.ts`:

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/fuel.ts
git commit -m "Add FuelCheck API client with OAuth, caching, and history"
```

---

### Task 3: FuelDisplay Client Component

**Files:**
- Create: `src/components/fuel/FuelDisplay.tsx`

This is the interactive UI component. It renders the fuel type selector, three fuel sections (PDL/P91/P98), station cards with history, cost calculations, and cheapest station highlighting.

- [ ] **Step 1: Create `src/components/fuel/FuelDisplay.tsx`**

```typescript
'use client';

import { useState } from 'react';
import type { FuelData, FuelStationPrice } from '@/lib/fuel';

type FuelType = 'PDL' | 'U91' | 'P98';

const FUEL_LABELS: Record<FuelType, string> = {
  PDL: 'Premium Diesel (PDL)',
  U91: 'P91',
  P98: 'P98',
};

const FUEL_CALC: Record<FuelType, { litres: number; label: string }> = {
  PDL: { litres: 70, label: '70L' },
  U91: { litres: 150, label: '6 × 25L' },
  P98: { litres: 80, label: '80L' },
};

function formatPrice(centsPerLitre: number): string {
  return centsPerLitre.toFixed(1);
}

function formatCost(centsPerLitre: number, litres: number): string {
  return (centsPerLitre * litres / 100).toFixed(2);
}

function timeAgo(isoDate: string): string {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

interface FuelSectionProps {
  fuelType: FuelType;
  stations: FuelStationPrice[];
  isSelected: boolean;
}

function CostCard({ fuelType, cheapestPrice }: { fuelType: FuelType; cheapestPrice: number }) {
  const calc = FUEL_CALC[fuelType];
  return (
    <div className="bg-fw-surface/50 rounded-lg px-4 py-3 mb-3">
      <p className="text-sm text-fw-text/70">
        <span className="font-medium text-fw-text">{calc.label}</span>
        {' '}@ {formatPrice(cheapestPrice)}c/L ={' '}
        <span className="font-bold text-fw-text text-base">${formatCost(cheapestPrice, calc.litres)}</span>
      </p>
    </div>
  );
}

function StationCard({
  stationPrice,
  isCheapest,
  isSelected,
}: {
  stationPrice: FuelStationPrice;
  isCheapest: boolean;
  isSelected: boolean;
}) {
  return (
    <div
      className={`bg-fw-surface rounded-xl p-4 ${
        isCheapest && isSelected ? 'border-2 border-fw-accent' : 'border border-fw-surface'
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div>
          <span className="text-sm font-medium text-fw-text">{stationPrice.station.brand}</span>
          <span className="text-xs text-fw-text/50 ml-2">{stationPrice.station.suburb}</span>
        </div>
        {isCheapest && isSelected && (
          <span className="text-xs font-medium text-fw-accent">Cheapest</span>
        )}
      </div>
      <p className="text-2xl font-bold text-fw-text mb-2">
        {formatPrice(stationPrice.currentPrice)}
        <span className="text-sm font-normal text-fw-text/50 ml-1">c/L</span>
      </p>
      {stationPrice.history.length > 0 && (
        <div className="border-t border-fw-text/10 pt-2 space-y-1">
          {stationPrice.history.map((h, i) => (
            <div key={i} className="flex justify-between text-sm text-fw-text/70">
              <span>{timeAgo(h.fetchedAt)}</span>
              <span>{formatPrice(h.price)} c/L</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FuelSection({ fuelType, stations, isSelected }: FuelSectionProps) {
  if (stations.length === 0) {
    return (
      <div className={`mb-6 ${!isSelected ? 'opacity-60' : ''}`}>
        <h2 className={`text-base font-semibold text-fw-text mb-3 pl-3 ${
          isSelected ? 'border-l-4 border-fw-accent' : 'border-l-4 border-transparent'
        }`}>
          {FUEL_LABELS[fuelType]}
        </h2>
        <p className="text-sm text-fw-text/50 px-3">No stations found</p>
      </div>
    );
  }

  const cheapestPrice = stations[0].currentPrice; // Already sorted cheapest first

  return (
    <div className={`mb-6 ${!isSelected ? 'opacity-60' : ''}`}>
      <h2 className={`text-base font-semibold text-fw-text mb-3 pl-3 ${
        isSelected ? 'border-l-4 border-fw-accent' : 'border-l-4 border-transparent'
      }`}>
        {FUEL_LABELS[fuelType]}
      </h2>
      <CostCard fuelType={fuelType} cheapestPrice={cheapestPrice} />
      <div className="space-y-3">
        {stations.map((sp) => (
          <StationCard
            key={sp.station.stationCode}
            stationPrice={sp}
            isCheapest={sp.currentPrice === cheapestPrice}
            isSelected={isSelected}
          />
        ))}
      </div>
    </div>
  );
}

export default function FuelDisplay({ data }: { data: FuelData }) {
  const [selected, setSelected] = useState<FuelType>('PDL');

  const sections: { type: FuelType; stations: FuelStationPrice[] }[] = [
    { type: 'PDL', stations: data.pdl },
    { type: 'U91', stations: data.u91 },
    { type: 'P98', stations: data.p98 },
  ];

  // Stale data warning if fetched > 30 mins ago
  const fetchedAge = Date.now() - new Date(data.fetchedAt).getTime();
  const isStale = fetchedAge > 30 * 60 * 1000;

  return (
    <div>
      {isStale && (
        <div className="bg-yellow-900/30 border border-yellow-600/40 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-200">
          Showing cached prices from {timeAgo(data.fetchedAt)}. Live update failed.
        </div>
      )}
      {/* Sticky fuel type selector */}
      <div className="sticky top-[73px] z-20 bg-fw-bg pb-4 pt-1">
        <div className="flex gap-2">
          {(['PDL', 'U91', 'P98'] as FuelType[]).map((ft) => (
            <button
              key={ft}
              onClick={() => setSelected(ft)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                selected === ft
                  ? 'bg-fw-accent text-white'
                  : 'bg-fw-surface text-fw-text/70 hover:text-fw-text'
              }`}
            >
              {ft === 'U91' ? 'P91' : ft}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel sections */}
      {sections.map(({ type, stations }) => (
        <FuelSection
          key={type}
          fuelType={type}
          stations={stations}
          isSelected={selected === type}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/fuel/FuelDisplay.tsx
git commit -m "Add FuelDisplay client component with selector, cards, and cost calcs"
```

---

### Task 4: Fuel Page and Loading Skeleton

**Files:**
- Create: `src/app/fuel/page.tsx`
- Create: `src/app/fuel/loading.tsx`

- [ ] **Step 1: Create `src/app/fuel/loading.tsx`**

```typescript
import LoadingScreen from '@/components/LoadingScreen';
export default function Loading() {
  return <LoadingScreen />;
}
```

- [ ] **Step 2: Create `src/app/fuel/page.tsx`**

Follow the exact pattern from `src/app/weather/page.tsx`:

```typescript
import { getSession, getSessionExpiry } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchFuelData } from '@/lib/fuel';
import FuelDisplay from '@/components/fuel/FuelDisplay';
import SessionTimer from '@/components/SessionTimer';
import LogoutButton from '@/components/LogoutButton';
import UnreadBadges from '@/components/UnreadBadges';

export default async function FuelPage() {
  const session = await getSession();
  if (!session) redirect('/');
  if (session.role !== 'admin' && !session.allowedSections?.includes('fuel')) redirect('/dashboard');

  const sessionExpiry = await getSessionExpiry();

  let fuelData;
  let error = false;

  try {
    fuelData = await fetchFuelData();
  } catch {
    error = true;
  }

  return (
    <div className="min-h-screen bg-fw-bg">
      <header className="bg-fw-surface border-b border-fw-surface sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-fw-text/50 hover:text-fw-text/80 transition p-2 -m-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/dashboard">
              <img src="/PBLogo.png" alt="Pepperberry" className="w-7 h-7 object-contain" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-medium text-fw-text truncate">Fuel Prices</h1>
              {fuelData && (
                <p className="text-xs text-fw-text/50">
                  FuelCheck NSW &middot; Updated{' '}
                  {new Date(fuelData.fetchedAt).toLocaleTimeString('en-AU', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Australia/Sydney',
                  })}
                </p>
              )}
            </div>
          </div>
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-sm font-medium text-fw-text hidden sm:block">{session.name}</p>
            {sessionExpiry && <SessionTimer expiresAt={sessionExpiry} />}
          </div>
          <UnreadBadges />
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        {error || !fuelData ? (
          <div className="bg-fw-surface rounded-xl border border-fw-surface p-8 text-center">
            <svg
              className="w-12 h-12 mx-auto text-fw-text/30 mb-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm font-medium text-fw-text/80 mb-1">Fuel prices unavailable</p>
            <p className="text-xs text-fw-text/50">Please try again later.</p>
          </div>
        ) : (
          <FuelDisplay data={fuelData} />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/fuel/page.tsx src/app/fuel/loading.tsx
git commit -m "Add fuel prices page and loading skeleton"
```

---

### Task 5: Dashboard Navigation + User Management

**Files:**
- Modify: `src/app/dashboard/page.tsx` (insert after Weather nav link, ~line 222)
- Modify: `src/app/admin/users/UserManagement.tsx` (add `fuel` to SECTIONS, ~line 29)

- [ ] **Step 1: Add Fuel nav button to dashboard**

In `src/app/dashboard/page.tsx`, insert the following block immediately AFTER the Weather `</Link>` closing tag (after line 222) and BEFORE the Watering conditional block (line 223):

```tsx
          {(session.role === 'admin' || session.allowedSections?.includes('fuel')) && (
            <Link
              href="/fuel"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
                <path d="M13 10h4a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 4" />
                <path d="M3 22h10" />
                <path d="M7 2v4" />
              </svg>
              Fuel
            </Link>
          )}
```

This SVG is the Lucide "fuel" icon, matching the existing icon style in the nav.

- [ ] **Step 2: Add `fuel` to SECTIONS in UserManagement**

In `src/app/admin/users/UserManagement.tsx`, add to the SECTIONS array (after the `logbook` entry at ~line 29):

```typescript
  { value: 'fuel', label: 'Fuel' },
```

So the full array becomes:
```typescript
const SECTIONS = [
  { value: 'new_job', label: 'New Job' },
  { value: 'weather', label: 'Weather' },
  { value: 'watering', label: 'Watering' },
  { value: 'cart', label: 'Cart' },
  { value: 'chat', label: 'Messages' },
  { value: 'logbook', label: 'Notes' },
  { value: 'fuel', label: 'Fuel' },
] as const;
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/admin/users/UserManagement.tsx
git commit -m "Add Fuel nav button to dashboard and fuel section to user management"
```

---

### Task 6: Verify and Test

- [ ] **Step 1: Run the full build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run existing tests**

Run: `npm test`
Expected: All 505+ existing tests pass

- [ ] **Step 3: Manual smoke test** (requires FuelCheck API credentials)

1. Add `FUELCHECK_CONSUMER_KEY` and `FUELCHECK_CONSUMER_SECRET` to `.env.local`
2. Run `npm run dev`
3. Log in as admin
4. Navigate to `/fuel` — should show fuel prices or error if no API creds
5. Check dashboard — Fuel button should appear after Weather
6. Check `/admin/users` — Fuel should appear in section checkboxes

- [ ] **Step 4: Push the migration**

Run: `npx supabase db push --linked --include-all`
Expected: Migration applies successfully

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "Fix any issues found during testing"
```
