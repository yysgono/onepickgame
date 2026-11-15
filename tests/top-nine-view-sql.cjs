const fs=require('fs'),assert=require('node:assert/strict');
// Verification dependency is isolated from the application package/lockfile.
const {PGlite}=require(process.env.PGLITE_MODULE||'../../sql-verification/node_modules/@electric-sql/pglite');
(async()=>{
 const db=new PGlite();await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;CREATE TABLE public.top_nine_public_boards(id uuid PRIMARY KEY,view_count bigint DEFAULT 0,created_at timestamptz DEFAULT now());ALTER TABLE public.top_nine_public_boards ENABLE ROW LEVEL SECURITY;`);
 const migration=fs.readFileSync('supabase/20261115_top_nine_view_tracking.sql','utf8');await db.exec(migration);
 const id='a1111111-1111-4111-8111-111111111111',id2='b2222222-2222-4222-8222-222222222222',visitor='c3333333-3333-4333-8333-333333333333';
 await db.query('INSERT INTO public.top_nine_public_boards(id,view_count) VALUES($1,10),($2,NULL)',[id,id2]);
 await db.exec('SET ROLE anon');assert.equal((await db.query('SELECT public.record_top_nine_view_v2($1,$2) AS counted',[id,visitor])).rows[0].counted,true);
 assert.equal((await db.query('SELECT public.record_top_nine_view_v2($1,$2) AS counted',[id,visitor])).rows[0].counted,false);
 assert.equal((await db.query('SELECT public.record_top_nine_view_v2($1,$2) AS counted',[id2,visitor])).rows[0].counted,true);
 assert.equal((await db.query('SELECT public.record_top_nine_view_v2($1,$2) AS counted',[visitor,visitor])).rows[0].counted,false);
 await assert.rejects(db.query('SELECT * FROM public.top_nine_view_sessions_v2'),/permission denied/);await assert.rejects(db.query('UPDATE public.top_nine_public_boards SET view_count=999'),/permission denied/);await db.exec('RESET ROLE');
 assert.equal(Number((await db.query('SELECT view_count FROM public.top_nine_public_boards WHERE id=$1',[id])).rows[0].view_count),11);assert.equal(Number((await db.query('SELECT view_count FROM public.top_nine_public_boards WHERE id=$1',[id2])).rows[0].view_count),1);
 await db.exec(migration);assert.equal(Number((await db.query('SELECT view_count FROM public.top_nine_public_boards WHERE id=$1',[id])).rows[0].view_count),11);
 await Promise.all(Array.from({length:10},(_,i)=>db.query('SELECT public.record_top_nine_view_v2($1,$2)',[id,`d4444444-4444-4444-8444-${String(i).padStart(12,'0')}`])));
 assert.equal(Number((await db.query('SELECT view_count FROM public.top_nine_public_boards WHERE id=$1',[id])).rows[0].view_count),21);
 await db.query('DELETE FROM public.top_nine_public_boards WHERE id=$1',[id]);assert.equal((await db.query('SELECT * FROM public.top_nine_view_sessions_v2 WHERE board_id=$1',[id])).rows.length,0);
 await db.close();console.log('PASS: PostgreSQL migration, anonymous RPC permissions, per-session dedup, preserved counters, NULL counters, nonexistent boards, repeat migration and deletion cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1});
