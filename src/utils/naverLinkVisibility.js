// Display rule only. Actual linking is still authorized by Supabase Auth.
export function naverLinkVisibility(user) {
 const providers=(user?.identities||[]).map(identity=>identity.provider);
 if(providers.includes('custom:naver'))return 'linked';
 if(providers.includes('email')&&/^[^@\s]+@naver\.com$/i.test(String(user?.email||'').trim()))return 'ready';
 return 'hidden';
}
