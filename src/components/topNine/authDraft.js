import {draftStore} from './draft';
const KEY='onepick.top-nine.auth-return';
const tokenPattern=/^[a-z0-9-]{10,80}$/i;
export async function saveAuthDraft(record,lang){
 const token=crypto.randomUUID();
 const path=`/${lang}/mytop9?resume=${token}`;
 // Commit photos and editor settings before allowing navigation away.
 await draftStore(record,true,'auth:'+token);
 await draftStore(record,true);
 sessionStorage.setItem(KEY,path);
 return path;
}
export function topNineAuthReturn(fallback){
 try{const path=sessionStorage.getItem(KEY);return /^\/[a-z]{2}\/mytop9\?resume=[a-z0-9-]{10,80}$/i.test(path||'')?path:fallback;}catch{return fallback;}
}
export async function readAuthDraft(search){
 const token=new URLSearchParams(search).get('resume');
 if(!tokenPattern.test(token||''))return null;
 const record=await draftStore(undefined,false,'auth:'+token);
 return record?.v===1?record:null;
}
export function clearAuthReturn(){try{sessionStorage.removeItem(KEY);}catch{}}
