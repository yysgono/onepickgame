CREATE OR REPLACE FUNCTION public.record_blog_view(p_slug text, p_language text, p_visitor_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.blog_views (
    slug,
    language,
    visitor_id,
    view_date
  )
  values (
    p_slug,
    p_language,
    p_visitor_id,
    timezone('Asia/Seoul', now())::date
  )
  on conflict (
    slug,
    language,
    visitor_id,
    view_date
  )
  do nothing;
end;
$function$
