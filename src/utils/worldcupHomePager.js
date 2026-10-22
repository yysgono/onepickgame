export const HOME_ROW_KEYS = ['featured','korea','anime_manga','person','game','sports','music','movie_drama','food','travel','brands','etc'];
export const PRIMARY_HOME_ROWS = ['featured','korea','anime_manga','person'];

// Per-mounted-home state only: no localStorage, global private-data cache, or eager next-page fetch.
export function createWorldcupHomePager({ fetchRows, search = '', creator = '', sorts = {}, pageSize = 1, onChange = () => {} }) {
  let active = true;
  let state = { rows: {}, totals: {}, activity: { created: [], played: [] }, loading: false, error: null };
  const pending = new Map();
  const controllers = new Set();
  const emit = () => { if (active) onChange({ ...state, loading: pending.size > 0 }); };
  const defaultLimit = key => key === 'etc' ? 8 : Math.max(1, Math.min(40, pageSize));
  const request = (requests, includeActivity = false) => {
    if (!active || !requests.length) return Promise.resolve(false);
    const waiting = requests.filter(r => pending.has(r.key)).map(r => pending.get(r.key));
    const fresh = requests.filter(r => !pending.has(r.key));
    if (!fresh.length) return Promise.all(waiting).then(values => values.every(Boolean));
    const controller = new AbortController();
    controllers.add(controller);
    const operation = Promise.resolve().then(() => fetchRows({ requests: fresh, search, creator, includeActivity, signal: controller.signal }))
      .then(result => {
        if (!active) return false;
        const rows = { ...state.rows };
        for (const r of fresh) {
          const response = result?.rows?.[r.key];
          if (!response || !Array.isArray(response.items) || Number(response.offset) !== r.offset) throw new Error('Invalid home page response');
          const before = r.offset ? (rows[r.key]?.items || []) : [];
          const items = [...new Map([...before, ...response.items].map(cup => [String(cup.id), cup])).values()];
          if (r.offset > 0 && response.items.length === 0 && r.offset < Number(response.total)) throw new Error('Home page did not advance');
          rows[r.key] = { items, total: Number(response.total) || 0, nextOffset: r.offset + response.items.length };
        }
        state = { ...state, rows, totals: { ...state.totals, ...result.totals }, activity: result.activity || state.activity, error: null };
        return true;
      })
      .catch(error => {
        if (active && error?.name !== 'AbortError') state = { ...state, error };
        return false;
      })
      .finally(() => {
        controllers.delete(controller);
        fresh.forEach(r => { if (pending.get(r.key) === operation) pending.delete(r.key); });
        emit();
      });
    fresh.forEach(r => pending.set(r.key, operation));
    emit();
    return Promise.all([operation, ...waiting]).then(values => values.every(Boolean));
  };
  return {
    setPageSize(value) { pageSize = Math.max(1, Math.min(40, Number(value) || 1)); },
    snapshot: () => ({ ...state, loading: pending.size > 0 }),
    ensureRows(keys, includeActivity = false) {
      const requests = keys.filter(key => HOME_ROW_KEYS.includes(key) && !state.rows[key]).map(key => ({ key, offset: 0, limit: defaultLimit(key), sort: sorts[key] || 'popular' }));
      return request(requests, includeActivity);
    },
    async loadMore(key, desired) {
      if (!HOME_ROW_KEYS.includes(key)) return false;
      while (active) {
        if (pending.has(key) && !await pending.get(key)) return false;
        const row = state.rows[key];
        const count = row?.items.length || 0;
        if (row && (count >= desired || row.nextOffset >= row.total)) return true;
        if (!await request([{ key, offset: row?.nextOffset || 0, limit: Math.max(1, Math.min(40, desired - count)), sort: sorts[key] || 'popular' }])) return false;
      }
      return false;
    },
    dispose() { active = false; controllers.forEach(controller => controller.abort()); pending.clear(); }
  };
}
