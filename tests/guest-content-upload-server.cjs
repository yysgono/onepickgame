const assert=require('node:assert/strict'),crypto=require('node:crypto'),express=require('express'),register=require('../guest-content-upload-routes.cjs');
const jpeg=Buffer.alloc(160,0);jpeg[0]=255;jpeg[1]=216;jpeg[2]=255;jpeg[3]=192;jpeg.writeUInt16BE(17,4);jpeg[6]=8;jpeg.writeUInt16BE(100,7);jpeg.writeUInt16BE(100,9);jpeg[158]=255;jpeg[159]=217;
assert(register.validJpeg(jpeg));assert(!register.validJpeg(Buffer.from('<svg>bad</svg>')));const huge=Buffer.from(jpeg);huge.writeUInt16BE(9000,9);assert(!register.validJpeg(huge));
let job,uploads=0,removes=0;
const client={
 rpc:async(name,args)=>{
  assert.equal(name,'guest_content_upload_job');
  if(args.p_action==='stale')return {data:[]};
  if(args.p_action==='begin'){job={...args,id:args.p_id,files:args.p_files};return {data:{id:job.id}};}
  if(args.p_id!==job.id||args.p_secret_hash!==job.p_secret_hash||args.p_ip_hash!==job.p_ip_hash)return {error:Error('GUEST_UPLOAD_DENIED')};
  if(args.p_action==='get')return {data:job};
  return {data:{ok:true}};
 },
 storage:{from:bucket=>{
  assert.equal(bucket,'guest-content-images');
  return {
   upload:async(path,buffer,options)=>{uploads++;assert(path.startsWith(job.id+'/'));assert.deepEqual(buffer,jpeg);assert.equal(options.contentType,'image/jpeg');assert.equal(options.upsert,false);return {};},
   remove:async()=>{removes++;return {};},
   getPublicUrl:path=>({data:{publicUrl:'https://example.supabase.co/storage/v1/object/public/guest-content-images/'+path}})
  };
 }}
};
const app=express();app.use(express.json({limit:'1450kb'}));register(app,client,'https://www.onepickgame.com',{secret:'server-only-test-secret',cronSecret:'cron-test'});const server=app.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port;const post=(body,origin)=>fetch(base+'/api/guest-content-upload',{method:'POST',headers:{'content-type':'application/json',...(origin?{origin}: {})},body:JSON.stringify(body)});
 try{
  assert.equal((await post({action:'begin',kind:'nine',files:[]},'https://evil.example')).status,403);
  const response=await post({action:'begin',kind:'nine',files:[{bytes:jpeg.length,sha256:crypto.createHash('sha256').update(jpeg).digest('hex')}]});assert.equal(response.status,200);const token=await response.json();assert.match(token.token,/^[a-f0-9]{64}$/);assert(!JSON.stringify(job).includes('127.0.0.1'));
  assert.equal((await post({...token,action:'upload',index:0,base64:jpeg.toString('base64')})).status,200);assert.equal(uploads,1);
  assert.equal((await post({...token,token:'0'.repeat(64),action:'upload',index:0,base64:jpeg.toString('base64')})).status,400);
  assert.equal((await post({...token,action:'upload',index:1,base64:jpeg.toString('base64')})).status,400);
  assert.equal((await post({...token,action:'upload',index:0,base64:Buffer.alloc(160).toString('base64')})).status,400);assert.equal(uploads,1);
  assert.equal((await post({...token,action:'complete'})).status,200);assert.equal((await post({...token,action:'cancel'})).status,200);
  assert.equal((await fetch(base+'/api/guest-content-cleanup')).status,401);assert.equal((await fetch(base+'/api/guest-content-cleanup',{headers:{authorization:'Bearer cron-test'}})).status,200);assert.equal(removes,0);
  console.log('PASS: actual upload HTTP route origin/token/hash/JPEG/size/index checks, private IP hashing, immutable uploads, complete/cancel and protected cleanup.');
 }catch(error){console.error(error);process.exitCode=1;}finally{server.close();}
});
