import { supabase } from './supabaseClient';
import { contentRevision } from './contentTrashApi';
let cache = null;
let inflight = null;
export function loadTierSourceCatalogue() {
  const revision = contentRevision('worldcup');
  const key = `${revision}:${contentRevision('tier-list')}`;
  if (cache?.key === key && Date.now() - cache.at < 60000) return Promise.resolve(cache.rows);
  if (inflight?.key === key) return inflight.promise;
  const request = { key };
  request.promise = Promise.resolve().then(() => supabase.rpc('get_tier_source_catalogue')).then(({ data, error }) => {
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    if (inflight === request) cache = { key, at: Date.now(), rows };
    return rows;
  }).finally(() => { if (inflight === request) inflight = null; });
  inflight = request;
  return request.promise;
}
