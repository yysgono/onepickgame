import { useCallback, useEffect, useRef, useState } from 'react';
import { getQuizPage } from '../utils/supabaseQuizApi';
import { createQuizListPager } from '../utils/quizListPager';

const EMPTY = [];
export default function useQuizPages({ enabled = true, search, category, sort, contentLanguage, ownerId }) {
  const queryKey = JSON.stringify({ search, category, sort, contentLanguage, ownerId });
  const [state, setState] = useState(null);
  const pagerRef = useRef(null);
  useEffect(() => {
    if (!enabled) return undefined;
    const filters = JSON.parse(queryKey);
    const pager = createQuizListPager({
      fetchPage: page => getQuizPage({ ...filters, ...page }),
      onChange: next => setState({ ...next, queryKey }),
    });
    const entry = { pager, queryKey };
    pagerRef.current = entry;
    pager.loadMore(10);
    return () => {
      pager.dispose();
      if (pagerRef.current === entry) pagerRef.current = null;
    };
  }, [enabled, queryKey]);
  const loadMore = useCallback(desired => {
    const entry = pagerRef.current;
    return enabled && entry?.queryKey === queryKey ? entry.pager.loadMore(desired) : Promise.resolve(false);
  }, [enabled, queryKey]);
  const loadAll = useCallback(() => {
    const entry = pagerRef.current;
    return enabled && entry?.queryKey === queryKey ? entry.pager.loadAll() : Promise.resolve(false);
  }, [enabled, queryKey]);
  const current = enabled && state?.queryKey === queryKey ? state : null;
  return {
    rows: current?.items || EMPTY,
    loading: enabled && (!current || current.loading),
    error: current?.error?.message || (current?.error ? String(current.error) : ''),
    hasMore: enabled && Boolean(current?.hasMore),
    loadMore,
    loadAll,
  };
}
