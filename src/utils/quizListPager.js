export function createQuizListPager({ fetchPage, onChange = () => {}, pageSize = 10 }) {
  let active = true;
  let pending = null;
  let allPending = null;
  let state = { items: [], nextOffset: 0, initialized: false, hasMore: true, error: null };
  const snapshot = () => ({ ...state, loading: Boolean(pending || allPending) });
  const emit = () => { if (active) onChange(snapshot()); };
  const request = () => {
    if (!active) return Promise.resolve(false);
    if (pending) return pending;
    const offset = state.nextOffset;
    pending = Promise.resolve().then(() => fetchPage({ offset, pageSize }))
      .then(page => {
        if (!active) return false;
        if (!Array.isArray(page?.items) || page.items.length > pageSize ||
            page.nextOffset !== offset + page.items.length || (page.hasMore && !page.items.length)) {
          throw new Error('Invalid quiz page response');
        }
        const items = [...new Map([...state.items, ...page.items].map(item => [String(item.id), item])).values()];
        state = { items, nextOffset: page.nextOffset, initialized: true, hasMore: Boolean(page.hasMore), error: null };
        return true;
      })
      .catch(error => { if (active) state = { ...state, error }; return false; })
      .finally(() => { pending = null; emit(); });
    emit();
    return pending;
  };
  const ensure = async desired => {
    while (active) {
      if (pending && !await pending) return false;
      if (state.initialized && (state.items.length >= desired || !state.hasMore)) return state.items.length;
      if (!await request()) return false;
    }
    return false;
  };
  return {
    snapshot,
    loadMore(desired = state.items.length + pageSize) {
      return allPending || ensure(desired);
    },
    loadAll() {
      if (!active) return Promise.resolve(false);
      if (allPending) return allPending;
      allPending = Promise.resolve().then(async () => {
        while (active && (!state.initialized || state.hasMore)) {
          if (await ensure(state.items.length + pageSize) === false) return active ? state.items.length : false;
        }
        return active ? state.items.length : false;
      }).finally(() => { allPending = null; emit(); });
      emit();
      return allPending;
    },
    dispose() { active = false; },
  };
}
