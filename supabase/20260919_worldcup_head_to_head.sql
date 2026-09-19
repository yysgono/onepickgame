-- OnePickGame: Worldcup head-to-head statistics
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.worldcup_head_to_head (
  cup_id text not null,
  candidate_a_id text not null,
  candidate_b_id text not null,
  a_wins bigint not null default 0 check (a_wins >= 0),
  b_wins bigint not null default 0 check (b_wins >= 0),
  match_count bigint not null default 0 check (match_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (cup_id, candidate_a_id, candidate_b_id),
  check (candidate_a_id < candidate_b_id)
);

alter table public.worldcup_head_to_head enable row level security;

revoke all on table public.worldcup_head_to_head from anon, authenticated;

create or replace function public.record_worldcup_head_to_head(
  p_cup_id text,
  p_matches jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m jsonb;
  c1 text;
  c2 text;
  winner text;
  a text;
  b text;
  add_a bigint;
  add_b bigint;
begin
  if p_cup_id is null or btrim(p_cup_id) = '' then
    return;
  end if;

  if p_matches is null or jsonb_typeof(p_matches) <> 'array' then
    return;
  end if;

  for m in
    select value
    from jsonb_array_elements(p_matches)
  loop
    c1 := nullif(btrim(m ->> 'candidate_1_id'), '');
    c2 := nullif(btrim(m ->> 'candidate_2_id'), '');
    winner := nullif(btrim(m ->> 'winner_id'), '');

    if c1 is null or c2 is null or winner is null or c1 = c2 then
      continue;
    end if;

    if winner <> c1 and winner <> c2 then
      continue;
    end if;

    if c1 < c2 then
      a := c1;
      b := c2;
    else
      a := c2;
      b := c1;
    end if;

    add_a := case when winner = a then 1 else 0 end;
    add_b := case when winner = b then 1 else 0 end;

    insert into public.worldcup_head_to_head (
      cup_id,
      candidate_a_id,
      candidate_b_id,
      a_wins,
      b_wins,
      match_count,
      updated_at
    )
    values (
      p_cup_id,
      a,
      b,
      add_a,
      add_b,
      1,
      now()
    )
    on conflict (cup_id, candidate_a_id, candidate_b_id)
    do update set
      a_wins = public.worldcup_head_to_head.a_wins + excluded.a_wins,
      b_wins = public.worldcup_head_to_head.b_wins + excluded.b_wins,
      match_count = public.worldcup_head_to_head.match_count + 1,
      updated_at = now();
  end loop;
end;
$$;

create or replace function public.get_worldcup_head_to_head(
  p_cup_id text,
  p_candidate_1 text,
  p_candidate_2 text
)
returns table (
  candidate1_wins bigint,
  candidate2_wins bigint,
  total_matches bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  a text;
  b text;
  row_data public.worldcup_head_to_head%rowtype;
begin
  if
    p_cup_id is null or
    p_candidate_1 is null or
    p_candidate_2 is null or
    p_candidate_1 = p_candidate_2
  then
    return query select 0::bigint, 0::bigint, 0::bigint;
    return;
  end if;

  if p_candidate_1 < p_candidate_2 then
    a := p_candidate_1;
    b := p_candidate_2;
  else
    a := p_candidate_2;
    b := p_candidate_1;
  end if;

  select *
  into row_data
  from public.worldcup_head_to_head h
  where h.cup_id = p_cup_id
    and h.candidate_a_id = a
    and h.candidate_b_id = b;

  if not found then
    return query select 0::bigint, 0::bigint, 0::bigint;
    return;
  end if;

  if p_candidate_1 = a then
    return query
      select row_data.a_wins, row_data.b_wins, row_data.match_count;
  else
    return query
      select row_data.b_wins, row_data.a_wins, row_data.match_count;
  end if;
end;
$$;

revoke all on function public.record_worldcup_head_to_head(text, jsonb) from public;
revoke all on function public.get_worldcup_head_to_head(text, text, text) from public;

grant execute on function public.record_worldcup_head_to_head(text, jsonb)
  to anon, authenticated;
grant execute on function public.get_worldcup_head_to_head(text, text, text)
  to anon, authenticated;
