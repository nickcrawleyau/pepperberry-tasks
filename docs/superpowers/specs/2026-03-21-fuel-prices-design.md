# Fuel Prices Feature — Design Spec

## Overview

A fuel prices panel for Pepperberry Tasks that shows live prices from Berry, Shoalhaven Heads, and Bomaderry service stations. Users select which fuel type they care about, and the cheapest station is highlighted. Historical prices from the last 3 API fetches are shown beneath each station's live price.

## Data Source

- **NSW FuelCheck API** (api.nsw.gov.au)
- OAuth2 authentication using consumer key + secret (free registration)
- Fetches prices for suburbs: Berry, Shoalhaven Heads, Bomaderry
- Fuel types queried: `U91` (displayed as P91), `P98`, `PDL`
- API returns current prices only — history is built by storing each fetch

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
| station_name | text | Station name from API |
| station_brand | text | Brand (Shell, Caltex, etc.) |
| suburb | text | Berry, Shoalhaven Heads, or Bomaderry |
| fuel_type | text | `U91`, `P98`, or `PDL` |
| price | numeric | Price in cents per litre |
| fetched_at | timestamptz | When this price was fetched |

No RLS needed — read-only data, access controlled at API/page level.

Index on `(station_name, fuel_type, fetched_at DESC)` for efficient history queries.

## Architecture

Follows the existing Weather/Watering data panel pattern:

### Files

| File | Type | Purpose |
|------|------|---------|
| `src/lib/fuel.ts` | Server lib | FuelCheck API client: OAuth token exchange, fetch prices by suburb, types |
| `src/app/fuel/page.tsx` | Server Component | Auth/permission check, fetch fresh prices, store to DB, query history, render |
| `src/components/fuel/FuelDisplay.tsx` | Client Component | Interactive UI: fuel selector, station cards, cost calcs |
| `src/app/fuel/loading.tsx` | Server Component | `<LoadingScreen />` skeleton |
| `src/app/api/fuel/route.ts` | API Route | Optional endpoint for client-side refresh |
| `supabase/migrations/XXXXXX_add_fuel_prices.sql` | Migration | Create `fuel_prices` table |

### Data Flow

1. User navigates to `/fuel`
2. Server component checks auth + `allowed_sections` includes `'fuel'`
3. `fetchFuelPrices()` calls FuelCheck API for U91, P98, PDL across Berry, Shoalhaven Heads, Bomaderry
4. Fresh prices are inserted into `fuel_prices` table
5. Last 3 fetches per station+fuel_type are queried from DB
6. Data passed to `<FuelDisplay />` client component

### Rate Limiting Consideration

FuelCheck free tier: 2,500 calls/month, max 5/minute. Each page load makes 3 API calls (one per fuel type) x 3 suburbs = up to 9 calls. To stay within limits:
- Cache the fetch: if the most recent `fetched_at` for any record is < 30 minutes old, skip the API call and serve from DB
- This means ~80 fresh fetches/day max if someone hammers the page, well within 2,500/month

## UI Design

### Page Layout

Standard Pepperberry page structure:
- Sticky header: back button, PB logo, "Fuel Prices", session timer, user name, logout
- Subtitle: "FuelCheck NSW - Updated {time}"

### Fuel Type Selector

Top of page, 3 toggle buttons in a row:
- **PDL** | **P91** | **P98**
- Selected button uses `bg-fw-accent` styling
- Unselected buttons use `bg-fw-surface` styling
- Default selection: none (all sections equal prominence until user picks)

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
| PDL | cheapest price x 70L | "70L @ {price}c/L = ${total}" |
| P91 | cheapest price x 150L (6 x 25L) | "6 x 25L @ {price}c/L = ${total}" |
| P98 | cheapest price x 80L | "80L @ {price}c/L = ${total}" |

Uses the cheapest current price across all stations in that fuel type section.

### Station Cards

Each station card within a section shows:

```
[Brand Logo/Name]  [Suburb]
$X.XX /L                        <- live price, large font
---
3-day history:
  {date/time}: $X.XX
  {date/time}: $X.XX
  {date/time}: $X.XX
```

- Sorted cheapest first within each section
- Cheapest station in selected fuel type gets `border-fw-accent` border
- Price in dollars (converted from cents), 1 decimal place (e.g. $1.82/L... actually fuel prices use 1 decimal of cents, so display as e.g. "189.9" cpl or "$1.899/L")
- History entries show relative time ("2h ago", "Yesterday 3pm") and price
- If a station doesn't sell that fuel type, it doesn't appear in that section

### Navigation

Dashboard button labeled "Fuel", positioned after Weather:
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
- Prices: large text, `text-fw-text`
- History prices: `text-fw-text/70 text-sm`

## Edge Cases

- **Station has no price for a fuel type:** Omit station from that section
- **API unavailable:** Show cached data from DB with "Last updated {time}" warning banner
- **No cached data and API fails:** Show error card ("Fuel prices unavailable")
- **No stations found:** Show info message
- **First ever load (empty DB):** Fetch from API, if that fails show error
