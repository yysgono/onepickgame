// Only one bounded in-memory snapshot; never touches login storage or stores image bytes.
let previous = [];
export function rememberCandidates(rows) {
  if (!rows.length) return;
  const snapshot = rows.slice(0,200).map(({id,name,image,enabled}) => ({id,name,image,enabled}));
  previous = JSON.stringify(snapshot).length <= 50000 ? snapshot : snapshot.map(row=>({...row,image:''}));
}
export function previousCandidates() { return previous.map(row=>({...row})); }
