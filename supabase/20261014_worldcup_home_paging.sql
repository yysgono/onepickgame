-- Read-only homepage paging. Run in Supabase SQL Editor before merging/deploying.
begin;
create or replace function public.get_worldcup_home_rows(
  p_requests jsonb,
  p_search text default '',
  p_creator text default '',
  p_include_activity boolean default false
) returns jsonb
language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
  v_search text := lower(left(regexp_replace(btrim(coalesce(p_search,'')), '^#+', ''),50));
  v_result jsonb;
begin
  if jsonb_typeof(p_requests) is distinct from 'array' then raise exception 'Invalid home page request'; end if;
  if jsonb_array_length(p_requests) not between 1 and 10 then raise exception 'Invalid home page count'; end if;
  if exists(select 1 from jsonb_to_recordset(p_requests) r(key text, "offset" integer, "limit" integer, sort text)
    where r.key is null or r.key not in ('featured','korea','anime_manga','person','game','sports','music','movie_drama','food','etc')
      or r."offset" is null or r."offset" < 0 or r."limit" is null or r."limit" not between 1 and 40
      or coalesce(r.sort,'popular') not in ('popular','recent')) then raise exception 'Invalid home page range'; end if;
  if (select count(distinct value->>'key') from jsonb_array_elements(p_requests)) <> jsonb_array_length(p_requests) then
    raise exception 'Duplicate home rows'; end if;

  with plays as materialized (
    select cup_id::text as cup_id, play_count::bigint as play_count from public.get_worldcup_play_counts()
  ), filtered as materialized (
    select w.id,w.created_at,coalesce(w.category,'etc') as category,w.is_featured,w.featured_order,
      coalesce(p.play_count,0) as play_count
    from public.worldcups w left join plays p on p.cup_id = w.id::text
    where w.deleted_at is null
      and (coalesce(p_creator,'') = '' or coalesce(nullif(w.owner::text,''),w.creator::text,'') = p_creator)
      and (v_search = '' or exists (
        -- Search values, not JSON keys, in every title/description/candidate translation.
        select 1 from jsonb_path_query(
          jsonb_build_array(w.title,w.description,to_jsonb(w)->'desc',w.title_translations,w.description_translations,w.tags,
            (select jsonb_agg(jsonb_build_array(c->'name',c->'title',c->'name_translations',c->'title_translations'))
              from jsonb_array_elements(case when jsonb_typeof(w.data::jsonb)='array' then w.data::jsonb else '[]'::jsonb end) c)),
          '$.** ? (@.type() == "string")'
        ) text_value
        where position(v_search in lower(regexp_replace(btrim(text_value #>> '{}'), '^#+',''))) > 0
      ))
  ), counts as (
    select category as key,count(*)::integer as total from filtered group by category
    union all select 'featured',count(*)::integer from filtered where is_featured is true
  ), requested as (
    select * from jsonb_to_recordset(p_requests) r(key text,"offset" integer,"limit" integer,sort text)
  ), results as (
    select r.key,jsonb_build_object(
      'offset',r."offset",'total',coalesce((select c.total from counts c where c.key=r.key),0),
      'items',coalesce((
        select jsonb_agg(item order by ordinal) from (
          select to_jsonb(w) || jsonb_build_object('play_count',page.play_count) as item,
            page.ordinal
          from (
            select f.*,row_number() over(order by
              case when r.key='featured' then coalesce(f.featured_order,999999) end asc,
              case when r.key<>'featured' and coalesce(r.sort,'popular')='popular' then f.play_count end desc,
              f.created_at desc,f.id desc) as ordinal from filtered f
            where (r.key='featured' and f.is_featured is true) or (r.key<>'featured' and f.category=r.key)
            order by case when r.key='featured' then coalesce(f.featured_order,999999) end asc,
              case when r.key<>'featured' and coalesce(r.sort,'popular')='popular' then f.play_count end desc,
              f.created_at desc,f.id desc
            offset r."offset" limit r."limit"
          ) page join public.worldcups w on w.id=page.id
        ) items
      ),'[]'::jsonb)
    ) as value from requested r
  )
  select jsonb_build_object('rows',coalesce((select jsonb_object_agg(key,value) from results),'{}'::jsonb),
    'totals',coalesce((select jsonb_object_agg(key,total) from counts),'{}'::jsonb)) into v_result;

  if p_include_activity then
    v_result := v_result || jsonb_build_object('activity',jsonb_build_object(
      'created',coalesce((select jsonb_agg(item order by created_at desc,id desc) from (
        select w.id,w.created_at,jsonb_build_object('cup',jsonb_build_object('id',w.id,'title',w.title,
          'title_translations',w.title_translations),'time',w.created_at) item
        from public.worldcups w where w.deleted_at is null order by w.created_at desc,w.id desc limit 6
      ) recent),'[]'::jsonb),
      'played',coalesce((select jsonb_agg(item order by last_play desc,id desc) from (
        select w.id,max(l.created_at) last_play,jsonb_build_object('cup',jsonb_build_object('id',w.id,'title',w.title,
          'title_translations',w.title_translations),'time',max(l.created_at)) item
        from (select cup_id,created_at from public.winner_logs order by created_at desc limit 30) l
        join public.worldcups w on w.id::text=l.cup_id::text and w.deleted_at is null
        group by w.id order by max(l.created_at) desc,w.id desc limit 6
      ) recent),'[]'::jsonb)
    ));
  end if;
  return v_result;
end $$;
revoke all on function public.get_worldcup_home_rows(jsonb,text,text,boolean) from public;
grant execute on function public.get_worldcup_home_rows(jsonb,text,text,boolean) to anon,authenticated;
-- Small recommendation cards for game detail pages. These must never be used as full games.
create or replace function public.get_worldcup_related_cards(p_id uuid)
returns jsonb language sql security invoker set search_path = public, pg_temp as $$
  with current_game as (select id,category,coalesce(nullif(owner::text,''),creator::text) creator_id from public.worldcups where id=p_id and deleted_at is null),
  same_category as (
    select w.id from public.worldcups w,current_game c where w.deleted_at is null and w.id<>c.id
      and coalesce(w.category,'etc')=coalesce(c.category,'etc') order by w.created_at desc,w.id desc limit 4
  ), same_creator as (
    select w.id from public.worldcups w,current_game c where w.deleted_at is null and w.id<>c.id
      and c.creator_id is not null and coalesce(nullif(w.owner::text,''),w.creator::text)=c.creator_id
      order by w.created_at desc,w.id desc limit 1
  )
  select coalesce(jsonb_agg(card order by created_at desc,id desc),'[]'::jsonb) from (
    select w.id,w.created_at,(to_jsonb(w)-'data') || jsonb_build_object('_homeCardOnly',true,'data',
      coalesce((select jsonb_agg(candidate) from (select value as candidate from jsonb_array_elements(case when jsonb_typeof(w.data::jsonb)='array' then w.data::jsonb else '[]'::jsonb end) limit 1) preview),'[]'::jsonb)) as card
    from public.worldcups w where w.id in (select id from same_category union select id from same_creator)
  ) cards;
$$;
revoke all on function public.get_worldcup_related_cards(uuid) from public;
grant execute on function public.get_worldcup_related_cards(uuid) to anon,authenticated;

notify pgrst,'reload schema';
commit;
