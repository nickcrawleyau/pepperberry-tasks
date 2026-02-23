# Pepperberry Farm Task Board

## Project Overview

A property management web app for **Pepperberry** — a private home property in Coolangatta, NSW, Australia. The property includes multiple paddocks, a workshop, a house and driveway. The eastern paddocks are leased to **Regal Riding School**.

The app lets the two owners (admins) assign and track jobs across the property, manage a shared shopping list, and monitor local weather. Tradies (fencers, plumbers, electricians, handymen, landscapers, housekeepers, animal carers) log in to see only their assigned work. Regal Riding staff see only riding-school-related tasks.

### Horses

The eastern paddocks are leased for agistment — the agisted horses are a separate concern and not managed by the farm. Pepperberry owns 3 horses (PB horses). Staff from Regal Riding come to feed the PB horses. The `riding_school` role in the app exists solely for these staff to see and update tasks related to PB horse care (feeding, etc.).

### Tradie Workflow

**Key domain concept:** Tradies are **not permanent staff**. They come for specific jobs and might not return for weeks. The typical workflow is:
1. Admin identifies a job that needs doing (e.g. fence repair in western paddock)
2. Admin creates a job and assigns it to the relevant tradie
3. Admin can create a job with a repeating schedule (daily, weekly, fortnightly, monthly) with a start and end date
4. Tradie logs in (often on their phone on-site), sees their assigned jobs
5. Tradie updates status and adds photos/comments as they work
6. Admin reviews completed work and can close a job or mark as incomplete and add comments
7. Both admin and tradies can add up to 5 photos to jobs

The system must be simple enough for someone to log in on a phone, check their tasks, and mark them done. No training should be required.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (Postgres) with Row Level Security (RLS)
- **Storage:** Supabase Storage (for task photos)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Auth:** Custom name + 4-digit PIN (no email/password, no Supabase Auth)
- **Weather:** Open-Meteo API (current conditions, 7-day forecast, rainfall history)
- **Radar:** Windy.com embed (Wollongong region)
- **PWA:** Service worker for offline support and push notifications

## Project Structure

