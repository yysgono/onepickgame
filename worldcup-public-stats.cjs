// Server-only presentation of the same aggregate fields/default ordering as StatsPage.
const COPY=require('./src/seo/worldcupPublicStatsCopy.json');
const LABELS=require('./src/locales/statsTableLabels.json');
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const percent=(n,d,digits=0)=>d?((n/d)*100).toFixed(digits)+'%':'-';
function parseTranslations(value){
 if(typeof value==='string'){try{value=JSON.parse(value);}catch{return {};}}
 return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
}
function rankPublicStats(cup,rows,lang){
 if(!Array.isArray(rows))throw Error('INVALID_PUBLIC_STATS');
 const candidates=new Map((Array.isArray(cup.data)?cup.data:[]).filter(c=>c?.id!=null).map(c=>[String(c.id),c]));
 const seen=new Set();
 return rows.filter(row=>row&&candidates.has(String(row.candidate_id))).map((row,index)=>{
  const id=String(row.candidate_id),candidate=candidates.get(id),translations=parseTranslations(candidate.name_translations);
  if(seen.has(id))throw Error('DUPLICATE_PUBLIC_STATS');seen.add(id);
  const result={id,index,name:translations[lang]||translations.en||candidate.name||row.name||''};
  for(const field of ['win_count','total_games','match_wins','match_count']){
   const value=Number(row[field]??0);
   if(!Number.isSafeInteger(value)||value<0)throw Error('INVALID_PUBLIC_STATS');
   result[field]=value;
  }
  result.winRate=result.total_games?result.win_count/result.total_games:0;
  result.matchRate=result.match_count?result.match_wins/result.match_count:0;
  return result;
 }).sort((a,b)=>b.win_count-a.win_count||b.winRate-a.winRate||b.match_wins-a.match_wins||b.matchRate-a.matchRate||a.index-b.index);
}
async function loadPublicStats(client,cup,{timeoutMs=3500,now=()=>new Date()}={}){
 try{
  const {data,error}=await client.rpc('get_winner_stats',{p_cup_id:cup.id,p_from:null,p_to:null}).abortSignal(AbortSignal.timeout(timeoutMs));
  if(error)throw error;
  // Validate the response before returning it as a successful snapshot.
  rankPublicStats(cup,data,'en');
  return {status:'ready',rows:data,checkedAt:now().toISOString()};
 }catch{return {status:'unavailable'};}
}
function renderPublicStats(cup,lang,snapshot){
 if(!snapshot)return '';
 const t=COPY[lang]||COPY.en,labels=LABELS[lang]||LABELS.en;
 let rows;
 try{rows=snapshot.status==='ready'?rankPublicStats(cup,snapshot.rows,lang):null;}catch{rows=null;}
 const heading='<h2 id="worldcup-public-ranking-title">'+escape(t.heading)+'</h2>';
 if(!rows)return '<section aria-labelledby="worldcup-public-ranking-title">'+heading+'<p>'+escape(t.unavailable)+'</p></section>';
 const checked=new Date(snapshot.checkedAt),stamp=Number.isFinite(checked.getTime())?'<p>'+escape(t.checked)+' <time datetime="'+escape(checked.toISOString())+'">'+escape(new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(checked))+' UTC</time></p>':'';
 if(!rows.length)return '<section aria-labelledby="worldcup-public-ranking-title">'+heading+'<p>'+escape(t.empty)+'</p>'+stamp+'</section>';
 const headers=[t.rank,t.name,labels.win_count,labels.win_rate,labels.match_wins,labels.match_count,labels.match_win_rate];
 const table='<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;text-align:start"><caption style="text-align:start;padding:8px 0">'+escape(t.basis)+'</caption><thead><tr>'+headers.map(label=>'<th scope="col" style="border-bottom:1px solid #ccc;padding:8px">'+escape(label)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(0,10).map((row,index)=>'<tr><td style="padding:8px">'+(index+1)+'</td><th scope="row" style="padding:8px">'+escape(row.name)+'</th>'+[row.win_count,percent(row.win_count,row.total_games,1),row.match_wins,row.match_count,percent(row.match_wins,row.match_count)].map(value=>'<td style="padding:8px">'+escape(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 return '<section aria-labelledby="worldcup-public-ranking-title">'+heading+table+stamp+'</section>';
}
module.exports={rankPublicStats,loadPublicStats,renderPublicStats};
