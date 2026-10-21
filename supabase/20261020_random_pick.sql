-- Additive migration: existing games, statistics and auth settings are untouched.
BEGIN;
CREATE TABLE IF NOT EXISTS public.random_pick_operators (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.random_pick_operators ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.random_pick_operators FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.is_random_pick_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.random_pick_operators WHERE user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_random_pick_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_random_pick_admin() TO anon, authenticated;
CREATE TABLE IF NOT EXISTS public.random_pick_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 140),
  mode text NOT NULL CHECK (mode IN ('pinball','lotto','wheel','cards','slots','teams','ladder','order','pirate')),
  candidates jsonb NOT NULL CHECK (jsonb_typeof(candidates)='array' AND jsonb_array_length(candidates) BETWEEN 2 AND 200 AND octet_length(candidates::text) <= 300000),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(settings)='object' AND octet_length(settings::text) <= 100000),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.random_pick_templates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.random_pick_templates FROM anon, authenticated;
GRANT SELECT ON public.random_pick_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.random_pick_templates TO authenticated;
DROP POLICY IF EXISTS random_pick_read ON public.random_pick_templates;
CREATE POLICY random_pick_read ON public.random_pick_templates FOR SELECT TO anon,authenticated USING (true);
DROP POLICY IF EXISTS random_pick_write ON public.random_pick_templates;
CREATE POLICY random_pick_write ON public.random_pick_templates FOR ALL TO authenticated
USING (public.is_random_pick_admin()) WITH CHECK (public.is_random_pick_admin());
CREATE OR REPLACE FUNCTION public.search_random_pick_worldcups(p_search text DEFAULT '',p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,title text,title_translations jsonb)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
 SELECT w.id,w.title::text,to_jsonb(w.title_translations)
 FROM public.worldcups w
 WHERE w.deleted_at IS NULL
 AND coalesce(to_jsonb(w)->>'is_public','true') <> 'false'
 AND coalesce(to_jsonb(w)->>'visibility','public') NOT IN ('private','unlisted')
 AND (btrim(coalesce(p_search,'')) = '' OR EXISTS (
   SELECT 1 FROM jsonb_path_query(jsonb_build_array(w.title,w.title_translations),'$.** ? (@.type() == "string")') val
   WHERE position(lower(left(btrim(p_search),100)) in lower(val #>> '{}')) > 0
 ))
 ORDER BY w.created_at DESC,w.id DESC LIMIT 13 OFFSET greatest(0,least(coalesce(p_offset,0),100000));
$$;
REVOKE ALL ON FUNCTION public.search_random_pick_worldcups(text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_random_pick_worldcups(text,integer) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
-- After this migration, grant the operator's account explicitly using its Auth user UUID:
-- INSERT INTO public.random_pick_operators(user_id) VALUES ('YOUR_AUTH_USER_UUID') ON CONFLICT DO NOTHING;
-- Never use a user-editable nickname as an authorization rule.
