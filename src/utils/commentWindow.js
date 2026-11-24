// Read only the visible comment window plus one lookahead row. Re-reading the
// window on expansion avoids offset drift between clicks after insert/delete.
const PAGE_SIZE = 50;
const CHUNK_SIZE = 200;
async function readCommentWindow(query, limit, withCount = false) {
  const rows = [];
  let count = null;
  while (rows.length < limit + 1) {
    const start = rows.length;
    const size = Math.min(CHUNK_SIZE, limit + 1 - start);
    const result = await query(withCount && start === 0).range(start, start + size - 1);
    if (result.error) throw result.error;
    if (start === 0 && Number.isSafeInteger(result.count)) count = result.count;
    const batch = Array.isArray(result.data) ? result.data : [];
    if (!batch.length) break;
    rows.push(...batch);
    if (batch.length < size && (count === null || rows.length >= count)) break;
  }
  const visible = rows.slice(0, limit);
  return { rows: [...new Map(visible.map(row => [row.id, row])).values()], hasMore: rows.length > limit, count: count ?? visible.length };
}
module.exports = { PAGE_SIZE, readCommentWindow };
