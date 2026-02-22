# Pepperberry Farm Task Board

## Project Overview

A task management web app for **Pepperberry** — a private home property in Coolongatta, NSW, Australia. The property includes multiple paddocks, a workshop, a house and driveway. The eastern paddocks are leased to **Regal Riding School**.

The app lets the two owners assign and track tasks across the property. Workers (General workers, landscapers, fencers, plumbers, electricians, handymen, animal carers) log in to see only their assigned work. Riding school staff see only riding-school-related tasks.

### Horses

The eastern paddocks are leased for agistment — the agisted horses are a separate concern and not managed by the farm. Pepperberry owns 3 horses (PB horses). Staff from the riding academy come to feed the PB horses. The `riding_school` role in the app exists solely for these staff to see and update tasks related to PB horse care (feeding, etc.).

### Tradesperson Workflow

**Key domain concept:** Workers are **not permanent staff**. They come for specific jobs and might not return for weeks. The typical workflow is:
1. Admin identifies a job that needs doing (e.g. fence repair in western paddock)
2. Admin creates a task and assigns it to the relevant tradesperson.
3. Admin can manage all non-admin users access.
4. Admin can create a job with a repeating schedule with a start and end date. Default start date is today.
5. Tradesperson logs in (often on their phone on-site), sees their assigned tasks
6. Tradesperson updates status and adds photos/comments as they work
7. Admin reviews completed work and can close a job or mark as incomplete and add comments
8. Both Admin and Workers can add up to 5 photos to jobs.

The system must be simple enough for someone to log in on a phone, check their tasks, and mark them done. No training should be required.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (Postgres) with Row Level Security (RLS)
- **Storage:** Supabase Storage (for task photos/attachments)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Auth:** Custom name + 4-digit PIN (no email/password, no Supabase Auth)

## Project Structure

```
pepperberry-tasks/
├── CLAUDE.md
├── .env.local                  # Environment variables (gitignored)
├── .eslintrc.json
├── .gitignore
├── next.config.mjs
├── next-env.d.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   └── app/                    # Next.js App Router
│       ├── favicon.ico
│       ├── fonts/              # Local fonts (Geist Sans, Geist Mono)
│       ├── globals.css         # Tailwind imports + CSS variables
│       ├── layout.tsx          # Root layout
│       └── page.tsx            # Login page (default route)
├── supabase/
│   └── config.toml             # Supabase project config
└── public/                     # Static assets
```

### Planned structure (to be created as features are built)

```
src/
├── app/
│   ├── dashboard/              # Admin dashboard
│   ├── tasks/                  # Task views
│   └── api/                    # API routes (auth, tasks, users)
├── components/                 # React components
│   ├── ui/                     # Generic UI (Button, Card, Modal, etc.)
│   └── tasks/                  # Task-specific components
├── lib/                        # Shared utilities
│   ├── supabase/               # Supabase clients (browser, server, admin)
│   ├── auth.ts                 # Auth helpers (PIN verification, session)
│   ├── constants.ts            # Enums for roles, locations, categories, statuses
│   └── types.ts                # Shared TypeScript types
├── hooks/                      # Custom React hooks
└── middleware.ts               # Auth middleware (protect routes)
```

### Conventions

- **Pages** go in `src/app/` following Next.js App Router conventions.
- **Components** go in `src/components/`. Subfolder by domain (`tasks/`, `ui/`).
- **Server-only code** (DB queries, auth checks) stays in API routes or Server Components. Never import `supabase/admin.ts` from client code.
- **One component per file.** File name matches the default export: `TaskCard.tsx` exports `TaskCard`.
- Use `'use client'` directive only on components that need interactivity.

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| name | text | Display name, unique |
| pin_hash | text | Hashed 4-digit PIN |
| role | text | `admin`, `tradesperson`, `riding_school` |
| trade_type | text | Nullable. E.g. `fencer`, `plumber`, `electrician`, `handyman` |
| is_active | boolean | Default true. Soft-disable accounts |
| last_login | timestamptz | Nullable. Set on successful login |
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
| completed_at | timestamptz | Nullable, set when status → `done` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()`, update via trigger |

### `task_photos`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| task_id | uuid | FK → `tasks.id` |
| storage_path | text | Supabase Storage path |
| uploaded_by | uuid | FK → `users.id` |
| created_at | timestamptz | Default `now()` |

### `task_comments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| task_id | uuid | FK → `tasks.id` |
| user_id | uuid | FK → `users.id` |
| content | text | Comment body |
| created_at | timestamptz | Default `now()` |

## User Roles & Permissions

### `admin` (Farm Owners)
- See ALL tasks across all categories and locations
- Create, edit, delete, and reassign any task
- Manage users (add/remove Workers and riding school staff)
- Access the admin dashboard with overview stats

### `tradesperson` (Fencer, Plumber, Electrician, Handyman)
- See ONLY tasks assigned to them
- Update status on their assigned tasks (`todo` → `in_progress` → `done`)
- Add comments and photos to their assigned tasks
- Cannot create, delete, or reassign tasks
- Cannot see other Workers's tasks

### `riding_school` (Coolongatta Riding Academy Staff)
- See ONLY tasks with `category = 'riding_school'`
- Update status on riding school tasks
- Add comments and photos to riding school tasks
- Cannot create or delete tasks
- Cannot see non-riding-school tasks

## Farm Locations

Use these exact string values in the `location` column:

| Value | Description |
|-------|-------------|
| `workshop` | Main barn / equipment storage |
| `house` | Homestead / main house |
| `Big_Paddock` | Eastern paddocks (leased to riding academy) |
| `Front_paddock` | Western paddocks |
| `Back_paddock` | South paddocks | 
| `driveway` | Main driveway and access road |
| `riding_arena` | Riding arena (riding academy) |
| `stables` | Stables (riding academy) |
| `Front_garden` | front garden area |
| `Back_garden` | back garden area |
| `VegetablePatch` | Veggie beds |
| `front_gate` | Front gate and entrance |

## Task Categories

Use these exact string values in the `category` column:

| Value | Description |
|-------|-------------|
| `maintenance` | General property maintenance |
| `horses` | Livestock management |
| `donkeys` | Livestock management |
| `fencing` | Fencing repairs and new fencing |
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
| `urgent` | Do it today |

## Key Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run type checking
npx tsc --noEmit

# Run linter
npm run lint

# Deploy (via Vercel CLI or git push to main)
vercel --prod
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
- Use `next/image` for optimized images.
- Data fetching happens in Server Components or API routes — never `useEffect` + fetch for initial data.

### Styling
- **Tailwind CSS only.** No CSS modules, no styled-components.
- Use Tailwind's design system (spacing scale, color palette). Avoid arbitrary values where possible.
- Mobile-first responsive design. The primary use case is Workers on phones.
- **Dark and elegant theme.** Dark backgrounds (`stone-950` pages, `stone-900` cards), light text (`stone-100` primary, `stone-200`–`stone-400` secondary), `stone-700` borders, `amber-600` primary buttons. Clean typography, generous whitespace. The UI should feel polished and high-quality — never cluttered or heavy.

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
- Client-side: show user-friendly error messages via toast/alert. Log details to console.

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
