// Run only on entering edit mode. Public results retain their saved snapshot.
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
function reconcileSourceCandidates(slots,pool,sourceIds,results,normalizeMedia=value=>value){
 const sources=new Map(sourceIds.map((id,index)=>{
  const result=results[index];
  if(result?.status!=='fulfilled')return [String(id),null];
  const data=Array.isArray(result.value?.data)?result.value.data:[];
  return [String(id),{ids:new Set(data.filter(c=>c?.id!=null).map(c=>String(c.id))),images:new Set(data.map(c=>normalizeMedia(c?.image||c?.image_url||c?.url)).filter(Boolean))}];
 }));
 const keep=candidate=>{
  if(!candidate||String(candidate.id).startsWith('upload-'))return true;
  const id=String(candidate.id||''),match=id.match(/^site:([a-f0-9-]{36}):(.*)$/i);
  const normalizedId=match?match[2]:id;
  const legacy=normalizedId.match(/^(.*)-\d+$/);
  if(!match&&!legacy)return true; // No reliable site provenance: preserve personal photos.
  const stableId=legacy?legacy[1]:normalizedId;
  const belongs=match&&UUID.test(match[1])?[sources.get(match[1])]:[...sources.values()];
  if(!belongs.length||belongs.some(source=>!source))return true; // A network failure is not a deletion.
  return belongs.some(source=>source.ids.has(stableId)||source.images.has(candidate.src));
 };
 return {slots:slots.map(c=>c&&keep(c)?c:null),pool:pool.filter(keep)};
}
module.exports={reconcileSourceCandidates};
