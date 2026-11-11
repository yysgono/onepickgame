// Verified proof stays in this tab's memory, never a password or browser storage.
const sessions=new Map(),TTL=30*60*1000;
export function getGuestEditSession(id){
 const session=sessions.get(id);if(!session||session.expires<=Date.now()){sessions.delete(id);return null;}
 return session;
}
export function rememberGuestEditSession(id,{salt,proof,nickname}){sessions.set(id,{salt,proof,nickname,expires:Date.now()+TTL});}
export function clearGuestEditSession(id){sessions.delete(id);}
