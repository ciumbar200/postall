-- Defense-in-depth: enable Row Level Security on all application tables.
-- Prisma connects with the `postgres` role (BYPASSRLS) so server-side access keeps
-- working, while the public anon/auth API gets no direct access (no permissive policies).
-- Workspace isolation is also enforced in application code (every query filters by workspaceId).

do $$
declare
  t text;
  tables text[] := array[
    'User', 'Workspace', 'WorkspaceMember', 'OAuthState', 'SocialAccount',
    'MediaAsset', 'Post', 'PostVersion', 'PostTarget', 'PostMedia',
    'PublishJob', 'PublishAttempt', 'QueueSlot', 'AnalyticsMetric',
    'PostTemplate', 'HashtagGroup'
  ];
begin
  foreach t in array tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format('alter table public.%I enable row level security;', t);
    end if;
  end loop;
end $$;
