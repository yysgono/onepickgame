const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require(require.resolve('@electric-sql/pglite',{paths:[process.cwd()+'/tests/deps',process.cwd()+'/../onepickgame/tests/deps']}));
(async()=>{
 const db=new PGlite();
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE TABLE worldcups(id uuid PRIMARY KEY,title text,title_translations jsonb,category text,deleted_at timestamptz,created_at timestamptz DEFAULT now(),is_public boolean DEFAULT true,visibility text DEFAULT 'public');
 CREATE FUNCTION is_random_pick_admin() RETURNS boolean LANGUAGE sql AS $$ SELECT current_setting('test.admin',true)='yes' $$;
 GRANT SELECT ON worldcups TO anon,authenticated;`);
 await db.exec(fs.readFileSync('supabase/20261021_random_pick_recommendations.sql','utf8'));
 const ids=Array.from({length:15},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
 for(let i=0;i<ids.length;i++)await db.query('INSERT INTO worldcups(id,title,title_translations,category,is_public) VALUES($1,$2,$3,$4,$5)',[ids[i],`Title ${i}`,JSON.stringify({ko:`한글 ${i}`,en:`English ${i}`,ja:`日本語 ${i}`}),i%2?'game':'food',i!==14]);
 await db.exec("SET ROLE authenticated; SET test.admin='yes'");
 await db.query('SELECT save_random_pick_recommendations($1::uuid[])',[ids.slice(0,10)]);
 assert.equal((await db.query("SELECT * FROM browse_random_pick_worldcups('',0,'',true)")).rows.length,10);
 assert.equal((await db.query("SELECT * FROM browse_random_pick_worldcups('日本語 1',0,'food',false)")).rows.length,5); // global multilingual search, includes game category
 assert((await db.query("SELECT * FROM browse_random_pick_worldcups('',0,'food',false)")).rows.every(r=>Number(r.title.split(' ')[1])%2===0));
 assert.equal((await db.query("SELECT * FROM browse_random_pick_worldcups('',0,'',false)")).rows.length,13);
 assert.equal((await db.query("SELECT * FROM browse_random_pick_worldcups('',12,'',false)")).rows.length,2);
 await assert.rejects(db.query('SELECT save_random_pick_recommendations($1::uuid[])',[ids.slice(0,11)]));
 await assert.rejects(db.query('SELECT save_random_pick_recommendations($1::uuid[])',[[ids[14]]]));
 assert.equal((await db.query('SELECT * FROM random_pick_recommendations')).rows.length,10);
 await db.exec("SET test.admin='no'");
 await assert.rejects(db.query('SELECT save_random_pick_recommendations($1::uuid[])',[[]]));
 await assert.rejects(db.query('INSERT INTO random_pick_recommendations VALUES(1,$1)',[ids[10]]));
 await db.exec('SET ROLE anon');
 assert.equal((await db.query("SELECT * FROM browse_random_pick_worldcups('',0,'',true)")).rows.length,10);
 await assert.rejects(db.query('SELECT save_random_pick_recommendations($1::uuid[])',[[]]));
 await db.close();console.log('PASS: recommendation cap, multilingual global search, category filter, paging, private exclusion, atomic failure, admin RLS and anonymous read-only access');
})().catch(e=>{console.error(e);process.exitCode=1;});
