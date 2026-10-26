import {subscribeContentChanges} from "../utils/contentTrashApi";
import { useCallback, useEffect, useRef, useState } from 'react';
import { createWorldcupHomePager, HOME_ROW_KEYS } from '../utils/worldcupHomePager';
import { fetchWorldcupHomeRows } from '../utils/worldcupHomeApi';

const PAGE_SIZE = 12;
const EMPTY_ITEMS = [];
export default function useWorldcupCategoryPages({ categoryKey, search = '', sort = 'popular' }) {
  const key = HOME_ROW_KEYS.includes(categoryKey) && categoryKey !== 'featured' ? categoryKey : '';
  const queryKey = JSON.stringify([key, search.trim(), sort]);
  const [state, setState] = useState(null);
  const [revision, setRevision] = useState(0);
  const pagerRef = useRef(null);
  useEffect(()=>subscribeContentChanges("worldcup",()=>setRevision(v=>v+1)),[]);

  useEffect(() => {
    if (!key) return undefined;
    const [, querySearch, querySort] = JSON.parse(queryKey);
    const pager = createWorldcupHomePager({
      fetchRows: fetchWorldcupHomeRows, search: querySearch, sorts: { [key]: querySort === 'latest' ? 'recent' : 'popular' },
      onChange: next => setState({ ...next, queryKey, revision }),
    });
    const entry = { pager, queryKey };
    pagerRef.current = entry;
    const timer = setTimeout(() => pager.loadMore(key, PAGE_SIZE), querySearch ? 250 : 0);
    return () => {
      clearTimeout(timer);
      pager.dispose();
      if (pagerRef.current === entry) pagerRef.current = null;
    };
  }, [key, queryKey, revision]);

  const current = state?.queryKey === queryKey && state.revision === revision ? state : null;
  const row = current?.rows?.[key];
  const loadMore = useCallback(() => {
    const entry = pagerRef.current;
    if (!entry || entry.queryKey !== queryKey) return Promise.resolve(false);
    const loaded = entry.pager.snapshot().rows[key]?.items.length || 0;
    return entry.pager.loadMore(key, loaded + PAGE_SIZE);
  }, [key, queryKey]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return {
    cups: row?.items || EMPTY_ITEMS,
    total: row?.total || 0,
    loading: Boolean(key) && (!current || current.loading),
    error: current?.error || null,
    loadMore,
    retry: loadMore,
    reload,
  };
}
