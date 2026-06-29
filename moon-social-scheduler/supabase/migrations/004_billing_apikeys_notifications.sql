-- Postall: billing, API keys and notifications.
-- Adds Subscription, UsageCounter, ApiKey, Notification tables and supporting enums.

do $$ begin
  create type "PlanTier" as enum ('FREE', 'CREATOR', 'AGENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "SubscriptionStatus" as enum ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "NotificationType" as enum ('PUBLISH_FAILED', 'TOKEN_EXPIRING', 'TOKEN_EXPIRED', 'RENEWAL_REMINDER', 'SYSTEM');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "NotificationSeverity" as enum ('INFO', 'WARNING', 'ERROR');
exception when duplicate_object then null; end $$;

create table if not exists "Subscription" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null unique references "Workspace"("id") on delete cascade,
  "tier" "PlanTier" not null default 'FREE',
  "status" "SubscriptionStatus" not null default 'ACTIVE',
  "stripeCustomerId" text unique,
  "stripeSubscriptionId" text unique,
  "stripePriceId" text,
  "currentPeriodEnd" timestamp(3),
  "cancelAtPeriodEnd" boolean not null default false,
  "renewalNotifiedAt" timestamp(3),
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);
create index if not exists "Subscription_status_idx" on "Subscription"("status");

create table if not exists "UsageCounter" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "periodStart" timestamp(3) not null,
  "postsCreated" integer not null default 0,
  "apiCalls" integer not null default 0,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now(),
  unique ("workspaceId", "periodStart")
);
create index if not exists "UsageCounter_workspaceId_idx" on "UsageCounter"("workspaceId");

create table if not exists "ApiKey" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "name" text not null,
  "prefix" text not null unique,
  "hashedKey" text not null unique,
  "scopes" text[] not null default '{}',
  "rateLimitPerMin" integer not null default 60,
  "lastUsedAt" timestamp(3),
  "revokedAt" timestamp(3),
  "createdAt" timestamp(3) not null default now()
);
create index if not exists "ApiKey_workspaceId_idx" on "ApiKey"("workspaceId");

create table if not exists "Notification" (
  "id" text primary key default gen_random_uuid()::text,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "type" "NotificationType" not null,
  "severity" "NotificationSeverity" not null default 'INFO',
  "title" text not null,
  "body" text,
  "link" text,
  "metadata" jsonb,
  "readAt" timestamp(3),
  "createdAt" timestamp(3) not null default now()
);
create index if not exists "Notification_workspaceId_readAt_idx" on "Notification"("workspaceId", "readAt");
create index if not exists "Notification_workspaceId_createdAt_idx" on "Notification"("workspaceId", "createdAt");

-- Enable RLS on the new tables (Prisma's postgres role bypasses RLS).
alter table "Subscription" enable row level security;
alter table "UsageCounter" enable row level security;
alter table "ApiKey" enable row level security;
alter table "Notification" enable row level security;
