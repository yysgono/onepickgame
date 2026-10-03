create extension if not exists pgcrypto;

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  participant_id text,
  attempt_token text not null,
  answered_count integer not null default 0,
  correct_count integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists quiz_attempts_created_at_idx
  on public.quiz_attempts (created_at desc);

create index if not exists quiz_attempts_quiz_id_created_at_idx
  on public.quiz_attempts (quiz_id, created_at desc);

create unique index if not exists quiz_attempts_attempt_token_idx
  on public.quiz_attempts (attempt_token);

alter table public.quiz_attempts enable row level security;

drop policy if exists "Anyone can read quiz attempts"
  on public.quiz_attempts;

create policy "Anyone can read quiz attempts"
  on public.quiz_attempts
  for select
  using (true);

drop policy if exists "Anyone can add quiz attempts"
  on public.quiz_attempts;

create policy "Anyone can add quiz attempts"
  on public.quiz_attempts
  for insert
  with check (true);

drop policy if exists "Anyone can upsert quiz attempts"
  on public.quiz_attempts;

create policy "Anyone can upsert quiz attempts"
  on public.quiz_attempts
  for update
  using (true)
  with check (true);
