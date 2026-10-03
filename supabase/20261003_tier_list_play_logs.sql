create extension if not exists pgcrypto;

create table if not exists public.tier_list_play_logs (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references public.tier_lists(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

create index if not exists tier_list_play_logs_created_at_idx
  on public.tier_list_play_logs (created_at desc);

create index if not exists tier_list_play_logs_tier_list_id_idx
  on public.tier_list_play_logs (tier_list_id);

alter table public.tier_list_play_logs enable row level security;

drop policy if exists "Anyone can read tier list play logs"
  on public.tier_list_play_logs;

create policy "Anyone can read tier list play logs"
  on public.tier_list_play_logs
  for select
  using (true);

drop policy if exists "Anyone can add tier list play logs"
  on public.tier_list_play_logs;

create policy "Anyone can add tier list play logs"
  on public.tier_list_play_logs
  for insert
  with check (true);
