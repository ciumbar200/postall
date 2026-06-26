create table if not exists workspace_state (
  workspace_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (
    platform in (
      'instagram',
      'tiktok',
      'linkedin',
      'facebook',
      'youtube',
      'pinterest',
      'x',
      'threads',
      'bluesky',
      'telegram'
    )
  ),
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

alter table workspace_state enable row level security;
alter table social_accounts enable row level security;
alter table scheduled_posts enable row level security;
