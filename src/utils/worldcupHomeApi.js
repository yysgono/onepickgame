import { supabase } from './supabaseClient';

export async function fetchWorldcupHomeRows({ requests, search, creator, includeActivity, signal }) {
  let query = supabase.rpc('get_worldcup_home_rows', {
    p_requests: requests,
    p_search: String(search || ''),
    p_creator: String(creator || ''),
    p_include_activity: Boolean(includeActivity),
  });
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchWorldcupRelatedCards(id) {
  const { data, error } = await supabase.rpc('get_worldcup_related_cards', { p_id: id });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
