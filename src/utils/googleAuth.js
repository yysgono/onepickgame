import { supabase } from './supabaseClient';
const LANGS = ['ko','en','ja','zh','ru','pt','es','fr','id','hi','de','vi','ar','bn','th','tr', "it", "pl", "nl", "cs"];
export function authLanguage(value) {
  const lang = String(value || '').toLowerCase().split(/[-_]/)[0];
  return LANGS.includes(lang) ? lang : 'en';
}
const NAVER = 'custom:naver';
export function oauthProvider() {
  try { return sessionStorage.getItem('onepick.oauth.provider') === NAVER ? NAVER : 'google'; }
  catch { return 'google'; }
}
async function startLogin(provider, language) {
  sessionStorage.removeItem('onepick.oauth.naver-link');
  sessionStorage.setItem('onepick.oauth.language', authLanguage(language));
  sessionStorage.setItem('onepick.oauth.provider', provider);
  const probe = 'onepick.oauth.storage-probe';
  localStorage.setItem(probe, '1'); localStorage.removeItem(probe);
  const options = {redirectTo: `${window.location.origin}/auth/callback`, scopes: provider === NAVER ? 'openid profile' : 'openid email profile'};
  if (provider === 'google') options.queryParams = {prompt:'select_account'};
  const {error} = await supabase.auth.signInWithOAuth({provider, options});
  if (error) throw error;
}
export function startGoogleLogin(language) { return startLogin('google', language); }
export function startNaverLogin(language) { return startLogin(NAVER, language); }
let pending, profileProvider;
function profileRpc(provider) { return provider === NAVER ? 'account_naver_profile' : 'account_google_profile'; }
export function completeGoogleLogin() {
  if (!pending) pending = (async () => {
    const failed = new URLSearchParams(window.location.hash.slice(1)).has('error') || new URLSearchParams(window.location.search).has('error');
    const {data,error} = await supabase.auth.getSession();
    window.history.replaceState(window.history.state, '', '/auth/callback');
    if (failed || error || !data?.session?.user) throw Error('OAUTH_FAILED');
    const user = data.session.user;
    // Provider metadata is issued by Auth. Never use user-editable user_metadata to authorize a provider.
    const current = user.app_metadata?.provider;
    const providers = (user.identities || []).map(identity=>identity.provider);
    if (current === NAVER || (oauthProvider() === NAVER && providers.includes(NAVER))) profileProvider = NAVER;
    else if (current === 'google' || providers.includes('google')) profileProvider = 'google';
    else throw Error('OAUTH_PROVIDER_UNSUPPORTED');
    const {data:nickname,error:profileError} = await supabase.rpc(profileRpc(profileProvider), {p_nickname:null});
    if (profileError) throw profileError;
    return nickname;
  })();
  return pending;
}
export async function saveSocialNickname(nickname) {
  if (!profileProvider) throw Error('OAUTH_NOT_READY');
  const {data,error} = await supabase.rpc(profileRpc(profileProvider), {p_nickname:nickname.trim()});
  if (error || !data) throw error || Error('PROFILE_FAILED');
  return data;
}

