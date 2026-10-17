export function removedWorldcupCandidateIds(previous, next) {
  const remaining = new Set((Array.isArray(next) ? next : []).map(c => c?.id == null ? '' : String(c.id)));
  return [...new Set((Array.isArray(previous) ? previous : [])
    .map(c => c?.id == null ? '' : String(c.id)).filter(id => id && !remaining.has(id)))];
}
// A cache written before an edit must not bring removed candidates back into the table.
export function filterCurrentCandidateStats(rows, candidates) {
  if (!Array.isArray(candidates)) return rows || [];
  const ids = new Set(candidates.filter(c => c?.id != null).map(c => String(c.id)));
  return (rows || []).filter(row => ids.has(String(row?.candidate_id)));
}
