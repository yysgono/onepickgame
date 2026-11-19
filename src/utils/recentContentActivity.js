// Worldcup replays by the same known player keep only their latest entry.
export async function loadRecentContentActivity(client, kind, limit=4) {
 const quiz=kind==='quiz';
 const {data:logs,error}=await client.from(quiz?'quiz_attempts':'winner_logs').select(quiz?'quiz_id,created_at':'cup_id,created_at,user_id,guest_id').order('created_at',{ascending:false}).limit(60);
 if(error)throw error;
 const seen=new Set();
 const recent=quiz?(logs||[]):(logs||[]).filter(log=>{
  const actor=log.user_id?['user',String(log.user_id)]:log.guest_id?['guest',String(log.guest_id)]:null;
  // Do not merge unrelated historical events with no recorded player identity.
  if(!actor)return true;
  const key=JSON.stringify([String(log.cup_id),...actor]);
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
 const ids=[...new Set(recent.map(log=>log[quiz?'quiz_id':'cup_id']).filter(Boolean))];
 if(!ids.length)return [];
 let query=client.from(quiz?'quizzes':'worldcups').select('id,title,title_translations,created_at,category').is('deleted_at',null).in('id',ids);
 if(quiz)query=query.eq('is_published',true);
 const {data:rows,error:rowError}=await query;if(rowError)throw rowError;
 const byId=new Map((rows||[]).map(row=>[String(row.id),row]));
 return recent.map((log,index)=>({cup:byId.get(String(log[quiz?'quiz_id':'cup_id'])),time:log.created_at,eventKey:index})).filter(item=>item.cup).slice(0,limit);
}
export function formatRecentActivity(value,lang='en',now=Date.now()){
 const date=new Date(value),elapsed=now-date.getTime();if(!Number.isFinite(date.getTime()))return '';
 if(elapsed>=0&&elapsed<86400000){
  const minutes=Math.floor(elapsed/60000),unit=minutes<60?'minute':'hour',amount=unit==='minute'?minutes:Math.floor(minutes/60);
  try{return new Intl.RelativeTimeFormat(lang,{numeric:'auto'}).format(-amount,unit);}catch{return new Intl.RelativeTimeFormat('en',{numeric:'auto'}).format(-amount,unit);}
 }
 return `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
}
