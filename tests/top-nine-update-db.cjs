const fs=require('fs'),assert=require('assert/strict'),{PGlite}=require('@electric-sql/pglite');
(async()=>{
const db=new PGlite(),owner='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',source='00000000-0000-4000-8000-000000000003';
await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
CREATE TABLE worldcups(id uuid PRIMARY KEY,deleted_at timestamptz);INSERT INTO worldcups VALUES('${source}',null);
CREATE TABLE profiles(id uuid PRIMARY KEY,nickname text);INSERT INTO profiles VALUES('${owner}','Owner');
CREATE TABLE top_nine_public_boards(id uuid PRIMARY KEY,title text UNIQUE,slots jsonb,show_names boolean,author_id uuid,guest_nickname text,created_at timestamptz DEFAULT now());
CREATE FUNCTION publish_top_nine_board_v2(p_title text,p_slots jsonb,p_names boolean,p_nickname text,p_salt text,p_proof text) RETURNS uuid LANGUAGE plpgsql AS $$DECLARE next_id uuid:=gen_random_uuid();BEGIN
IF jsonb_array_length(p_slots)<>9 THEN RAISE EXCEPTION 'BOARD_INVALID';END IF;
INSERT INTO top_nine_public_boards(id,title,slots,show_names,author_id,guest_nickname) VALUES(next_id,p_title,p_slots,p_names,auth.uid(),CASE WHEN auth.uid() IS NULL THEN p_nickname END);
RETURN next_id;END $$;
CREATE FUNCTION delete_top_nine_guest_board(p_id uuid,p_proof text) RETURNS boolean LANGUAGE plpgsql AS $$BEGIN IF p_proof<>'legacy-proof' THEN RETURN false; END IF; DELETE FROM top_nine_public_boards WHERE id=p_id AND author_id IS NULL;RETURN FOUND;END $$;`);
const sql=fs.readFileSync('supabase/20261105_top_nine_edit_sources.sql','utf8');await db.exec(sql);await db.exec(sql);
const slots=JSON.stringify(Array(9).fill({src:'https://example.com/a.jpg'}));
async function publish(title){return (await db.query('select publish_top_nine_board_v3($1,$2,true,$3,$4,$5,$6) id',[title,slots,'Guest','salt','proof',[source]])).rows[0].id;}
async function update(id,title,proof='proof',images=slots){return (await db.query('select update_top_nine_board_v1($1,$2,$3,true,$4,$5,$6,$7) id',[id,title,images,'Guest','salt',proof,[source]])).rows[0].id;}
const guest=await publish('Guest board');assert.equal(await update(guest,'Guest edited'),guest);
assert.equal((await db.query('select count(*) n from top_nine_public_boards')).rows[0].n,1);
assert.equal(await update(guest,'Denied','wrong'),null);
await db.query('DELETE FROM top_nine_edit_credentials WHERE board_id=$1',[guest]);assert.equal(await update(guest,'Legacy guest edited','legacy-proof'),guest);assert.equal((await db.query('SELECT count(*) n FROM top_nine_public_boards')).rows[0].n,1);
await db.exec(`SET test.uid='${owner}'`);const member=await publish('Member board');assert.equal(await update(member,'Member edited'),member);assert.equal(await update(member,'Member edited'),member);
assert.equal((await db.query('select count(*) n from top_nine_public_boards')).rows[0].n,2);
await assert.rejects(()=>update(member,'Broken','proof','[]'),/BOARD_INVALID/);assert.equal((await db.query('select title from top_nine_public_boards where id=$1',[member])).rows[0].title,'Member edited');
await db.exec(`SET test.uid='${other}'`);await assert.rejects(()=>update(member,'Stolen'),/EDIT_PERMISSION/);
await db.exec('SET ROLE anon');await assert.rejects(()=>db.query('select * from top_nine_edit_credentials'),/permission denied/);await db.exec('RESET ROLE');
await db.exec(fs.readFileSync('supabase/20261105_top_nine_title_format.sql','utf8'));
console.log('DB: member/guest edits keep the same ID and row count, repeated saves, unauthorized rejection, private edit proofs, validation rollback and title migration passed.');
await db.close();
})().catch(error=>{console.error(error);process.exitCode=1});
