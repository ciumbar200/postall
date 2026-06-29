-- Missing tables from the Prisma schema that were not present in the remote project
create table if not exists "OAuthState" (
  "id" text primary key,
  "state" text not null unique,
  "platform" text not null,
  "userId" text not null references "User"("id") on delete cascade,
  "workspaceId" text not null,
  "verifier" text,
  "redirectTo" text,
  "expiresAt" timestamp(3) not null,
  "createdAt" timestamp(3) not null default current_timestamp
);

create index if not exists "OAuthState_platform_workspaceId_idx" on "OAuthState"("platform", "workspaceId");
create index if not exists "OAuthState_expiresAt_idx" on "OAuthState"("expiresAt");

create table if not exists "QueueSlot" (
  "id" text primary key,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "platform" text not null,
  "dayOfWeek" integer not null,
  "timeOfDay" text not null,
  "timezone" text not null default 'UTC',
  "status" text not null default 'ACTIVE',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);

create unique index if not exists "QueueSlot_workspaceId_platform_dayOfWeek_timeOfDay_key"
  on "QueueSlot"("workspaceId", "platform", "dayOfWeek", "timeOfDay");
create index if not exists "QueueSlot_workspaceId_platform_status_idx"
  on "QueueSlot"("workspaceId", "platform", "status");

create table if not exists "AnalyticsMetric" (
  "id" text primary key,
  "workspaceId" text not null,
  "postTargetId" text references "PostTarget"("id") on delete cascade,
  "socialAccountId" text references "SocialAccount"("id") on delete cascade,
  "platform" text not null,
  "metric" text not null,
  "value" integer not null,
  "measuredAt" timestamp(3) not null,
  "metadata" jsonb,
  "createdAt" timestamp(3) not null default current_timestamp
);

create index if not exists "AnalyticsMetric_workspaceId_platform_measuredAt_idx"
  on "AnalyticsMetric"("workspaceId", "platform", "measuredAt");
create index if not exists "AnalyticsMetric_postTargetId_idx"
  on "AnalyticsMetric"("postTargetId");

create table if not exists "PostTemplate" (
  "id" text primary key,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "creatorId" text not null references "User"("id") on delete cascade,
  "name" text not null,
  "body" text not null,
  "platforms" text[] not null default '{}',
  "settings" jsonb,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);

create index if not exists "PostTemplate_workspaceId_idx" on "PostTemplate"("workspaceId");

create table if not exists "HashtagGroup" (
  "id" text primary key,
  "workspaceId" text not null references "Workspace"("id") on delete cascade,
  "creatorId" text not null references "User"("id") on delete cascade,
  "name" text not null,
  "tags" text[] not null default '{}',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);

create unique index if not exists "HashtagGroup_workspaceId_name_key" on "HashtagGroup"("workspaceId", "name");

-- Media bucket with 5GB support for image, gif and video
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5368709120,
  array['image/*', 'image/gif', 'video/*']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'media_public_read'
  ) then
    create policy "media_public_read"
      on storage.objects
      for select
      to public
      using (bucket_id = 'media');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'media_authenticated_insert'
  ) then
    create policy "media_authenticated_insert"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'media');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'media_authenticated_update'
  ) then
    create policy "media_authenticated_update"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'media')
      with check (bucket_id = 'media');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'media_authenticated_delete'
  ) then
    create policy "media_authenticated_delete"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'media');
  end if;
end $$;

-- Seed a launch workspace and five connected sample channels
insert into "User" ("id", "email", "name", "createdAt", "updatedAt")
values ('seed-owner', 'owner@moon.local', 'MoOn Owner', now(), now())
on conflict ("email") do update
set "name" = excluded."name",
    "updatedAt" = now();

insert into "Workspace" ("id", "name", "slug", "createdAt", "updatedAt")
values ('seed-workspace', 'MoOn Workspace', 'moon', now(), now())
on conflict ("slug") do update
set "name" = excluded."name",
    "updatedAt" = now();

insert into "WorkspaceMember" ("id", "userId", "workspaceId", "role", "createdAt")
values ('seed-member-owner', 'seed-owner', 'seed-workspace', 'OWNER', now())
on conflict ("userId","workspaceId") do update
set "role" = excluded."role";