```
pepperberry-tasks/
├── CLAUDE.md
├── .env.local                  # Environment variables (gitignored)
├── .eslintrc.json
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   ├── PBLogo.png              # App logo
│   ├── sw.js                   # Service worker (push + offline only, no fetch caching)
│   └── offline.html            # Offline fallback page
├── supabase/
│   ├── config.toml
│   └── migrations/             # Numbered SQL migrations
└── src/
    ├── middleware.ts            # Auth middleware (route protection, JWT validation)
    ├── app/
    │   ├── page.tsx             # Login page (root route)
    │   ├── layout.tsx           # Root layout
    │   ├── set-pin/             # First-login PIN setup
    │   ├── dashboard/           # Main dashboard (job list, stats, nav)
    │   │   ├── page.tsx
    │   │   ├── loading.tsx
    │   │   └── LogoutButton.tsx
    │   ├── tasks/
    │   │   ├── loading.tsx
    │   │   ├── [id]/page.tsx        # Job detail view
    │   │   ├── [id]/edit/           # Edit job form
    │   │   └── new/                 # Create job form
    │   ├── admin/
    │   │   ├── loading.tsx
    │   │   └── users/               # User management (admin only)
    │   ├── shopping/
    │   │   ├── page.tsx
    │   │   └── loading.tsx
    │   ├── weather/
    │   │   ├── page.tsx
    │   │   └── loading.tsx
    │   └── api/
    │       ├── auth/            # login, logout, check, set-pin, users
    │       ├── tasks/           # CRUD, comments, photos, transfer, series, export
    │       ├── users/           # CRUD
    │       ├── shopping/        # CRUD
    │       ├── weather/         # Weather data proxy
    │       ├── push-subscription/   # Push notification registration
    │       └── cron/            # Overdue task reminders
    ├── components/
    │   ├── LoadingScreen.tsx        # Shared loading spinner (used by all loading.tsx)
    │   ├── SessionTimer.tsx         # "Session expires in Xh Xm" countdown
    │   ├── SessionGuard.tsx         # Client-side auth guard
    │   ├── KeyboardShortcuts.tsx    # Keyboard shortcut handler
    │   ├── PushNotificationPrompt.tsx
    │   ├── ServiceWorkerRegistration.tsx
    │   ├── OfflineIndicator.tsx
    │   ├── NavigationProgress.tsx
    │   ├── dashboard/
    │   │   └── DashboardStats.tsx   # Admin overview stats
    │   ├── tasks/
    │   │   ├── TaskList.tsx          # Filterable job list
    │   │   ├── TaskCard.tsx          # Individual job card
    │   │   ├── TaskFilters.tsx       # Filter controls
    │   │   ├── AdminFilters.tsx      # Admin-specific filters
    │   │   ├── StatusUpdater.tsx     # Status change controls
    │   │   ├── CommentSection.tsx    # Job comments
    │   │   ├── PhotoSection.tsx      # Photo upload/gallery (max 5, client-side compression)
    │   │   ├── ActivityLog.tsx       # Job activity audit trail
    │   │   ├── TransferTask.tsx      # Reassign job
    │   │   ├── DeleteTaskButton.tsx
    │   │   └── DeleteSeriesButton.tsx
    │   ├── shopping/
    │   │   └── ShoppingList.tsx      # Shopping list with buyer assignment
    │   └── weather/
    │       └── WeatherDisplay.tsx    # Full weather dashboard
    └── lib/
        ├── types.ts             # Shared TypeScript interfaces
        ├── constants.ts         # Enums, labels, config values
        ├── auth.ts              # PIN hashing, JWT session helpers
        ├── tasks.ts             # Task query helpers
        ├── activity.ts          # Activity logging
        ├── notifications.ts     # Push notification helpers
        ├── weather.ts           # Open-Meteo API client
        └── supabase/
            ├── client.ts        # Browser-side Supabase client
            └── admin.ts         # Server-side Supabase client (cache: 'no-store' to bypass Next.js fetch cache)
```

### Conventions

- **Pages** go in `src/app/` following Next.js App Router conventions.
- **Components** go in `src/components/`. Subfolder by domain (`tasks/`, `shopping/`, `weather/`, `dashboard/`).
- **Server-only code** (DB queries, auth checks) stays in API routes or Server Components. Never import `supabase/admin.ts` from client code.
- **One component per file.** File name matches the default export: `TaskCard.tsx` exports `TaskCard`.
- Use `'use client'` directive only on components that need interactivity.
- Every route group has a `loading.tsx` that renders `<LoadingScreen />` (amber spinner on stone-100 background).

### Important: Supabase Client Caching

The `supabaseAdmin` client in `src/lib/supabase/admin.ts` is configured with `cache: 'no-store'` on its global fetch. This is critical — Next.js 14 caches `fetch()` responses by default, including Supabase's internal fetches, which causes stale data across deployments. Never remove this.

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| name | text | Display name, unique |
| pin_hash | text | Hashed 4-digit PIN |
| role | text | `admin`, `tradesperson`, `riding_school` |
| trade_type | text | Nullable. E.g. `fencer`, `plumber`, `electrician`, `handyman`, `landscaper`, `housekeeper`, `general`, `animal_carer` |
| is_active | boolean | Default true. Soft-disable accounts |
| must_set_pin | boolean | Default true. New users must set PIN on first login |
| last_login | timestamptz | Nullable. Set on successful login |
| phone | text | Nullable. Contact number |
| allowed_sections | text[] | Nullable. Non-admin section access, e.g. `['weather', 'cart']` |
| created_at | timestamptz | Default `now()` |

### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| title | text | Short description |
| description | text | Detailed notes, nullable |
| status | text | `todo`, `in_progress`, `done` |
| priority | text | `low`, `medium`, `high`, `urgent` |
| category | text | See categories below |
| location | text | See locations below |
| assigned_to | uuid | FK → `users.id`, nullable |
| created_by | uuid | FK → `users.id` |
| due_date | date | Nullable |
| recurrence_pattern | text | Nullable. `daily`, `weekly`, `fortnightly`, `monthly` |
| recurrence_group_id | uuid | Nullable. Groups recurring task instances |
| completed_at | timestamptz | Nullable, auto-set when status → `done` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()`, update via trigger |

### `task_photos`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| task_id | uuid | FK → `tasks.id`, cascade delete |
| storage_path | text | Supabase Storage path |
| uploaded_by | uuid | FK → `users.id` |
| created_at | timestamptz | Default `now()` |

### `task_comments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| task_id | uuid | FK → `tasks.id`, cascade delete |
| user_id | uuid | FK → `users.id` |
| content | text | Comment body |
| created_at | timestamptz | Default `now()` |

### `task_activity`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| task_id | uuid | FK → `tasks.id`, cascade delete |
| user_id | uuid | FK → `users.id` |
| action | text | Type of action (e.g. `status_changed`) |
| detail | text | Action details |
| created_at | timestamptz | Default `now()` |

### `push_subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → `users.id`, cascade delete |
| endpoint | text | Push service endpoint, unique |
| p256dh | text | VAPID public key |
| auth | text | VAPID auth token |
| created_at | timestamptz | Default `now()` |

### `shopping_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | Item name |
| category | text | `hardware`, `hay`, `feed`, `other` |
| added_by | uuid | FK → `users.id` |
| assigned_to | uuid | FK → `users.id`, nullable. Which admin buys it |
| is_bought | boolean | Default false |
| created_at | timestamptz | Default `now()` |

## User Roles & Permissions

### `admin` (Farm Owners — Nick & Anna)
- See ALL jobs across all categories and locations
- Create, edit, delete, and reassign any job
- Manage users (add/remove tradies and riding school staff)
- Access admin dashboard with overview stats
- Access all sections (weather, shopping, etc.)

### `tradesperson` (Tradies — displayed as "Tradie" in UI)
Trade types: `fencer`, `plumber`, `electrician`, `handyman`, `landscaper`, `housekeeper`, `general`, `animal_carer`
- See ONLY jobs assigned to them
- Update status on their assigned jobs (`todo` → `in_progress` → `done`)
- Add comments and photos to their assigned jobs
- Cannot create, delete, or reassign jobs
- Cannot see other tradies' jobs
- Section access controlled by `allowed_sections` column

### `riding_school` (Regal Riding Academy Staff — displayed as "Regal Riding" in UI)
- See ONLY jobs with `category = 'riding_school'`
- Update status on riding school jobs
- Add comments and photos to riding school jobs
- Cannot create or delete jobs
- Cannot see non-riding-school jobs

## Farm Locations

Use these exact string values in the `location` column:

| Value | Description |
|-------|-------------|
| `workshop` | Main barn / equipment storage |
| `house` | Homestead / main house |
| `Big_Paddock` | Eastern paddocks (leased to Regal Riding) |
| `Front_paddock` | Western paddocks |
| `Back_paddock` | South paddocks |
| `driveway` | Main driveway and access road |
| `riding_arena` | Riding arena (Regal Riding) |
| `stables` | Stables (Regal Riding) |
| `Front_garden` | Front garden area |
| `Back_garden` | Back garden area |
| `VegetablePatch` | Veggie beds |
| `front_gate` | Front gate and entrance |

## Task Categories

| Value | Description |
|-------|-------------|
| `maintenance` | General property maintenance |
| `horses` | Horse care |
| `donkeys` | Donkey care |
| `fencing` | Fencing repairs and new fencing |
| `riding_school` | Regal Riding related tasks |
| `general` | Catch-all for anything else |

## Task Statuses

| Value | Description |
|-------|-------------|
| `todo` | Not started |
| `in_progress` | Currently being worked on |
| `done` | Completed |

## Task Priorities

| Value | Description |
|-------|-------------|
| `low` | No rush |
| `medium` | Standard priority |
| `high` | Needs attention soon |
| `urgent` | Do it today (always sorted first on the board) |

## App Sections

