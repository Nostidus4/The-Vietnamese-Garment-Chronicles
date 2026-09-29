-- Anonymous usage events for Việt Phục Du Ký (ticket #4). Run once in Supabase → SQL Editor.
-- The backend writes with the service role key (bypasses RLS). RLS is on with no policies, so the public
-- publishable/anon key used by the frontend can neither read nor write this table.
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  session_id  uuid        not null,             -- random id made in the browser, not tied to a person
  type        text        not null check (type in
                ('compass_result', 'look_fixed', 'occasion_selected', 'quiz_answer', 'tryon', 'duky_save')),
  payload     jsonb       not null default '{}'::jsonb check (pg_column_size(payload) < 2048),
  ts          timestamptz not null,             -- when it happened, from the browser
  received_at timestamptz not null default now()
);
create index if not exists events_type_idx on public.events (type);
create index if not exists events_session_idx on public.events (session_id);
alter table public.events enable row level security;
