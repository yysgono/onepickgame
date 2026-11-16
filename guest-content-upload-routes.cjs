const crypto=require('node:crypto'),net=require('node:net');
const BUCKET='guest-content-images',UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function validJpeg(buffer){
 if(buffer.length<100||buffer[0]!==255||buffer[1]!==216||buffer.at(-2)!==255||buffer.at(-1)!==217)return false;
 let at=2;
 while(at+4<buffer.length){
  if(buffer[at++]!==255)return false;let marker=buffer[at++];while(marker===255)marker=buffer[at++];
  if(marker===218)return false;
  const size=buffer.readUInt16BE(at);if(size<2||at+size>buffer.length)return false;
  if([192,193,194].includes(marker)){if(size<8)return false;const h=buffer.readUInt16BE(at+3),w=buffer.readUInt16BE(at+5);return w>0&&h>0&&w<=2048&&h<=2048;}
  at+=size;
 }
 return false;
}
module.exports=function register(app,admin,origin,options={}){
 const secret=options.secret||process.env.SUPABASE_SERVICE_ROLE_KEY,cronSecret=options.cronSecret||process.env.CRON_SECRET;
 async function rpc(args){const {data,error}=await admin.rpc('guest_content_upload_job',args);if(error)throw error;return data;}
 function ipHash(req){const raw=process.env.VERCEL?String(req.headers['x-forwarded-for']||'').split(',')[0].trim():req.socket.remoteAddress; if(!net.isIP(raw||''))throw Error('GUEST_UPLOAD_DENIED');return crypto.createHmac('sha256',secret).update(raw).digest('hex');}
 async function sweep(limit=1){const jobs=await rpc({p_action:'stale'}),start=Date.now();for(const id of (jobs||[]).slice(0,limit)){if(Date.now()-start>5000)break;const job=await rpc({p_action:'claim',p_id:id});if(!job?.files)continue;const {error}=await admin.storage.from(BUCKET).remove(job.files.map(file=>id+'/'+file.name));if(!error)await rpc({p_action:'removed',p_id:id});}}
 app.post('/api/guest-content-upload',async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(!admin||!secret)return res.status(503).json({error:'GUEST_UPLOAD_SETUP'});
  const requestOrigin=req.headers.origin;if(requestOrigin&&!([origin,new URL(origin).origin.replace('://www.','://')].includes(requestOrigin)))return res.status(403).json({error:'GUEST_UPLOAD_DENIED'});
  try{
   const body=req.body||{},ip=ipHash(req);
   if(body.action==='begin'){
    if(!['nine','tier'].includes(body.kind)||!Array.isArray(body.files)||body.files.length<1||body.files.length>(body.kind==='nine'?9:50))throw Error('GUEST_IMAGE_LIMIT');
    const files=body.files.map(file=>{if(!Number.isSafeInteger(file.bytes)||file.bytes<100||file.bytes>(body.kind==='nine'?524288:1048576)||!/^[a-f0-9]{64}$/.test(file.sha256||''))throw Error('GUEST_IMAGE_LIMIT');return {name:crypto.randomUUID()+'.jpg',bytes:file.bytes,sha256:file.sha256};});
    await sweep().catch(()=>{});const id=crypto.randomUUID(),token=crypto.randomBytes(32).toString('hex');
    await rpc({p_action:'begin',p_id:id,p_secret_hash:hash(token),p_ip_hash:ip,p_kind:body.kind,p_files:files});return res.json({id,token});
   }
   if(!UUID.test(body.id||'')||!/^[a-f0-9]{64}$/.test(body.token||'')||!['upload','complete','cancel'].includes(body.action))throw Error('GUEST_UPLOAD_DENIED');
   const args={p_id:body.id,p_secret_hash:hash(body.token),p_ip_hash:ip};
   if(body.action!=='upload'){await rpc({...args,p_action:body.action});return res.json({ok:true});}
   const job=await rpc({...args,p_action:'get'}),file=job.files?.[body.index];
   if(!Number.isInteger(body.index)||!file||typeof body.base64!=='string'||body.base64.length>1398104||!/^[A-Za-z0-9+/]+={0,2}$/.test(body.base64))throw Error('GUEST_IMAGE_INVALID');
   const bytes=Buffer.from(body.base64,'base64');if(bytes.length!==file.bytes||hash(bytes)!==file.sha256||!validJpeg(bytes))throw Error('GUEST_IMAGE_INVALID');
   const path=job.id+'/'+file.name,bucket=admin.storage.from(BUCKET),{error}=await bucket.upload(path,bytes,{contentType:'image/jpeg',upsert:false,cacheControl:'31536000'});
   if(error&&!['409','Duplicate'].includes(String(error.statusCode||error.error)))throw error;
   return res.json({url:bucket.getPublicUrl(path).data.publicUrl});
  }catch(error){const code=/GUEST_[A-Z_]+/.exec(error.message||'')?.[0]||'GUEST_UPLOAD_FAILED';return res.status(code==='GUEST_UPLOAD_RATE'?429:400).json({error:code});}
 });
 app.get('/api/guest-content-cleanup',async(req,res)=>{
  res.setHeader('Cache-Control','no-store');if(!admin||!secret||!cronSecret)return res.status(503).json({error:'GUEST_UPLOAD_SETUP'});
  if(req.headers.authorization!==`Bearer ${cronSecret}`)return res.status(401).end();try{await sweep(10);return res.json({ok:true});}catch{return res.status(503).json({error:'GUEST_UPLOAD_FAILED'});}
 });
};
module.exports.validJpeg=validJpeg;
