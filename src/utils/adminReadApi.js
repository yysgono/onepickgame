import { adminDisplayTitle } from "./adminDisplayTitle";
import { supabase } from './supabaseClient';

// Existing authenticated client and RLS are preserved. These helpers only read data.
async function readAllRows(table, fields) {
  const items = [];
  const pageSize = 200;
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const { data, count, error } = await supabase.from(table)
      .select(fields, offset === 0 ? { count: 'exact' } : undefined).is("deleted_at", null)
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (typeof count === 'number') total = count;
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) break;
    items.push(...rows);
    offset += rows.length;
    if (!Number.isFinite(total) && rows.length < pageSize) break;
  }
  return [...new Map(items.map(item => [String(item.id), item])).values()];
}

export function getAllAdminWorldcups() {
  return readAllRows('worldcups', 'id,title,title_translations,category,is_featured,featured_order,created_at,deleted_at,preview_image:data->0->>image');
}
export function getAllAdminTierLists() {
  return readAllRows('tier_lists', 'id,title,title_translations,category,thumbnail_url,candidate_count,candidates,created_at');
}
export function getAllAdminQuizzes() {
  return readAllRows('quizzes', 'id,title,title_translations,thumbnail_url,category,question_count,play_count,is_featured,featured_order,created_at,is_published');
}

export function adminTitleMatches(item, keyword) {
  const query = String(keyword || '').trim().toLowerCase();
  if (!query) return true;
  let translations = item?.title_translations || {};
  if (typeof translations === 'string') { try { translations = JSON.parse(translations); } catch { translations = {}; } }
  const values = translations && typeof translations === 'object' && !Array.isArray(translations) ? Object.values(translations) : [];
  return [item?.id, item?.title, ...values].some(value => typeof value === 'string' && value.toLowerCase().includes(query));
}

async function readCount(table, applyFilter = query => query) {
  const { count, error } = await applyFilter(supabase.from(table).select('id', { count: 'exact', head: true }));
  if (error) throw error;
  if (typeof count !== 'number') throw new Error('Count unavailable');
  return count;
}
export const getAdminCommentCount = () => readCount('comments');
export const getAdminWorldcupCount = () => readCount('worldcups', query => query.is('deleted_at', null));
export const getAdminTotalCompletions = () => readCount('winner_logs');

export function getTodayKstDateString(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
export function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
export function getKstDayRangeUtc(dateString) {
  const start = new Date(`${dateString}T00:00:00+09:00`);
  return { start: start.toISOString(), end: new Date(start.getTime() + 86400000).toISOString() };
}
export async function getAdminRecent7Completions(today = getTodayKstDateString()) {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  return Promise.all(dates.map(async date => {
    const { start, end } = getKstDayRangeUtc(date);
    try {
      const count = await readCount('winner_logs', query => query.gte('created_at', start).lt('created_at', end));
      return { date, count };
    } catch (error) { return { date, count: null, error: error?.message || 'Count unavailable' }; }
  }));
}
export async function getAdminRecentPlays() {
  const { data, error } = await supabase.from('winner_logs').select('id,cup_id,winner_id,created_at')
    .order('created_at', { ascending: false }).limit(30);
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  const ids = [...new Set(rows.map(row => row.cup_id).filter(Boolean))];
  let titles = new Map();
  if (ids.length) {
    const { data: cups, error: titleError } = await supabase.from('worldcups').select('id,title,title_translations').is("deleted_at", null).in('id', ids);
    if (titleError) throw titleError;
    titles = new Map((cups || []).map(cup => [String(cup.id), adminDisplayTitle(cup)]));
  }
  return rows.map(row => ({ ...row, worldcup_title: titles.get(String(row.cup_id)) || '삭제되었거나 제목 없는 월드컵' }));
}
export async function getAdminRecentComments() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data, error } = await supabase.from('comments').select('id,content,created_at,cup_id')
    .gte('created_at', since).order('created_at', { ascending: false }).limit(30);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Metadata only: no answers, participant identifiers, candidate arrays or images.
export async function getAdminRecentContentActivity(kind) {
  if (!['quiz', 'tier-list'].includes(kind)) throw new Error('Unsupported activity kind');
  const isQuiz = kind === 'quiz';
  const logTable = isQuiz ? 'quiz_attempts' : 'tier_list_play_logs';
  const parentTable = isQuiz ? 'quizzes' : 'tier_lists';
  const parentKey = isQuiz ? 'quiz_id' : 'tier_list_id';
  const { data, error } = await supabase.from(logTable)
    .select(`id,${parentKey},created_at`).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(30);
  if (error) throw error;
  const logs = Array.isArray(data) ? data : [];
  const ids = [...new Set(logs.map(row => row[parentKey]).filter(Boolean))];
  let parents = new Map();
  if (ids.length) {
    const fields = isQuiz ? 'id,title,title_translations,original_language,content_languages' : 'id,title,title_translations';
    const { data: titles, error: titleError } = await supabase.from(parentTable).select(fields).is('deleted_at', null).in('id', ids);
    if (titleError) throw titleError;
    parents = new Map((titles || []).map(row => [String(row.id), row]));
  }
  const languages = ['ko','en','ja','zh','es','fr','vi','de','ru','id','pt','hi','tr','th','ar','bn'];
  return logs.map(row => {
    const parent = parents.get(String(row[parentKey]));
    const supported = isQuiz ? [...(parent?.content_languages || []), parent?.original_language] : ['ko'];
    const lang = supported.includes('ko') ? 'ko' : languages.includes(parent?.original_language) ? parent.original_language : 'en';
    return {
      id: row.id, created_at: row.created_at,
      title: parent ? adminDisplayTitle(parent) : '삭제되었거나 조회할 수 없는 콘텐츠',
      href: parent ? `/${lang}/${kind}/${encodeURIComponent(parent.id)}` : null,
    };
  });
}


// Counts only; never fetch answer records or participant IDs for dashboard totals.
export function getAdminTodayContentCount(kind, today = getTodayKstDateString()) {
  if (!['quiz', 'tier-list'].includes(kind)) throw new Error('Unsupported activity kind');
  const { start, end } = getKstDayRangeUtc(today);
  const table = kind === 'quiz' ? 'quiz_attempts' : 'tier_list_play_logs';
  return readCount(table, query => query.gte('created_at', start).lt('created_at', end));
}


export async function getAdminTodayRandomPickCount() {
  const { data, error } = await supabase.rpc('get_admin_random_pick_today_v101');
  // The layout remains usable while the additive SQL has not yet been installed.
  if (error && ['PGRST202', '42883'].includes(error.code)) return { pending: true };
  if (error) throw error;
  const value = Number(data?.count);
  if (!data || data.count == null || !Number.isSafeInteger(value) || value < 0 || typeof data.partial !== 'boolean') throw new Error('Count unavailable');
  return { count: value, partial: data.partial };
}
