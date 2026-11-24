import { useCallback, useEffect, useRef, useState } from 'react';
import paging from '../utils/commentWindow';
const { PAGE_SIZE, readCommentWindow } = paging;
const empty = scope => ({ scope, rows: [], count: 0, hasMore: false, limit: PAGE_SIZE, loading: true, loadingMore: false });
export default function useCommentWindow({ scope, enabled, query, withCount = false, onError }) {
  const [state, setState] = useState(() => empty(scope));
  const snapshot = useRef(state), revision = useRef(0), active = useRef(false);
  const latest = useRef(null);
  latest.current = { scope, enabled, query, onError };
  const load = useCallback(async (more = false) => {
    if (!active.current || latest.current.scope !== scope || !latest.current.enabled) return;
    const prior = snapshot.current.scope === scope ? snapshot.current : empty(scope);
    if (more && (!prior.hasMore || prior.loading || prior.loadingMore)) return;
    const request = ++revision.current;
    const limit = more ? prior.limit + PAGE_SIZE : prior.limit;
    const update = next => { snapshot.current = next; setState(next); };
    update({ ...prior, loading: !more, loadingMore: more });
    try {
      const result = await readCommentWindow(latest.current.query, limit, withCount);
      if (revision.current !== request || latest.current.scope !== scope) return;
      update({ ...result, scope, limit, loading: false, loadingMore: false });
    } catch (error) {
      if (revision.current !== request || latest.current.scope !== scope) return;
      update({ ...prior, loading: false, loadingMore: false });
      latest.current.onError?.(error);
    }
  }, [scope, withCount]);
  useEffect(() => {
    active.current = true;
    if (enabled) load();
    return () => { active.current = false; revision.current++; };
  }, [enabled, load]);
  const visible = state.scope === scope ? state : empty(scope);
  return { ...visible, loading: enabled && visible.loading, load, more: () => load(true) };
}
