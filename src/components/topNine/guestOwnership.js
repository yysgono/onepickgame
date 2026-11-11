// A local hint controls button visibility only. Guest edits still require the password.
const KEY='onepick-top-nine-owned-guest-boards';
export function ownsGuestBoard(id){
 try {const ids=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(ids)&&ids.includes(id);}catch{return false;}
}
export function rememberGuestBoard(id){
 if(!id)return;
 try {const value=JSON.parse(localStorage.getItem(KEY)||'[]'),ids=Array.isArray(value)?value:[];localStorage.setItem(KEY,JSON.stringify([...new Set([...ids,id])].slice(-1000)));}catch{}
}
