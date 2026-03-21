# Fuel Prices Feature — Design Spec

## Overview

A fuel prices panel for Pepperberry Tasks that shows live prices from Berry, Shoalhaven Heads, and Bomaderry service stations. Users select which fuel type they care about, and the cheapest station is highlighted. Historical prices from the last 3 distinct fetches are shown beneath each station's live price.

## Data Source

- **NSW FuelCheck API** (api.nsw.gov.au)
- OAuth2 authentication using consumer key + secret (free registration)
- Fetches prices for suburbs: Berry, Shoalhaven Heads, Bomaderry
- Fuel types queried: `U91` (displayed as P91), `P98`, `PDL`
- API returns current prices only — history is built by storing each fetch

### FuelCheck API Details

**Auth endpoint:** `POST https://api.onegov.nsw.gov.au/oauth/client_credential/accesstoken?grant_type=client_credentials`
- Header: `Authorization: Basic base64(key:secret)`
- Returns: `{ access_token, token_type, expires_in }`
- Token valid ~12 hours

**Prices endpoint:** `GET https://api.onegov.nsw.gov.au/FuelCheckApp/v1/fuel/prices/bylocation`
- Headers: `Authorization: Bearer {token}`, `apikey: {consumer_key}`, `Content-Type: application/json`, `transactionid: {uuid}`, `requesttimestamp: {ISO date}`
- Body (POST): `{ fueltype: "U91", suburb: "Berry" }`
- Returns array of station prices: `{ stations: [{ code, name, brand, address, suburb, ... }], prices: [{ stationcode, fueltype, price, lastupdated }] }`

**Call strategy:** 3 fuel types x 3 suburbs = 9 API calls per fresh fetch. With 5/min rate limit, batch sequentially with no delay (9 calls complete in ~2-3 seconds).

**OAuth token caching:** Store token in module-level variable with expiry timestamp. Reuse until expired, then re-authenticate. Token exchange does not count against rate limit.

### Environment Variables

```
FUELCHECK_CONSUMER_KEY=   # OAuth2 consumer key from api.nsw.gov.au
FUELCHECK_CONSUMER_SECRET= # OAuth2 consumer secret
```

## Database

### `fuel_prices` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| station_code | text | Unique station identifier from API |
| station_name | text | Station name from API |
| station_brand | text | Brand (Shell, Caltex, etc.) |
| suburb | text | Berry, Shoalhaven Heads, or Bomaderry |
| fuel_type | text | `U91`, `P98`, or `PDL` |
| price | numeric | Price in cents per litre (e.g. 189.9) |
| fetched_at | timestamptz | When this price was fetched |

No RLS needed — read-only data, access controlled at API/page level.

Index on `(station_code, fuel_type, fetched_at DESC)` for efficient history queries.

### Data Retention

Keep only the last 14 days of data. A Supabase cron job or the fetch function itself deletes rows where `fetched_at < now() - interval '14 days'` on each fresh fetch.

## Types

```typescript
interface FuelStation {
  stationCode: string;
  name: string;
  brand: string;
  suburb: string;
}

interface FuelPrice {
  stationCode: string;
  fuelType: 'U91' | 'P98' | 'PDL';
  price: number;       // cents per litre, e.g. 189.9
  fetchedAt: string;   // ISO timestamp
}

interface FuelStationPrice {
  station: FuelStation;
  currentPrice: number;       // cents per litre
  history: {                  // last 3 distinct fetches
    price: number;
    fetchedAt: string;
  }[];
}

interface FuelDisplayProps {
  data: {
    pdl: FuelStationPrice[];
    u91: FuelStationPrice[];
    p98: FuelStationPrice[];
  };
  fetchedAt: string;           // ISO timestamp of most recent fetch
}
```

## Architecture

Follows the existing Weather/Watering data panel pattern:

### Files

| File | Type | Purpose |
|------|------|---------|
| `src/lib/fuel.ts` | Server lib | FuelCheck API client: OAuth token exchange, fetch prices by suburb, types |
| `src/app/fuel/page.tsx` | Server Component | Auth/permission check, fetch fresh prices, store to DB, query history, render |
| `src/components/fuel/FuelDisplay.tsx` | Client Component | Interactive UI: fuel selector, station cards, cost calcs |
| `src/app/fuel/loading.tsx` | Server Component | `<LoadingScreen />` skeleton |
| `supabase/migrations/XXXXXX_add_fuel_prices.sql` | Migration | Create `fuel_prices` table |

### Data Flow