insert into "SocialAccount" (
  "id", "workspaceId", "platform", "providerAccountId", "username", "displayName",
  "status", "accessToken", "expiresAt", "createdAt", "updatedAt"
) values
  ('seed-instagram', 'seed-workspace', 'INSTAGRAM', 'ig_demo_business_001', 'moon.studio', 'MoOn Studio', 'CONNECTED', 'seed-token-instagram', now() + interval '45 days', now(), now()),
  ('seed-tiktok', 'seed-workspace', 'TIKTOK', 'tt_demo_creator_001', 'moon.scheduler', 'MoOn Scheduler', 'CONNECTED', 'seed-token-tiktok', now() + interval '8 days', now(), now()),
  ('seed-linkedin', 'seed-workspace', 'LINKEDIN', 'li_demo_company_001', 'moon-social', 'MoOn LinkedIn', 'CONNECTED', 'seed-token-linkedin', null, now(), now()),
  ('seed-facebook', 'seed-workspace', 'FACEBOOK', 'fb_demo_page_001', 'moon.social.page', 'MoOn Facebook', 'CONNECTED', 'seed-token-facebook', null, now(), now()),
  ('seed-youtube', 'seed-workspace', 'YOUTUBE', 'yt_demo_channel_001', 'moonstudio', 'MoOn YouTube', 'CONNECTED', 'seed-token-youtube', null, now(), now())
on conflict ("workspaceId","platform","providerAccountId") do update
set "username" = excluded."username",
    "displayName" = excluded."displayName",
    "status" = excluded."status",
    "updatedAt" = now();

insert into "Post" (
  "id", "workspaceId", "creatorId", "status", "baseText",
  "scheduledAt", "timezone", "createdAt", "updatedAt"
) values
  ('seed-post-launch', 'seed-workspace', 'seed-owner', 'SCHEDULED', 'Launch thread for the new visual calendar across social and B2B channels.', now() + interval '2 hours', 'Europe/Madrid', now(), now()),
  ('seed-post-video', 'seed-workspace', 'seed-owner', 'QUEUED', 'Behind the scenes clip with direct API publishing and video scheduling.', now() + interval '28 hours', 'Europe/Madrid', now(), now()),
  ('seed-post-recap', 'seed-workspace', 'seed-owner', 'PUBLISHED', 'Carousel recap, landing CTA and launch recap for paid-organic reuse.', now() - interval '22 hours', 'Europe/Madrid', now(), now())
on conflict ("id") do update
set "baseText" = excluded."baseText",
    "status" = excluded."status",
    "scheduledAt" = excluded."scheduledAt",
    "updatedAt" = now();

insert into "PostVersion" ("id", "postId", "platform", "text", "settings", "createdAt", "updatedAt") values
  ('seed-version-ig', 'seed-post-launch', 'INSTAGRAM', 'Launch thread for the new visual calendar.', '{}'::jsonb, now(), now()),
  ('seed-version-li', 'seed-post-launch', 'LINKEDIN', 'Launch thread for the new visual calendar with direct APIs and one operator shell.', '{}'::jsonb, now(), now()),
  ('seed-version-tt', 'seed-post-video', 'TIKTOK', 'Behind the scenes clip with direct API publishing.', '{\"privacyLevel\":\"PUBLIC_TO_EVERYONE\"}'::jsonb, now(), now()),
  ('seed-version-yt', 'seed-post-video', 'YOUTUBE', 'Behind the scenes clip with launch context and CTA.', '{\"privacy\":\"unlisted\"}'::jsonb, now(), now()),
  ('seed-version-fb', 'seed-post-recap', 'FACEBOOK', 'Carousel recap and CTA.', '{}'::jsonb, now(), now())
on conflict ("postId","platform") do update
set "text" = excluded."text",
    "settings" = excluded."settings",
    "updatedAt" = now();

