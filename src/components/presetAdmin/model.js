export function titleOf(row) {
  const translations = row.title_translations || {};
  return translations.ko || (typeof row.title === 'string' ? row.title : row.title?.ko || row.title?.en) || translations.en || String(row.id);
}
export function enabledRows(rows) {
  return rows.filter(row => row.enabled).sort((a,b) => Number(a.sort_order ?? 100000)-Number(b.sort_order ?? 100000) || String(a.id).localeCompare(String(b.id)));
}
function applyOrder(rows, ordered) {
  const positions = new Map(ordered.map((row,index) => [String(row.id),index+1]));
  return rows.map(row => positions.has(String(row.id)) ? {...row,sort_order:positions.get(String(row.id))} : row);
}
export function reorderRows(rows, sourceId, targetId, after=false) {
  const list=enabledRows(rows),source=list.findIndex(row=>String(row.id)===String(sourceId));
  if(source<0||String(sourceId)===String(targetId)||!list.some(row=>String(row.id)===String(targetId)))return rows;
  const [moved]=list.splice(source,1),target=list.findIndex(row=>String(row.id)===String(targetId));
  list.splice(target+(after?1:0),0,moved);
  return applyOrder(rows,list);
}
export function moveRow(rows,id,delta) {
  const list=enabledRows(rows),index=list.findIndex(row=>String(row.id)===String(id)),target=index+delta;
  return index<0||target<0||target>=list.length?rows:reorderRows(rows,id,list[target].id,delta>0);
}
export function toggleRow(rows,id) {
  const last=enabledRows(rows).length;
  const next=rows.map(row=>String(row.id)===String(id)?{...row,enabled:!row.enabled,sort_order:row.enabled?row.sort_order:last+1}:row);
  return applyOrder(next,enabledRows(next));
}
export function payloadFor(row) {
  return {source_worldcup_id:row.id,enabled:Boolean(row.enabled),sort_order:Number(row.sort_order||0),topic:row.topic||'games',title_translations:{...(row.top_nine_title_translations||{})}};
}
export function snapshot(rows) {
  return new Map(rows.map(row=>[String(row.id),JSON.stringify(payloadFor(row))]));
}
export function changedPayloads(rows,baseline) {
  return rows.filter(row=>baseline.get(String(row.id))!==JSON.stringify(payloadFor(row))).map(payloadFor);
}
