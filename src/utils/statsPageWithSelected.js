// Preserve the existing sorted/filtered ranks and pagination totals.
// The selected row is an extra context row, never another page item.
export function statsPageWithSelected(rows, currentPage, itemsPerPage, selectedId) {
  const page = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  if (selectedId == null) return page;
  const sameCandidate = row => String(row.candidate_id) === String(selectedId);
  if (page.some(sameCandidate)) return page;
  const selected = rows.find(sameCandidate);
  return selected ? [...page, selected] : page;
}
