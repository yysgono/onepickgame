// Public home owns paged requests. A game route needs one complete game, not the catalogue.
export function worldcupRouteData(pathname = '') {
  const parts = pathname.split('/').filter(Boolean);
  if (/^[a-z]{2}$/.test(parts[0] || '')) parts.shift();
  const [page, id] = parts;
  if (['select-round','match','result','stats','edit-worldcup'].includes(page) && id) return { kind: 'one', id };
  if (['manage','my-worldcups','recent-worldcups','manage-worldcups','manage-worldcup','admin-dashboard','backup'].includes(page)) return { kind: 'all' };
  if (page === 'tier-list' && id === 'create') return { kind: 'all' };
  return { kind: 'none' };
}


