-- OnePickGame: guest tier-list multilingual RPC migration
-- 기존 게스트 인증/이미지 검증은 유지하고 다국어 필드만 확장합니다.
-- 새 인자는 DEFAULT NULL이므로 구버전 프론트 호출도 호환됩니다.

begin;

drop function if exists public.create_guest_tier_list(
  text, text, text, text, uuid, text, jsonb, jsonb, jsonb
);

create function public.create_guest_tier_list(
  p_guest_id text,
  p_guest_nickname text,
  p_password text,
  p_title text,
  p_source_worldcup_id uuid,
  p_category text,
  p_tier_labels jsonb,
  p_tiers jsonb,
  p_candidates jsonb,
  p_description text default null,
  p_title_translations jsonb default null,
  p_description_translations jsonb default null,
  p_original_language text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_id uuid;
  v_candidate jsonb;
  v_image text;
  v_image_exists boolean;
  v_original_language text;
  v_title_translations jsonb;
  v_description_translations jsonb;
begin
  if length(trim(coalesce(p_guest_nickname, ''))) < 1
     or length(trim(coalesce(p_guest_nickname, ''))) > 20 then
    raise exception '닉네임은 1~20자로 입력해주세요.';
  end if;

  if length(coalesce(p_password, '')) < 4
     or length(coalesce(p_password, '')) > 50 then
    raise exception '비밀번호는 4~50자로 입력해주세요.';
  end if;

  if length(trim(coalesce(p_title, ''))) < 1
     or length(trim(coalesce(p_title, ''))) > 120 then
    raise exception '티어표 제목을 확인해주세요.';
  end if;

  if length(coalesce(p_description, '')) > 500 then
    raise exception '티어표 설명은 최대 500자까지 입력할 수 있습니다.';
  end if;

  if p_title_translations is not null
     and jsonb_typeof(p_title_translations) <> 'object' then
    raise exception '제목 번역 데이터가 올바르지 않습니다.';
  end if;

  if p_description_translations is not null
     and jsonb_typeof(p_description_translations) <> 'object' then
    raise exception '설명 번역 데이터가 올바르지 않습니다.';
  end if;

  v_original_language :=
    nullif(trim(coalesce(p_original_language, '')), '');

  if v_original_language is not null
     and length(v_original_language) > 20 then
    raise exception '원본 언어 코드가 올바르지 않습니다.';
  end if;

  v_title_translations := coalesce(p_title_translations, '{}'::jsonb);

  if v_original_language is not null then
    v_title_translations :=
      v_title_translations ||
      jsonb_build_object(v_original_language, trim(p_title));
  end if;

  v_description_translations :=
    coalesce(p_description_translations, '{}'::jsonb);

  if v_original_language is not null
     and trim(coalesce(p_description, '')) <> '' then
    v_description_translations :=
      v_description_translations ||
      jsonb_build_object(v_original_language, trim(p_description));
  end if;

  if jsonb_typeof(coalesce(p_candidates, '[]'::jsonb)) <> 'array' then
    raise exception '후보 데이터가 올바르지 않습니다.';
  end if;

  if jsonb_array_length(coalesce(p_candidates, '[]'::jsonb)) < 1 then
    raise exception '후보가 한 명 이상 필요합니다.';
  end if;

  if jsonb_array_length(coalesce(p_candidates, '[]'::jsonb)) > 1024 then
    raise exception '후보는 최대 1024명까지 가능합니다.';
  end if;

  for v_candidate in
    select value
    from jsonb_array_elements(coalesce(p_candidates, '[]'::jsonb))
  loop
    v_image := trim(coalesce(v_candidate ->> 'image', ''));

    if v_image = '' then
      continue;
    end if;

    select exists (
      select 1
      from public.worldcups w
      cross join lateral jsonb_array_elements(
        coalesce(w.data::jsonb, '[]'::jsonb)
      ) wc
      where wc ->> 'image' = v_image

      union all

      select 1
      from public.tier_lists tl
      cross join lateral jsonb_array_elements(
        coalesce(tl.candidates, '[]'::jsonb)
      ) tc
      where tc ->> 'image' = v_image
    )
    into v_image_exists;

    if not v_image_exists then
      raise exception '게스트는 기존 후보 이미지만 사용할 수 있습니다.';
    end if;
  end loop;

  v_id := gen_random_uuid();

  insert into public.tier_lists (
    id,
    user_id,
    guest_id,
    guest_nickname,
    title,
    description,
    title_translations,
    description_translations,
    original_language,
    source_worldcup_id,
    category,
    tier_labels,
    tiers,
    candidates,
    created_at,
    updated_at
  )
  values (
    v_id,
    null,
    nullif(trim(coalesce(p_guest_id, '')), ''),
    trim(p_guest_nickname),
    trim(p_title),
    trim(coalesce(p_description, '')),
    v_title_translations,
    v_description_translations,
    v_original_language,
    p_source_worldcup_id,
    coalesce(nullif(trim(coalesce(p_category, '')), ''), 'other'),
    coalesce(
      p_tier_labels,
      '{"S":"S","A":"A","B":"B","C":"C","D":"D"}'::jsonb
    ),
    coalesce(p_tiers, '{}'::jsonb),
    coalesce(p_candidates, '[]'::jsonb),
    now(),
    now()
  );

  insert into public.tier_list_guest_auth (
    tier_list_id,
    password_hash
  )
  values (
    v_id,
    crypt(p_password, gen_salt('bf'))
  );

  return v_id;
end;
$function$;

grant execute on function public.create_guest_tier_list(
  text, text, text, text, uuid, text, jsonb, jsonb, jsonb,
  text, jsonb, jsonb, text
) to anon, authenticated;


drop function if exists public.update_guest_tier_list(
  uuid, text, text, text, jsonb, jsonb, jsonb
);

create function public.update_guest_tier_list(
  p_tier_list_id uuid,
  p_password text,
  p_title text,
  p_category text,
  p_tier_labels jsonb,
  p_tiers jsonb,
  p_candidates jsonb,
  p_description text default null,
  p_title_translations jsonb default null,
  p_description_translations jsonb default null,
  p_original_language text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_hash text;
  v_candidate jsonb;
  v_image text;
  v_image_exists boolean;
  v_original_language text;
  v_title_translations jsonb;
  v_description_translations jsonb;
begin
  if not exists (
    select 1
    from public.tier_lists
    where id = p_tier_list_id
      and user_id is null
  ) then
    raise exception '게스트 티어표가 아닙니다.';
  end if;

  select password_hash
  into v_hash
  from public.tier_list_guest_auth
  where tier_list_id = p_tier_list_id;

  if v_hash is null then
    raise exception '게스트 인증 정보가 없습니다.';
  end if;

  if crypt(coalesce(p_password, ''), v_hash) <> v_hash then
    raise exception '비밀번호가 올바르지 않습니다.';
  end if;

  if length(trim(coalesce(p_title, ''))) < 1
     or length(trim(coalesce(p_title, ''))) > 120 then
    raise exception '티어표 제목을 확인해주세요.';
  end if;

  if p_description is not null
     and length(p_description) > 500 then
    raise exception '티어표 설명은 최대 500자까지 입력할 수 있습니다.';
  end if;

  if p_title_translations is not null
     and jsonb_typeof(p_title_translations) <> 'object' then
    raise exception '제목 번역 데이터가 올바르지 않습니다.';
  end if;

  if p_description_translations is not null
     and jsonb_typeof(p_description_translations) <> 'object' then
    raise exception '설명 번역 데이터가 올바르지 않습니다.';
  end if;

  v_original_language :=
    nullif(trim(coalesce(p_original_language, '')), '');

  if v_original_language is not null
     and length(v_original_language) > 20 then
    raise exception '원본 언어 코드가 올바르지 않습니다.';
  end if;

  if p_title_translations is not null then
    v_title_translations := p_title_translations;

    if v_original_language is not null then
      v_title_translations :=
        v_title_translations ||
        jsonb_build_object(v_original_language, trim(p_title));
    end if;
  else
    v_title_translations := null;
  end if;

  if p_description_translations is not null then
    v_description_translations := p_description_translations;

    if v_original_language is not null
       and trim(coalesce(p_description, '')) <> '' then
      v_description_translations :=
        v_description_translations ||
        jsonb_build_object(
          v_original_language,
          trim(coalesce(p_description, ''))
        );
    end if;
  else
    v_description_translations := null;
  end if;

  if jsonb_typeof(coalesce(p_candidates, '[]'::jsonb)) <> 'array' then
    raise exception '후보 데이터가 올바르지 않습니다.';
  end if;

  if jsonb_array_length(coalesce(p_candidates, '[]'::jsonb)) < 1 then
    raise exception '후보가 한 명 이상 필요합니다.';
  end if;

  if jsonb_array_length(coalesce(p_candidates, '[]'::jsonb)) > 1024 then
    raise exception '후보는 최대 1024명까지 가능합니다.';
  end if;

  for v_candidate in
    select value
    from jsonb_array_elements(coalesce(p_candidates, '[]'::jsonb))
  loop
    v_image := trim(coalesce(v_candidate ->> 'image', ''));

    if v_image = '' then
      continue;
    end if;

    select exists (
      select 1
      from public.worldcups w
      cross join lateral jsonb_array_elements(
        coalesce(w.data::jsonb, '[]'::jsonb)
      ) wc
      where wc ->> 'image' = v_image

      union all

      select 1
      from public.tier_lists tl
      cross join lateral jsonb_array_elements(
        coalesce(tl.candidates, '[]'::jsonb)
      ) tc
      where tc ->> 'image' = v_image
    )
    into v_image_exists;

    if not v_image_exists then
      raise exception '게스트는 기존 후보 이미지만 사용할 수 있습니다.';
    end if;
  end loop;

  update public.tier_lists
  set
    title = trim(p_title),

    description =
      case
        when p_description is null then description
        else trim(p_description)
      end,

    title_translations =
      case
        when v_title_translations is null then title_translations
        else v_title_translations
      end,

    description_translations =
      case
        when v_description_translations is null then description_translations
        else v_description_translations
      end,

    original_language =
      case
        when v_original_language is null then original_language
        else v_original_language
      end,

    category =
      coalesce(nullif(trim(coalesce(p_category, '')), ''), 'other'),

    tier_labels =
      coalesce(
        p_tier_labels,
        '{"S":"S","A":"A","B":"B","C":"C","D":"D"}'::jsonb
      ),

    tiers = coalesce(p_tiers, '{}'::jsonb),

    candidates = coalesce(p_candidates, '[]'::jsonb),

    updated_at = now()

  where id = p_tier_list_id;

  return true;
end;
$function$;

grant execute on function public.update_guest_tier_list(
  uuid, text, text, text, jsonb, jsonb, jsonb,
  text, jsonb, jsonb, text
) to anon, authenticated;

commit;
