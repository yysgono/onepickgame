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