1. User navigates to `/fuel`
2. Server component checks auth + `allowed_sections` includes `'fuel'`
3. Check most recent `fetched_at` in DB — if < 30 minutes old, skip API call
4. If stale: `fetchFuelPrices()` calls FuelCheck API for U91, P98, PDL across Berry, Shoalhaven Heads, Bomaderry
5. Fresh prices inserted into `fuel_prices` table; old rows (>14 days) pruned
6. Last 3 distinct `fetched_at` timestamps per station+fuel_type queried from DB for history
7. Data passed to `<FuelDisplay />` client component

### Rate Limiting

FuelCheck free tier: 2,500 calls/month, max 5/minute.
- 9 API calls per fresh fetch (3 fuel types x 3 suburbs)
- 30-minute cache means max ~48 fresh fetches/day = ~432 calls/day
- In practice, much lower — pages only fetched when someone visits
- Well within 2,500/month for a 2-admin household app

## UI Design

### Page Layout

Standard Pepperberry page structure:
- Sticky header: back button, PB logo, "Fuel Prices", session timer, user name, logout
- Subtitle: "FuelCheck NSW · Updated {time}"

### Fuel Type Selector

Top of page, 3 toggle buttons in a row (full-width on mobile, evenly spaced):
- **PDL** | **P91** | **P98**
- Selected button uses `bg-fw-accent` styling
- Unselected buttons use `bg-fw-surface` styling
- Default selection: **PDL** (most common fill). All sections visible, PDL highlighted.
- Selector is sticky below header so users can switch without scrolling back up

### Section Layout

Three sections displayed vertically, always visible, in order: **PDL**, **P91**, **P98**.

**Selected section:**
- Section heading with accent left border (`border-l-4 border-fw-accent`)
- Full brightness text and cards
- Cost calculation card prominently displayed
- Cheapest station highlighted with accent border (`border-fw-accent`)

**Unselected sections:**
- Same layout but subdued: reduced opacity (`opacity-60`) on the entire section
- No cheapest-station highlighting
- Cost calculation still visible but de-emphasized

### Cost Calculation Cards

Displayed at the top of each fuel type section:

| Fuel Type | Calculation | Display |
|-----------|-------------|---------|
| PDL | cheapest price × 70L | "70L @ 189.9c/L = $132.93" |
| P91 | cheapest price × 150L (6 × 25L) | "6 × 25L @ 179.9c/L = $269.85" |
| P98 | cheapest price × 80L | "80L @ 199.9c/L = $159.92" |

Uses the cheapest current price across all stations in that fuel type section.

### Station Cards

Each station card within a section shows:

```
[Brand]  [Suburb]
189.9 c/L                       <- live price, large font
---
Previous:
  2h ago: 191.5
  Yesterday: 189.9
  2 days ago: 192.3
```

- Sorted cheapest first within each section
- Cheapest station in selected fuel type gets `border-2 border-fw-accent`
- **Prices displayed in cents per litre** with one decimal (e.g. "189.9") — Australian convention
- **Cost totals displayed in dollars** (e.g. "$132.93")
- History shows the last 3 distinct `fetched_at` timestamps with relative time labels
- History entries with the same price as current are still shown (price may have been confirmed unchanged)
- If a station doesn't sell that fuel type, it doesn't appear in that section

### Mobile Layout

- Fuel type selector buttons fill the row evenly, ~33% each
- Station cards stack vertically, full width
- Selector sticks below header for easy switching while scrolling
- All text readable at mobile sizes — prices use `text-2xl`, history uses `text-sm`

### Navigation

Dashboard nav button labeled "Fuel" with a fuel pump icon (inline SVG), positioned after Weather:
```
... | Weather | Fuel | Watering | ...
```

Permission check: `session.role === 'admin' || session.allowedSections?.includes('fuel')`

## Permissions

- Access controlled by `allowed_sections` array on user record
- Section key: `'fuel'`
- Admins always have access
- Admin manages per-user access in `/admin/users`

## Styling

Forest Whispers dark theme throughout:
- Page bg: `bg-fw-bg`
- Cards: `bg-fw-surface rounded-xl`
- Selected fuel button: `bg-fw-accent text-white`
- Cheapest station highlight: `border-2 border-fw-accent`
- Subdued sections: `opacity-60`
- Prices: `text-2xl font-bold text-fw-text`
- History prices: `text-fw-text/70 text-sm`

## Edge Cases

- **Station has no price for a fuel type:** Omit station from that section
- **API unavailable:** Show cached data from DB with "Last updated {time}" warning banner
- **No cached data and API fails:** Show error card ("Fuel prices unavailable")
- **No stations found for a fuel type:** Show "No stations found" in that section
- **First ever load (empty DB):** Fetch from API, if that fails show error
- **Duplicate prices:** If a fresh fetch returns the same price as the previous fetch for a station, still store it (confirms price unchanged)
- **Station code changes:** Use `station_code` from API as stable identifier, not name
