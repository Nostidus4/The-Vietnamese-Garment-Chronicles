-- Public links for single Du Ký pages (ticket #27). Run once in Supabase → SQL Editor.
-- The backend writes and deletes with the service role key; RLS is on with no policies, so the public key
-- cannot read the table (it holds delete key hashes). Photos go to a public bucket, served by their URL.
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
