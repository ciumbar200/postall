-- Postall: Agency tier, post labels, outgoing webhooks and white-label branding.

-- 1) Add AGENCY value to the PlanTier enum (idempotent).
alter type "PlanTier" add value if not exists 'AGENCY';

-- 2) Post labels (organización de contenido).
create table if not exists "PostLabel" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "name" text not null,
  "color" text not null default '#6366f1',
  "createdAt" timestamp(3) not null default now(),
  unique ("workspaceId", "name")
);
create index if not exists "PostLabel_workspaceId_idx" on "PostLabel"("workspaceId");

create table if not exists "PostLabelOnPost" (
  "postId" text not null references "Post"("id") on delete cascade,
  "labelId" text not null references "PostLabel"("id") on delete cascade,
  primary key ("postId", "labelId")
);
create index if not exists "PostLabelOnPost_labelId_idx" on "PostLabelOnPost"("labelId");

-- 3) Outgoing webhooks per workspace.
create table if not exists "Webhook" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "url" text not null,
  "secret" text not null,
  "events" text[] not null default '{}',
  "active" boolean not null default true,
  "lastStatus" integer,
  "lastDeliveredAt" timestamp(3),
  "createdAt" timestamp(3) not null default now()
);
create index if not exists "Webhook_workspaceId_idx" on "Webhook"("workspaceId");

-- 4) White-label branding per workspace.
create table if not exists "WorkspaceBranding" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null unique references "Workspace"("id") on delete cascade,
  "brandName" text,
  "logoUrl" text,
  "primaryColor" text,
  "customDomain" text unique,
  "supportEmail" text,
  "hidePostallBranding" boolean not null default false,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

-- 5) Reseller link: client workspaces managed by an Agency workspace.
alter table "Workspace" add column if not exists "parentWorkspaceId" text;
create index if not exists "Workspace_parentWorkspaceId_idx" on "Workspace"("parentWorkspaceId");

-- RLS on the new tables (Prisma's postgres role bypasses RLS).
alter table "PostLabel" enable row level security;
alter table "PostLabelOnPost" enable row level security;
alter table "Webhook" enable row level security;
alter table "WorkspaceBranding" enable row level security;
