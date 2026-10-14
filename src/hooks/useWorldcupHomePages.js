import { useCallback, useEffect, useRef, useState } from 'react';
import { createWorldcupHomePager, HOME_ROW_KEYS, PRIMARY_HOME_ROWS } from '../utils/worldcupHomePager';
import { fetchWorldcupHomeRows } from '../utils/worldcupHomeApi';

const EMPTY = { rows: {}, totals: {}, activity: { created: [], played: [] }, loading: false, error: null };
export default function useWorldcupHomePages({ enabled, search, creator, sorts, pageSize, includeDeferred, includeActivity }) {
  const [state, setState] = useState(EMPTY);
  const [retryTick, setRetryTick] = useState(0);
  const pagerRef = useRef(null);
  const latest = useRef(null);
  latest.current = { includeDeferred, includeActivity };
  const queryKey = JSON.stringify([search, creator, sorts, pageSize]);
  useEffect(() => {
    if (!enabled) { setState(EMPTY); return undefined; }
    setState({ ...EMPTY, loading: true });
    const [querySearch, queryCreator, querySorts, querySize] = JSON.parse(queryKey);
    const pager = createWorldcupHomePager({ fetchRows: fetchWorldcupHomeRows, search: querySearch, creator: queryCreator, sorts: querySorts, pageSize: querySize, onChange: setState });
    pagerRef.current = pager;
    const timer = setTimeout(() => {
      const config = latest.current;
      pager.ensureRows(config.includeDeferred ? HOME_ROW_KEYS : PRIMARY_HOME_ROWS, config.includeActivity);
    }, querySearch ? 250 : 0);
    return () => { clearTimeout(timer); pager.dispose(); if (pagerRef.current === pager) pagerRef.current = null; };
  }, [enabled, queryKey, retryTick]);
  useEffect(() => {
    if (enabled && includeDeferred) pagerRef.current?.ensureRows(HOME_ROW_KEYS, includeActivity);
  }, [enabled, includeDeferred, includeActivity]);
  const loadMore = useCallback((key, desired) => pagerRef.current?.loadMore(key, desired) || Promise.resolve(false), []);
  const retry = useCallback(() => setRetryTick(value => value + 1), []);
  const cups = [...new Map(Object.values(state.rows).flatMap(row => row.items).map(cup => [String(cup.id), cup])).values()];
  return { ...state, cups, loadMore, retry };
}
