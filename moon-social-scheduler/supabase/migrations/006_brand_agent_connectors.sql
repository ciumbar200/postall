-- Postall: Brand Agent, creative connectors, generated assets and agent runs.

-- Enums
do $$ begin
  create type "ConnectorType" as enum ('IMAGE_GEN', 'CANVA', 'HEYGEN', 'FLIKI');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "AssetKind" as enum ('IMAGE', 'VIDEO', 'DESIGN');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "AgentRunStatus" as enum ('PLANNING', 'GENERATING', 'DRAFTED', 'FAILED', 'DONE');
exception when duplicate_object then null;
end $$;

-- Brand profile (1:1 workspace)
create table if not exists "BrandProfile" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null unique references "Workspace"("id") on delete cascade,
  "voice" text,
  "tone" text,
  "audience" text,
  "pillars" jsonb,
  "keywords" text[] not null default '{}',
  "bannedWords" text[] not null default '{}',
  "paletteJson" jsonb,
  "fonts" text[] not null default '{}',
  "sampleCaptions" text[] not null default '{}',
  "logoMediaId" text,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

-- Connector credentials per workspace
create table if not exists "ConnectorCredential" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "connector" "ConnectorType" not null,
  "status" text not null default 'ACTIVE',
  "credentialsJson" jsonb not null,
  "expiresAt" timestamp(3),
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now(),
  unique ("workspaceId", "connector")
);
create index if not exists "ConnectorCredential_workspaceId_connector_idx"
  on "ConnectorCredential"("workspaceId", "connector");

-- Generated assets (async video polling, etc.)
create table if not exists "GeneratedAsset" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "connector" "ConnectorType" not null,
  "kind" "AssetKind" not null,
  "prompt" text not null,
  "mediaAssetId" text,
  "externalId" text,
  "status" text not null default 'PENDING',
  "meta" jsonb,
  "credentialId" text not null references "ConnectorCredential"("id") on delete restrict,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);
create index if not exists "GeneratedAsset_workspaceId_connector_status_idx"
  on "GeneratedAsset"("workspaceId", "connector", "status");
create index if not exists "GeneratedAsset_externalId_idx"
  on "GeneratedAsset"("externalId");

-- Agent runs
create table if not exists "AgentRun" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "brief" text not null,
  "status" "AgentRunStatus" not null default 'PLANNING',
  "planJson" jsonb,
  "resultJson" jsonb,
  "cost" double precision,
  "createdById" text not null references "User"("id") on delete cascade,
  "brandProfileId" text not null references "BrandProfile"("id") on delete cascade,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);
create index if not exists "AgentRun_workspaceId_status_idx"
  on "AgentRun"("workspaceId", "status");
create index if not exists "AgentRun_createdAt_idx"
  on "AgentRun"("createdAt");

-- RLS (defense in depth)
alter table "BrandProfile" enable row level security;
alter table "ConnectorCredential" enable row level security;
alter table "GeneratedAsset" enable row level security;
alter table "AgentRun" enable row level security;
