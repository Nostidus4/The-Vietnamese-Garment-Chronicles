-- Việt Phục Du Ký: everything the app needs in Supabase, in one file. Run in Supabase → SQL Editor.
-- Safe to run again and again: what exists is left as it is, what is missing is created, and nothing is deleted.
-- Same content as events.sql + migrations/2026-10-05-wardrobe-events.sql + duky.sql + share.sql.

-- 1. Anonymous usage events (ticket #4) --------------------------------------------------------------------------
-- The backend writes with the service role key; RLS on with no policies, so the public key can neither read nor write.
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  session_id  uuid        not null,             -- random id made in the browser, not tied to a person
  type        text        not null,
  payload     jsonb       not null default '{}'::jsonb check (pg_column_size(payload) < 2048),
  ts          timestamptz not null,             -- when it happened, from the browser
  received_at timestamptz not null default now()
);
-- the list of event types, rebuilt every time so an older database also gets wardrobe_wear (PR #46)
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check check (type in
  ('compass_result', 'look_fixed', 'occasion_selected', 'quiz_answer', 'tryon', 'duky_save', 'wardrobe_wear'));
create index if not exists events_type_idx on public.events (type);
create index if not exists events_session_idx on public.events (session_id);
alter table public.events enable row level security;

-- 2. Du Ký cloud copy (ticket #28): each reader sees and changes only their own row and photos --------------------
create table if not exists public.duky_books (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.duky_books enable row level security;

drop policy if exists "own book: read" on public.duky_books;
drop policy if exists "own book: insert" on public.duky_books;
drop policy if exists "own book: update" on public.duky_books;
drop policy if exists "own book: delete" on public.duky_books;
create policy "own book: read" on public.duky_books for select using (auth.uid() = user_id);
create policy "own book: insert" on public.duky_books for insert with check (auth.uid() = user_id);
create policy "own book: update" on public.duky_books for update using (auth.uid() = user_id);
create policy "own book: delete" on public.duky_books for delete using (auth.uid() = user_id);

-- private bucket: photos live under <user id>/<photo id>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('duky-photos', 'duky-photos', false, 3000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "own photos: read" on storage.objects;
drop policy if exists "own photos: write" on storage.objects;
drop policy if exists "own photos: update" on storage.objects;
drop policy if exists "own photos: delete" on storage.objects;
create policy "own photos: read" on storage.objects for select
  using (bucket_id = 'duky-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos: write" on storage.objects for insert
  with check (bucket_id = 'duky-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos: update" on storage.objects for update
  using (bucket_id = 'duky-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos: delete" on storage.objects for delete
  using (bucket_id = 'duky-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Public links for single Du Ký pages (ticket #27) ------------------------------------------------------------
-- The backend writes and deletes with the service role key; RLS on with no policies (the table holds key hashes).
create table if not exists public.share_pages (
  id              text        primary key,
  delete_key_hash text        not null,
  meta            jsonb       not null check (pg_column_size(meta) < 4096),
  photos          jsonb       not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);
alter table public.share_pages enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('du-ky-shares', 'du-ky-shares', true, 2500000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 4. Check: three tables and two buckets ------------------------------------------------------------------------
select 'table' as kind, table_name as name from information_schema.tables
where table_schema = 'public' and table_name in ('events', 'duky_books', 'share_pages')
union all
select 'bucket', id from storage.buckets where id in ('duky-photos', 'du-ky-shares')
order by kind, name;
