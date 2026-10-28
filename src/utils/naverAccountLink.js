import {supabase} from './supabaseClient';
const PROVIDER='custom:naver', KEY='onepick.oauth.naver-link';
const TTL=15*60*1000;
const hasNaver=user=>(user?.identities||[]).some(identity=>identity.provider===PROVIDER);
export function hasNaverLinkIntent(){try{return sessionStorage.getItem(KEY)!==null;}catch{return false;}}
export function clearNaverLinkIntent(){sessionStorage.removeItem(KEY);}
export async function startNaverAccountLink(language){
 const {data,error}=await supabase.auth.getUser();
 if(error||!data?.user?.id)throw Error('LINK_LOGIN_REQUIRED');
 if(hasNaver(data.user))return {alreadyLinked:true};
 sessionStorage.setItem('onepick.oauth.language',language);
 sessionStorage.setItem('onepick.oauth.provider',PROVIDER);
 sessionStorage.setItem(KEY,JSON.stringify({userId:data.user.id,createdAt:Date.now()}));
 try{
  const {error:linkError}=await supabase.auth.linkIdentity({provider:PROVIDER,options:{redirectTo:`${window.location.origin}/auth/callback`,scopes:'openid profile'}});
  if(linkError)throw linkError;
  return {alreadyLinked:false};
 }catch(error){clearNaverLinkIntent();throw error;}
}
let pending;
export function completeNaverAccountLink(){
 if(!pending)pending=(async()=>{
  const hash=new URLSearchParams(window.location.hash.slice(1)),query=new URLSearchParams(window.location.search);
  const failed=hash.has('error')||query.has('error');
  const code=hash.get('error_code')||query.get('error_code')||'';
  let intent;
  try{intent=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch{}
  try{
   // Let the existing Auth SDK finish handling its redirect before removing URL tokens.
   const {error:sessionError}=await supabase.auth.getSession();
   window.history.replaceState(window.history.state,'','/auth/callback');
   if(failed)throw Error(code==='identity_already_exists'?'LINK_IDENTITY_EXISTS':'LINK_FAILED');
   if(sessionError)throw Error('LINK_FAILED');
   if(!intent?.userId||!Number.isFinite(intent.createdAt)||Date.now()-intent.createdAt>TTL||Date.now()<intent.createdAt)throw Error('LINK_EXPIRED');
   // Verify against Auth, not a locally edited profile or an email address.
   const {data,error}=await supabase.auth.getUser();
   if(error||!data?.user?.id)throw Error('LINK_LOGIN_REQUIRED');
   if(data.user.id!==intent.userId){
    await supabase.auth.signOut({scope:'local'});
    throw Error('LINK_ACCOUNT_CHANGED');
   }
   if(!hasNaver(data.user))throw Error('LINK_NOT_CONFIRMED');
   return true;
  }finally{
   window.history.replaceState(window.history.state,'','/auth/callback');
   clearNaverLinkIntent();
  }
 })();
 return pending;
}
export function naverLinkErrorCode(error){
 const code=String(error?.code||error?.message||'');
 if(code==='identity_already_exists'||code==='LINK_IDENTITY_EXISTS')return 'duplicate';
 if(code==='manual_linking_disabled')return 'disabled';
 if(code==='LINK_LOGIN_REQUIRED')return 'loginRequired';
 if(code==='LINK_ACCOUNT_CHANGED')return 'accountChanged';
 if(code==='LINK_EXPIRED')return 'expired';
 return 'failed';
}
