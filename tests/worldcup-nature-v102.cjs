const fs=require('fs'),assert=require('node:assert/strict'),{PGlite}=require('@electric-sql/pglite');
(async()=>{
 const labels=require('../src/seo/categoryLabels.json'),{getCategorySeo}=require('../src/seo/categorySeo'),{getDetailLinks}=require('../src/seo/detailLinks');
 assert.equal(Object.keys(labels).length,16);
 for(const lang of Object.keys(labels)){
  const meta=getCategorySeo(lang,'animals-plants');assert.ok(meta);assert.equal(meta.key,'animals_plants');assert.equal(meta.label,labels[lang].animals_plants);assert.ok(meta.title.includes(meta.label));assert.equal(getDetailLinks(lang,'animals_plants').links[0].href,`/${lang}/category/animals-plants`);
 }
 const pager=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/utils/worldcupHomePager.js','utf8')).toString('base64'));
 assert.equal(pager.HOME_ROW_KEYS.length,13);const calls=[];const instance=pager.createWorldcupHomePager({fetchRows:async request=>{calls.push(request);return {rows:Object.fromEntries(request.requests.map(r=>[r.key,{offset:r.offset,total:0,items:[]}]))};}});
 await instance.ensureRows(pager.PRIMARY_HOME_ROWS);assert.ok(!calls[0].requests.some(r=>r.key==='animals_plants'));await instance.ensureRows(['animals_plants']);assert.equal(calls[1].requests[0].key,'animals_plants');instance.dispose();
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;
 create table worldcups(id uuid primary key,title text,description text,title_translations jsonb,description_translations jsonb,tags jsonb,data jsonb,category text,owner uuid,creator uuid,deleted_at timestamptz,created_at timestamptz default now(),is_featured boolean default false,featured_order integer);
 create table winner_logs(cup_id uuid,created_at timestamptz default now());
 create function get_worldcup_play_counts() returns table(cup_id uuid,play_count bigint) language sql as $$select null::uuid,0::bigint where false$$;
 insert into worldcups(id,title,category) values('00000000-0000-4000-8000-000000000001','Old game','etc'),('00000000-0000-4000-8000-000000000002','Animals game','animals_plants');`);
 const base=fs.readFileSync('supabase/20261014_worldcup_home_paging.sql','utf8').replace("'food','etc'","'food','travel','brands','etc'");await db.exec(base);
 const before=(await db.query('select id,category from worldcups order by id')).rows;
 const sql=fs.readFileSync('supabase/20261028_worldcup_nature_v102.sql','utf8');await db.exec(sql);await db.exec(sql);
 assert.deepEqual((await db.query('select id,category from worldcups order by id')).rows,before);
 const requests=pager.HOME_ROW_KEYS.map(key=>({key,offset:0,limit:12,sort:'popular'}));
 const result=(await db.query('select get_worldcup_home_rows($1::jsonb) as value',[JSON.stringify(requests)])).rows[0].value;
 assert.equal(result.rows.animals_plants.total,1);assert.equal(result.rows.animals_plants.items[0].category,'animals_plants');assert.equal(result.rows.etc.total,1);
 await assert.rejects(db.query('select get_worldcup_home_rows($1::jsonb)',[JSON.stringify([{key:'invalid',offset:0,limit:1}])]),/Invalid home page range/);
 const flags=(await db.query("select prosecdef from pg_proc where oid='public.get_worldcup_home_rows(jsonb,text,text,boolean)'::regprocedure")).rows[0];assert.equal(flags.prosecdef,false);
 await db.close();console.log('PASS: 16-language metadata and links, deferred home load, 13-row RPC, idempotent validator update, existing data and invoker security unchanged');
})().catch(e=>{console.error(e);process.exitCode=1});
