// The homepage and linked source card use the same all-time ranking rules.
function getTop2Winners(winStats,cupData){
 const candidates=Array.isArray(cupData)?cupData:[];
 if(!winStats?.length)return [candidates[0]||null,candidates[1]||null];
 const sorted=winStats.map((row,index)=>({row,index})).sort((a,b)=>(b.row.win_count||0)-(a.row.win_count||0)||(b.row.match_wins||0)-(a.row.match_wins||0)||a.index-b.index);
 return [candidates.find(c=>String(c.id)===String(sorted[0]?.row.candidate_id))||candidates[0]||null,candidates.find(c=>String(c.id)===String(sorted[1]?.row.candidate_id))||candidates[1]||null];
}
function aggregatePreviewStats(rows){
 const totals=Object.create(null);
 for(const row of rows||[]){const key=row.candidate_id;if(!totals[key])totals[key]={candidate_id:key,win_count:0,match_wins:0};totals[key].win_count+=Number(row.win_count)||0;totals[key].match_wins+=Number(row.match_wins)||0;}
 return Object.values(totals);
}
module.exports={getTop2Winners,aggregatePreviewStats};

// Coalesce simultaneous metadata/card requests without keeping a stale ranking cache.
const previewRequests=new WeakMap();
function loadSourcePreview(client,cup){
 const data=cup?.data;
 if(!cup?.id||cup._homeCardOnly||!Array.isArray(data)||!data.length)return Promise.resolve({status:'incomplete',images:[]});
 let requests=previewRequests.get(client);if(!requests){requests=new Map();previewRequests.set(client,requests);}
 const current=requests.get(String(cup.id));if(current?.data===data)return current.promise;
 const entry={data};
 entry.promise=Promise.resolve().then(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3000);
  try{
   let query=client.from('winner_stats').select('candidate_id,win_count,match_wins').eq('cup_id',cup.id);
   if(query.abortSignal)query=query.abortSignal(controller.signal);
   const {data:rows,error}=await query;if(error||!Array.isArray(rows))return {status:'unavailable',images:[]};
   const selected=getTop2Winners(aggregatePreviewStats(rows),data);
   const images=selected.map(candidate=>candidate?.image||candidate?.image_url||candidate?.url||'').filter(url=>typeof url==='string'&&/^https?:\/\//i.test(url));
   return {status:rows.length?'ready':'empty',images};
  }catch{return {status:'unavailable',images:[]};}finally{clearTimeout(timer);}
 }).finally(()=>{if(requests.get(String(cup.id))===entry)requests.delete(String(cup.id));});
 requests.set(String(cup.id),entry);return entry.promise;
}
module.exports.loadSourcePreview=loadSourcePreview;
