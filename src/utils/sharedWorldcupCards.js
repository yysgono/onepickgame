// One public stored snapshot, shared by the homepage and source cards.
const clients=new WeakMap(),TTL=60000,LIMIT=160;
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
function getStore(client){let store=clients.get(client);if(!store){store={rows:new Map(),pending:new Map()};clients.set(client,store);}return store;}
async function loadCards(client,values){
 const ids=Array.from(new Set((values||[]).map(String).filter(id=>uuid.test(id))));if(!ids.length)return [];
 const store=getStore(client),now=Date.now(),available=new Map(ids.map(id=>[id,store.rows.get(id)]).filter(([,value])=>value&&now-value.at<TTL).map(([id,value])=>[id,value.row])),missing=ids.filter(id=>!store.pending.has(id)&&!(store.rows.has(id)&&now-store.rows.get(id).at<TTL));
 const batches=[];for(let i=0;i<missing.length;i+=100)batches.push(missing.slice(i,i+100));
 batches.forEach(batch=>{
  const request=Promise.resolve().then(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3000);
   try{
    let q=client.from('worldcup_card_previews').select('cup_id,candidate_ids,image_urls,updated_at').in('cup_id',batch);if(q.abortSignal)q=q.abortSignal(controller.signal);
    const {data,error}=await q;if(error||!Array.isArray(data))return;
    const accepted=[];data.forEach(row=>{if(!batch.includes(String(row.cup_id))||!Array.isArray(row.image_urls))return;const images=row.image_urls.filter(url=>typeof url==='string'&&/^https?:\/\//i.test(url)).slice(0,2);store.rows.delete(String(row.cup_id));store.rows.set(String(row.cup_id),{at:Date.now(),row:{cup_id:String(row.cup_id),images,candidate_ids:row.candidate_ids||[],updated_at:row.updated_at}});accepted.push(store.rows.get(String(row.cup_id)).row);});
    while(store.rows.size>LIMIT)store.rows.delete(store.rows.keys().next().value);
    return accepted;
   }catch{}finally{clearTimeout(timer);batch.forEach(id=>{if(store.pending.get(id)===request)store.pending.delete(id);});}
  });batch.forEach(id=>store.pending.set(id,request));
 });
 const results=await Promise.all(Array.from(new Set(ids.map(id=>store.pending.get(id)).filter(Boolean))));
 results.forEach(rows=>(rows||[]).forEach(row=>available.set(row.cup_id,row)));
 return ids.map(id=>available.get(id)).filter(Boolean);
}
async function loadSourcePreview(client,cup){const rows=await loadCards(client,[cup?.id]);return rows.length?{status:'stored',images:rows[0].images}:{status:'unavailable',images:[]};}
module.exports={loadCards,loadSourcePreview};
