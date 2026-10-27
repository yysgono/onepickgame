import { supabase } from './supabaseClient';
const LANGS = ['ko','en','ja','zh','ru','pt','es','fr','id','hi','de','vi','ar','bn','th','tr'];
export function authLanguage(value) {
  const lang = String(value || '').toLowerCase().split(/[-_]/)[0];
  return LANGS.includes(lang) ? lang : 'en';
}
export async function startGoogleLogin(language) {
  // Fail visibly if this browser cannot retain the OAuth/session state.
  sessionStorage.setItem('onepick.oauth.language', authLanguage(language));
  const probe = 'onepick.oauth.storage-probe';
  localStorage.setItem(probe, '1'); localStorage.removeItem(probe);
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    scopes: 'openid email profile',
    queryParams: { prompt: 'select_account' },
  } });
  if (error) throw error;
}
let pending;
export function completeGoogleLogin() {
  if (!pending) pending = (async () => {
    // The existing Supabase client handles its default implicit callback before getSession resolves.
    const failed = new URLSearchParams(window.location.hash.slice(1)).has('error') ||
      new URLSearchParams(window.location.search).has('error');
    const { data, error } = await supabase.auth.getSession();
    // Never retain provider/session tokens in the URL or browser history.
    window.history.replaceState(window.history.state, '', '/auth/callback');
    if (failed || error || !data?.session?.user) throw Error('OAUTH_FAILED');
    const { data: nickname, error: profileError } = await supabase.rpc('account_google_profile', { p_nickname: null });
    if (profileError) throw profileError;
    return nickname;
  })();
  return pending;
}