### Login Page (`/`)
- "Private and Confidential" notice above the form
- "Login as.." dropdown to select user
- PIN input boxes appear only after a user is selected (amber highlight on active box)
- Release name shown at bottom (e.g. `velvet-basalt`)
- Auto-submits when 4th PIN digit entered

### Dashboard (`/dashboard`)
- Sticky header with PB logo, user name, session expiry countdown ("Session expires in Xh Xm"), and logout icon
- Navigation buttons: **New Job** (admin only) → **Jobs** → **Weather** → **Cart** → **Users** (admin only)
- Non-admin users only see sections permitted by their `allowed_sections`
- Admin dashboard stats summary
- Filterable/sortable job list; urgent jobs always sorted first

### Weather (`/weather`)
- Header shows "Weather" with "Open-Meteo · Updated {time}" subtitle
- **Current conditions:** Temperature (red when ≥30°C), condition text, contextual summary sentence, icon-only stats (humidity, wind, rain, sea temp at Kiama)
- **7-day forecast:** Day, icon, description, high/low temps, rain probability %, precipitation
- **Rainfall chart:** 30-day bar chart comparing this year vs last year, with Y-axis, tooltips, date labels
- **Rain radar:** Windy.com Wollongong embed, lazy-loaded on hover/tap (play button placeholder until activated)
- **YTD comparison:** This year vs last year rainfall totals with monthly breakdown
- Heavy rain warning banner when forecast includes 20mm+ days

### Shopping (`/shopping`)
- Add items with title, category (hardware/hay/feed/other), and buyer assignment (which admin buys it)
- Each item shows who's assigned to buy it
- Mark items as bought, delete items

### User Management (`/admin/users`)
- Create, edit, deactivate users
- Role selector: Admin, Tradie, Regal Riding
- Trade type selector for tradies (fencer, plumber, electrician, handyman, landscaper, housekeeper, general, animal_carer)
- Per-user section access control (`allowed_sections`)
- First-login PIN setup flow (new users get `must_set_pin = true`)

## Key Commands

```bash
npm install          # Install dependencies
npm run dev          # Run dev server
npm run build        # Build for production
npx tsc --noEmit     # Type checking
npm run lint         # Linter
vercel --prod        # Deploy via Vercel CLI
npx supabase db push --linked --include-all  # Push migrations
```

## Skills

- `.claude/skills/supabase-migration.md` — follow this for all database schema changes

## Coding Conventions

### TypeScript
- **Strict mode** enabled in `tsconfig.json` (`"strict": true`).
- No `any` types. Use `unknown` and narrow, or define proper types.
- Define shared types in `src/lib/types.ts`. Co-locate component-specific types in the component file.
- Use `as const` for enum-like arrays (locations, categories, statuses, priorities).

### React / Next.js
- Default to **Server Components**. Only add `'use client'` when the component needs hooks, event handlers, or browser APIs.
- Use Next.js `<Link>` for navigation.
- Data fetching happens in Server Components or API routes — never `useEffect` + fetch for initial data.

### Styling
- **Tailwind CSS only.** No CSS modules, no styled-components.
- Use Tailwind's design system (spacing scale, color palette). Avoid arbitrary values where possible.
- Mobile-first responsive design. The primary use case is tradies on phones.
- **Light clean theme.** `stone-100` page backgrounds, white cards with `stone-200` borders. `amber-600` primary buttons with white text. `stone-900` headings, `stone-500` secondary text. Login form uses dark theme (`stone-900` background, `stone-700` borders).

### API Routes
- All API routes in `src/app/api/`.
- Validate request bodies. Return proper HTTP status codes.
- Always check auth and role permissions before processing.

### Database
- Use Supabase client libraries, not raw SQL in app code.
- RLS policies enforce role-based access at the database level.
- All timestamps in UTC.

### Error Handling
- API routes return `{ error: string }` on failure with appropriate status code.
- Client-side: show user-friendly error messages. Log details to console.

### Git
- Branch from `main` for features.
- Commit messages: imperative mood, concise. E.g. "Add task creation form" not "Added task creation form".

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server only, never expose)
```

Store in `.env.local` (gitignored). Set in Vercel dashboard for production.
