# Postall Lite (archivado · solo landing/demo)

> ⚠️ Esta app NO es el producto. El producto canónico es **Postall** (`../moon-social-scheduler`).
> `moon-social-lite` se conserva únicamente como landing/demo de presentación y no recibe nuevas
> funcionalidades. Toda la lógica de producto (auth, billing, API, MCP, adapters) vive en la app
> principal.

Postall Lite is a presentation-ready social publishing SaaS demo focused on direct provider connectivity, multi-network workflow, pricing expansion and workspace collaboration.

Base workspace defaults now include the full launch stack as visible sample accounts:

- Instagram
- TikTok
- LinkedIn
- Facebook
- YouTube

Current visible platform scope:

- Instagram
- TikTok
- LinkedIn
- Facebook
- YouTube
- Pinterest
- X
- Threads
- Bluesky
- Telegram

## Run locally

```bash
npm install
npm run dev:present
```

Quick preflight before the meeting:

```bash
npm run preflight
```

Presentation URL:

```text
http://127.0.0.1:5174/#/landing
```

For a portable presentation setup on another machine, start from:

```text
.env.presentation.example
```

## Presentation controls

Inside the app topbar:

- `Prepare`: resets the workspace into the presentation state
- `Reset`: restores the base local state
- `Presenter`: hides extra technical UI noise for live demos
- `Site`: returns to the public landing

Keyboard shortcuts:

- `Shift + P`: toggle Presenter mode
- `Shift + R`: prepare presentation state
- `Shift + D`: jump to Demo Flow

Recommended live flow:

1. Open `#/landing`
2. Click `Start presentation` or `Prepare`
3. Leave `Presenter` mode enabled
4. Use `#/demo` as the backup presentation route

Detailed speaker notes live in [PRESENTATION.md](./PRESENTATION.md).

## Product surfaces

- `Landing`: public product entry
- `Demo Flow`: guided investor walkthrough
- `Investor Board`: business case, buyer map, launch stack and monetization signal
- `Overview`: thesis, roadmap and commercial framing
- `Compose`: multi-network post creation
- `Calendar`: scheduled content planning
- `Accounts`: account readiness and connection posture
- `Queue`: publishing workflow and execution narrative
- `Analytics`: platform-level reporting surface
- `Media`: reusable asset library
- `Templates`: repeatable content systems
- `Integrations`: priority provider stack and roadmap catalog
- `Workspaces`: team and multi-brand expansion story
- `Billing`: pricing and monetization model
- `Settings`: provider setup and workspace persistence

## Environment

Copy `.env.example` to `.env` and fill the provider values when you want real infrastructure wiring:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `VITE_INSTAGRAM_REDIRECT_URL`
- `VITE_TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `VITE_TIKTOK_REDIRECT_URL`
- `VITE_LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `VITE_LINKEDIN_REDIRECT_URL`
- `VITE_FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `VITE_FACEBOOK_REDIRECT_URL`
- `VITE_YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `VITE_YOUTUBE_REDIRECT_URL`
- `VITE_PINTEREST_APP_ID`
- `PINTEREST_APP_SECRET`
- `VITE_PINTEREST_REDIRECT_URL`
- `VITE_X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `VITE_X_REDIRECT_URL`
- `VITE_THREADS_APP_ID`
- `THREADS_APP_SECRET`
- `VITE_THREADS_REDIRECT_URL`
- `VITE_BLUESKY_IDENTIFIER`
- `BLUESKY_APP_PASSWORD`
- `VITE_TELEGRAM_BOT_NAME`
- `TELEGRAM_BOT_TOKEN`

Without envs, the product stays in presentation mode with local state and explicit setup posture.
Settings now exposes a visible environment map for each provider, including example values and callback URLs.

## Supabase schema starter

Use this as a base in the Supabase SQL editor:

```sql
create table if not exists workspace_state (
  workspace_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram', 'tiktok', 'linkedin', 'facebook', 'youtube', 'pinterest', 'x', 'threads', 'bluesky', 'telegram')),
  handle text not null,
  display_name text not null,
  mode text not null default 'demo' check (mode in ('demo', 'live')),
  status text not null default 'connected' check (status in ('connected', 'expired')),
  created_at timestamptz not null default now()
);

create table if not exists scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  copy text not null,
  scheduled_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  platforms text[] not null default '{}',
  created_at timestamptz not null default now()
);
```

Add RLS and policies once authentication is defined.

## Current product stance

This repository is a polished presentation build with:

- no Docker dependency
- no local Redis worker
- no hidden provider setup
- explicit provider readiness for each network
- optional Supabase-backed workspace persistence
- a clear path into real OAuth, publishing workers and analytics ingestion

Validation status:

- `npm run lint` passes
- `npm run preflight` passes
- `npm run build` may hang in this environment at `tsc -b`; do not overclaim full production build validation from this workspace alone
