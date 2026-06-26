# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo for a social media publishing platform with two main applications:

- **moon-social-scheduler/** — Full-stack Next.js 16 scheduler with Prisma, Supabase, and Edge Functions (no Redis/BullMQ)
- **moon-social-lite/** — Vite + React full-stack app with optional Supabase persistence (presentation-ready investor demo mode included)

## moon-social-scheduler

### Commands

```bash
# Initial setup
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev                    # Start Next.js dev server on :3000

# Database
npm run prisma:generate        # Regenerate Prisma client
npm run prisma:validate        # Validate schema
npm run prisma:migrate         # Run dev migrations
npm run prisma:deploy          # Run production migrations

# Docker (local PostgreSQL only, no Redis)
docker compose up --build

# Supabase Edge Function deploy
supabase functions deploy publish
```

### Architecture

**Platform Adapters**: Each social platform (`src/lib/platforms/<platform>/`) implements the `PlatformAdapter` interface from `src/lib/platforms/types.ts`. Modules include:
- `auth/` — OAuth flow (getAuthorizationUrl, exchangeCode)
- `api/` — Platform API client
- `format/` — Validation and payload formatting
- `publish.ts` — Post publishing logic
- `metrics.ts` — Analytics fetching

**Publishing Flow** (Supabase-only, no Redis):
1. API route creates `Post`, `PostVersion`, `PostTarget`, `PublishJob` records
2. **pg_cron** triggers Edge Function every 2 minutes (`supabase/functions/publish/index.ts`)
3. Edge Function finds jobs with `runAt <= now` and status `WAITING`
4. Calls `publishPostJob()` to execute platform adapters
5. Updates status in DB, retries up to 3 times on failure

See `moon-social-scheduler/SUPABASE_SETUP.md` for Edge Function deploy and pg_cron config.

**Key Types**: `Platform`, `PostStatus`, `PublishTargetStatus`, `PublishJobStatus` from `@/generated/prisma/enums`

**State Management**: Zustand for composer, TanStack Query for server data

### Important Notes

- Prisma client generates to `src/generated/prisma/` (not node_modules)
- **No worker needed** — Supabase Edge Function + pg_cron handles scheduled publishing
- Media stored in `public/uploads/` by default
- PostgreSQL (local or Supabase) — no Redis required
- See `SUPABASE_SETUP.md` for deployment configuration

## moon-social-lite

### Commands

```bash
npm install
npm run dev:present             # Presentation mode on :5174
npm run preflight              # Pre-deployment checks
npm run build                  # May hang in some environments
npm run lint                   # oxlint
```

### Architecture

Full-stack app with localStorage by default, optional Supabase backend when env vars are configured. Single-file architecture in `src/App.tsx` with:
- Route-based view switching (`#/landing`, `#/demo`, `#/compose`, etc.)
- `src/lib/platforms.ts` — Platform configurations and provider setup UI
- `src/lib/supabase.ts` — Supabase client (optional, loads if env vars present)
- Workspace state syncs to `workspace_state` table when Supabase is configured

### Presentation Mode

- `Shift + P` — Toggle Presenter mode
- `Shift + R` — Prepare presentation state
- Access via `http://127.0.0.1:5174/#/landing`

See `PRESENTATION.md` for detailed speaker notes.

## Environment Variables

Both apps expect platform OAuth credentials (Instagram, TikTok, LinkedIn, Facebook, YouTube, Pinterest, X, Threads, Bluesky, Telegram). See `.env.example` files.

## Development Notes

- **Next.js 16**: Breaking changes from earlier versions — check `node_modules/next/dist/docs/` before modifying
- **Prisma postinstall**: Automatically runs `prisma generate` on install
