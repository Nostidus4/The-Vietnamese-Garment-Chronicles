-- Du Ký cloud copy (ticket #28): optional, only for readers who sign in with a magic link.
-- Each reader sees and changes only their own row and their own folder of photos (row level security on auth.uid()).
-- Run once in the Supabase SQL editor.

create table if not exists public.duky_books (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
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
