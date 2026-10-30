const fs=require('fs'),assert=require('node:assert/strict');const {PGlite}=require('@electric-sql/pglite');
const rows=JSON.parse(fs.readFileSync(__dirname+'/fixtures/content-languages-v151/constraints.json'));const funcs=JSON.parse(fs.readFileSync(__dirname+'/fixtures/content-languages-v151/functions.json'));const migration=fs.readFileSync(__dirname+'/../APPLY-v151-languages.sql','utf8');
(async()=>{const db=new PGlite();await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
CREATE FUNCTION can_publish_site_content() RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.publisher',true),'false')='true'$$;
CREATE TABLE worldcups(id uuid primary key default gen_random_uuid(),original_language text,data jsonb,deleted_at timestamptz);
CREATE TABLE community_posts(id uuid primary key default gen_random_uuid(),board text,title text,body text,body_html text,language text,category text,language_only boolean,author_id uuid);
CREATE TABLE blog_posts(id bigint generated always as identity,language text,slug text,title text,description text,content text,unique(language,slug));
CREATE TABLE blog_views(slug text,language text,visitor_id text,view_date date,unique(slug,language,visitor_id,view_date));
CREATE TABLE blog_daily_counts_v149(day_kst date,language text,slug text,views bigint,primary key(day_kst,language,slug));
CREATE TABLE blog_view_dedup_v149(day_kst date,language text,slug text,visitor_hash text,last_counted_at timestamptz,primary key(day_kst,language,slug,visitor_hash));
CREATE TABLE quizzes(id uuid primary key,user_id uuid,guest_nickname text,title text,title_translations jsonb,description text,description_translations jsonb,category text,thumbnail_url text,question_count integer,original_language text,content_languages text[],answer_reveal_mode text,source_worldcup_ids uuid[],is_published boolean);
CREATE TABLE quiz_questions(quiz_id uuid,question_type text,question_text text,question_translations jsonb,image_url text,options jsonb,options_translations jsonb,correct_index integer,answers jsonb,answer_match_options jsonb,explanation text,explanation_translations jsonb,source_worldcup_id text,source_candidate_id text,auto_choices boolean,sort_order integer);
CREATE TABLE quiz_guest_auth(quiz_id uuid,nickname text,password_hash text);
-- Test-only auth/crypto helpers: no production crypto code is modified by the migration.
CREATE FUNCTION crypt(text,text) RETURNS text LANGUAGE sql AS $$SELECT 'test-hash:'||$1$$;
CREATE FUNCTION gen_salt(text,integer) RETURNS text LANGUAGE sql AS $$SELECT 'test-only'::text$$;
CREATE FUNCTION _check_guest_quiz_password(uuid,text,text) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM quiz_guest_auth WHERE quiz_id=$1 AND nickname=$2 AND password_hash=crypt($3,''))$$;
`);
for(const r of rows.filter(r=>r.kind==='03_check'&&/\.worldcups_original_language_check$|\.community_posts_language_check$/.test(r.object_name))){const [t,c]=r.object_name.split('.');await db.exec(`ALTER TABLE ${t} ADD CONSTRAINT ${c} ${r.definition}`);}
for(const f of funcs)await db.exec(f.definition+';');await db.exec(fs.readFileSync(__dirname+'/fixtures/content-languages-v151/record_blog_view.sql','utf8')+';');
await db.exec("REVOKE ALL ON FUNCTION save_site_blog(text,text,text,text,text,boolean) FROM public; GRANT EXECUTE ON FUNCTION save_site_blog(text,text,text,text,text,boolean) TO authenticated;");
await db.exec("INSERT INTO worldcups(original_language,data) VALUES ('ja','[{\"name\":\"original candidate\"}]'); INSERT INTO blog_posts(language,slug,title,description,content) VALUES ('ja','legacy-post','Original title','Original description','Original article');");
const contentBefore=(await db.query("SELECT to_jsonb(w) row FROM worldcups w UNION ALL SELECT to_jsonb(b) FROM blog_posts b")).rows;
const state=()=>db.query("SELECT oid,proowner,proacl,prosecdef,proconfig,prosrc FROM pg_proc WHERE pronamespace='public'::regnamespace ORDER BY oid");const before=(await state()).rows;
await assert.rejects(db.query("insert into worldcups(original_language) values ('it')"));
await db.exec(migration);assert.deepEqual((await db.query("SELECT to_jsonb(w) row FROM worldcups w UNION ALL SELECT to_jsonb(b) FROM blog_posts b")).rows,contentBefore,'existing contents unchanged');const once=(await state()).rows;await db.exec(migration);assert.deepEqual((await state()).rows,once,'second apply no-op');
for(let i=0;i<before.length;i++){const {prosrc:old,...a}=before[i],{prosrc:now,...b}=once[i];assert.deepEqual(a,b,'owner/grants/security unchanged');assert.equal(now.replace(",'it','pl','nl','cs'",''),old,'only allowed lists change');}
await db.exec("SELECT set_config('test.uid','00000000-0000-4000-8000-000000000001',false),set_config('test.publisher','true',false)");
for(const lang of ['it','pl','nl','cs','en','ko']){
await db.query('insert into worldcups(original_language) values ($1)',[lang]);
await db.query('select save_site_blog($1,$2,$3,$4,$5,false)',[lang,'test-'+lang,'Title','Description','<p>Body</p>']);
await db.query('select save_site_blog($1,$2,$3,$4,$5,true)',[lang,'test-'+lang,'Updated','Description','<p>Edited</p>']);
for(const board of ['community','notices']){const id=(await db.query('select save_community_rich_post(null,$1,$2,$3,$4,$5,$6,false) id',[board,'Title','Body','<p>Body</p>',lang,'general'])).rows[0].id;await db.query('select save_community_rich_post($1,$2,$3,$4,$5,$6,$7,true)',[id,board,'Updated','Edited','<p>Edited</p>',lang,'general']);assert.equal((await db.query('select language from community_posts where id=$1',[id])).rows[0].language,lang);}
await db.query('select record_blog_view_v149($1,$2,$3)',['test-'+lang,lang,'visitor']);await db.query('select record_blog_view_v149($1,$2,$3)',['test-'+lang,lang,'visitor']);
assert.equal(Number((await db.query('select views from blog_daily_counts_v149 where language=$1',[lang])).rows[0].views),1);
assert.equal((await db.query('select * from blog_views where language=$1',[lang])).rows.length,1);
const quiz={title:'Title',description:'Desc',original_language:lang,content_languages:[lang],category:'knowledge',answer_reveal_mode:'both'};const questions=[{question_type:'short_answer',question_text:'Question',answers:['Answer']}];
const id=(await db.query('select save_guest_quiz(null,$1,$2,$3,$4) result',['guest','pass1234',quiz,questions])).rows[0].result.id;assert.ok(id);
await db.query('select save_guest_quiz($1,$2,$3,$4,$5)',[id,'guest','pass1234',{...quiz,title:'Updated'},questions]);
assert.deepEqual((await db.query('select content_languages from quizzes where id=$1',[id])).rows[0].content_languages,[lang]);
}
await assert.rejects(db.query("insert into worldcups(original_language) values ('xx')"));
await assert.rejects(db.query("select save_site_blog('xx','bad','Title','','Body',false)"));
await assert.rejects(db.query("select save_community_rich_post(null,'community','Title','Body','Body','xx','general',false)"));
await db.exec("select set_config('test.uid','',false),set_config('test.publisher','false',false)");
await assert.rejects(db.query("select save_community_rich_post(null,'community','Title','Body','Body','it','general',false)"));
await assert.rejects(db.query("select save_site_blog('it','unauthorized','Title','','Body',false)"));
// Drift protection: transaction rolls back earlier function edits when a later constraint differs.
for(const f of funcs)await db.exec(f.definition+';');await db.exec('ALTER TABLE worldcups DROP CONSTRAINT worldcups_original_language_check; ALTER TABLE worldcups ADD CONSTRAINT worldcups_original_language_check CHECK (original_language IS NULL) NOT VALID;');
const prior=(await state()).rows;await assert.rejects(db.exec(migration),/constraint changed/);await db.exec('ROLLBACK');assert.deepEqual((await state()).rows,prior,'migration rolls back all earlier edits');
await db.close();console.log('PASS: PostgreSQL migration; repeated apply; worldcup, posts create/edit, guest quiz create/edit, daily/cumulative view dedup, invalid-language rejection, auth checks, ACL/security preservation, drift rollback.');
})().catch(e=>{console.error(e);process.exitCode=1});