insert into "PostTarget" (
  "id", "postId", "socialAccountId", "platform", "status",
  "scheduledAt", "publishedAt", "createdAt", "updatedAt"
) values
  ('seed-target-ig', 'seed-post-launch', 'seed-instagram', 'INSTAGRAM', 'SCHEDULED', now() + interval '2 hours', null, now(), now()),
  ('seed-target-li', 'seed-post-launch', 'seed-linkedin', 'LINKEDIN', 'SCHEDULED', now() + interval '2 hours', null, now(), now()),
  ('seed-target-tt', 'seed-post-video', 'seed-tiktok', 'TIKTOK', 'QUEUED', now() + interval '28 hours', null, now(), now()),
  ('seed-target-yt', 'seed-post-video', 'seed-youtube', 'YOUTUBE', 'QUEUED', now() + interval '28 hours', null, now(), now()),
  ('seed-target-fb', 'seed-post-recap', 'seed-facebook', 'FACEBOOK', 'PUBLISHED', now() - interval '22 hours', now() - interval '22 hours', now(), now())
on conflict ("postId","socialAccountId") do update
set "status" = excluded."status",
    "scheduledAt" = excluded."scheduledAt",
    "publishedAt" = excluded."publishedAt",
    "updatedAt" = now();

insert into "PublishJob" (
  "id", "postId", "status", "runAt", "attempts", "maxAttempts", "createdAt", "updatedAt"
) values
  ('seed-job-launch', 'seed-post-launch', 'WAITING', now() + interval '2 hours', 0, 3, now(), now()),
  ('seed-job-video', 'seed-post-video', 'WAITING', now() + interval '28 hours', 0, 3, now(), now())
on conflict ("id") do update
set "status" = excluded."status",
    "runAt" = excluded."runAt",
    "updatedAt" = now();

insert into "QueueSlot" (
  "id", "workspaceId", "platform", "dayOfWeek", "timeOfDay", "timezone", "status", "createdAt", "updatedAt"
) values
  ('seed-slot-instagram', 'seed-workspace', 'INSTAGRAM', 1, '10:00', 'Europe/Madrid', 'ACTIVE', now(), now()),
  ('seed-slot-linkedin', 'seed-workspace', 'LINKEDIN', 2, '09:00', 'Europe/Madrid', 'ACTIVE', now(), now()),
  ('seed-slot-tiktok', 'seed-workspace', 'TIKTOK', 5, '18:30', 'Europe/Madrid', 'ACTIVE', now(), now()),
  ('seed-slot-youtube', 'seed-workspace', 'YOUTUBE', 4, '17:00', 'Europe/Madrid', 'ACTIVE', now(), now())
on conflict ("workspaceId","platform","dayOfWeek","timeOfDay") do update
set "timezone" = excluded."timezone",
    "status" = excluded."status",
    "updatedAt" = now();

insert into "PostTemplate" (
  "id", "workspaceId", "creatorId", "name", "body", "platforms", "settings", "createdAt", "updatedAt"
) values
('seed-template-launch', 'seed-workspace', 'seed-owner', 'Launch campaign', 'Primary CTA, creator quote and feature line for launch week.', array['INSTAGRAM','TIKTOK','LINKEDIN','FACEBOOK'], '{}'::jsonb, now(), now()),
('seed-template-video', 'seed-workspace', 'seed-owner', 'Video teaser', 'Short-form teaser with CTA and asset reminder for motion-first channels.', array['TIKTOK','YOUTUBE'], '{}'::jsonb, now(), now())
on conflict ("id") do update
set "name" = excluded."name",
    "body" = excluded."body",
    "platforms" = excluded."platforms",
    "updatedAt" = now();

insert into "HashtagGroup" (
  "id", "workspaceId", "creatorId", "name", "tags", "createdAt", "updatedAt"
) values
  ('seed-hashtags-launch', 'seed-workspace', 'seed-owner', 'Launch', array['#launch','#newdrop','#automation'], now(), now()),
  ('seed-hashtags-bts', 'seed-workspace', 'seed-owner', 'Behind scenes', array['#behindthescenes','#buildinpublic','#opensource'], now(), now())
on conflict ("workspaceId","name") do update
set "tags" = excluded."tags",
    "updatedAt" = now();
