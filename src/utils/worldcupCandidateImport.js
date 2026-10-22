// Reuse public media URLs. Never upload or copy image binaries during import.
function parseRows(value) {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return []; } }
  return Array.isArray(value) ? value : [];
}
export function importableCandidates(value) {
  return parseRows(value).filter(row => row && typeof row === 'object').map((row,index) => ({
    sourceIndex:index,
    name:String(row.name || row.title || '').trim(),
    image:String(row.image || row.url || row.videoUrl || row.video_url || '').trim(),
  })).filter(row=>row.name && /^(https?:\/\/|\/(?!\/))/.test(row.image));
}
const key = row => JSON.stringify([String(row.name || '').trim(),String(row.image || '').trim()]);
export function mergeImportedCandidates(existing, selected, makeId, max = 3000) {
  // Remove only unused starter slots, never partially edited/uploaded rows.
  const rows=existing.filter(row=>String(row.name || '').trim() || String(row.image || '').trim() || row.file);
  const seen=new Set(rows.filter(row=>!row.file).map(key));
  let added=0,duplicates=0,overflow=0;
  for (const source of selected) {
    const name=String(source.name || '').trim(),image=String(source.image || '').trim();
    if (!name || !/^(https?:\/\/|\/(?!\/))/.test(image)) continue;
    const signature=key({name,image});
    if (seen.has(signature)) { duplicates++;continue; }
    if (rows.length>=max) { overflow++;continue; }
    rows.push({id:makeId(),name,image,file:null});seen.add(signature);added++;
  }
  return {rows:rows.length?rows:existing,added,duplicates,overflow};
}
