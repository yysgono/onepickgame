const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require(require.resolve('@electric-sql/pglite',{paths:[process.cwd()+'/tests/deps',process.cwd()+'/../onepickgame/tests/deps']}));
(async()=>{
 const labels=require('../src/seo/categoryLabels.json'),{getCategorySeo}=require('../src/seo/categorySeo.js'),{getDetailLinks}=require('../src/seo/detailLinks.js');
 for(const lang of Object.keys(labels)){for(const key of ['travel','brands']){const meta=getCategorySeo(lang,key);assert(meta);assert.equal(meta.label,labels[lang][key]);assert(meta.title.includes(labels[lang][key]));assert(meta.description.includes(labels[lang][key]));assert(getDetailLinks(lang,key).links[0].href.endsWith('/category/'+key));}}
 const pagerModule=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/utils/worldcupHomePager.js','utf8')).toString('base64'));
 const calls=[];const pager=pagerModule.createWorldcupHomePager({fetchRows:async req=>{calls.push(req);return{rows:Object.fromEntries(req.requests.map(r=>[r.key,{offset:r.offset,total:2,items:[{id:r.key}]}]))};}});
 await pager.ensureRows(pagerModule.PRIMARY_HOME_ROWS);assert(!calls[0].requests.some(row=>['travel','brands'].includes(row.key)));await pager.ensureRows(['travel','brands']);assert.deepEqual(calls[1].requests.map(row=>row.key),['travel','brands']);pager.dispose();
 const db=new PGlite();await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;
 CREATE TABLE worldcups(id uuid PRIMARY KEY,title text,description text,title_translations jsonb,description_translations jsonb,tags jsonb,data jsonb,category text,owner uuid,creator uuid,deleted_at timestamptz,created_at timestamptz DEFAULT now(),is_featured boolean DEFAULT false,featured_order integer);
 CREATE TABLE winner_logs(cup_id uuid,created_at timestamptz DEFAULT now());
 CREATE TABLE test_counts(cup_id uuid,play_count bigint);
 CREATE FUNCTION get_worldcup_play_counts() RETURNS TABLE(cup_id uuid,play_count bigint) LANGUAGE sql AS $$ SELECT * FROM test_counts $$;
 INSERT INTO worldcups(id,title,category)VALUES('00000000-0000-4000-8000-000000000001','Old other game','etc'),('00000000-0000-4000-8000-000000000002','Trip game','travel'),('00000000-0000-4000-8000-000000000003','Brand game','brands');`);
 const before=(await db.query('SELECT id,category FROM worldcups ORDER BY id')).rows;const sql=fs.readFileSync('supabase/20261023_worldcup_categories.sql','utf8');await db.exec(sql);await db.exec(sql);assert.deepEqual((await db.query('SELECT id,category FROM worldcups ORDER BY id')).rows,before);
 const requests=pagerModule.HOME_ROW_KEYS.map(key=>({key,offset:0,limit:12,sort:'popular'}));assert.equal(requests.length,12);
 const result=(await db.query('SELECT public.get_worldcup_home_rows($1::jsonb) AS value',[JSON.stringify(requests)])).rows[0].value;for(const key of ['travel','brands','etc']){assert.equal(result.rows[key].total,1);assert.equal(result.rows[key].items[0].category,key);}assert.equal(result.rows.food.total,0);
 await assert.rejects(db.query('SELECT public.get_worldcup_home_rows($1::jsonb)',[JSON.stringify([{key:'not-a-category',offset:0,limit:12}])]));
 await db.close();console.log('PASS: 16-language category metadata/links, deferred home fetches, 12-row RPC, new/empty/old categories, idempotent SQL and unchanged game categories');
})().catch(e=>{console.error(e);process.exitCode=1});
