import { originalStorageImageUrl } from '../../utils/originalStorageImageUrl';
export function safeMedia(value, local = true) {
 if(typeof value !== 'string' || value.length > 3000000) return '';
 if(local && /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value)) return value;
 try { const u=new URL(value); if(!['http:','https:'].includes(u.protocol)||u.username||u.password) return '';
 // Signed render URLs can still incur transformation charges. Do not request them.
 if(u.pathname.includes('/render/image/sign/')) return '';
 return originalStorageImageUrl(u.href);
 }catch{return '';}
}
export function normalizeCandidates(data) {
 if(!Array.isArray(data))return [];
 return data.slice(0,2048).map((c,i)=>({id:String(c?.id ?? i)+'-'+i,name:String(c?.name || c?.title || '').slice(0,150),searchNames:candidateSearchNames(c),src:safeMedia(c?.image||c?.image_url||c?.url),zoom:1,x:50,y:50})).filter(c=>c.src);
}
export function toggleCandidate(slots,candidate) {
 const next=[...slots], index=next.findIndex(c=>c?.id===candidate.id);
 if(index>=0)next[index]=null;
 else {const empty=next.findIndex(c=>!c);if(empty>=0)next[empty]={...candidate};}
 return next;
}
export function swapSlots(slots,a,b) {const next=[...slots];[next[a],next[b]]=[next[b],next[a]];return next;}
export function normalizeZoom(value) {
 const number=Number(value??1);return Number.isFinite(number)?Math.max(0,Math.min(3,number)):1;
}
export function cropRect(w,h,zoom=1,x=50,y=50) {
 const z=normalizeZoom(zoom),short=Math.min(w,h),long=Math.max(w,h);
 // Zero fits the whole image; one preserves the original square crop.
 const size=z<1?long+(short-long)*z:short/z;
 return [(w-size)*Math.max(0,Math.min(100,Number(x)||0))/100,(h-size)*Math.max(0,Math.min(100,Number(y)||0))/100,size,size];
}
export function gameBatch(pool,offset) {return pool.length<=27?pool:pool.slice(offset,offset+9);}
export function gameRequired(pool,batch) {return pool.length<=27?9:Math.min(3,batch.length);}
function cleanCandidate(c,local) {
 const src=safeMedia(c?.src,local);if(!src)return null;
 return {id:String(c.id||'').slice(0,160),name:String(c.name||'').slice(0,150),src,zoom:normalizeZoom(c.zoom),x:Math.max(0,Math.min(100,Number(c.x)||0)),y:Math.max(0,Math.min(100,Number(c.y)||0))};
}
export function readShared(hash) {
 try {
  if(!hash.startsWith('#nine=') || hash.length>24000)return null;
  const raw=JSON.parse(decodeURIComponent(escape(atob(hash.slice(6)))));
  if(raw.v!==1||!Array.isArray(raw.slots)||raw.slots.length!==9)return null;
  const slots=raw.slots.map(c=>cleanCandidate(c,false));
  if(!slots.some(Boolean)||slots.some((c,i)=>raw.slots[i]!==null && (!c || !isShareable(c))))return null;
  return {slots,title:String(raw.title||'').slice(0,100),names:raw.names===true};
 }catch{return null;}
}
export function isShareable(c) {
 if(!c || !/^https?:\/\//i.test(c.src))return false;
 try {const u=new URL(c.src);return !/\/sign\//i.test(u.pathname)&&![...u.searchParams.keys()].some(k=>/token|signature|credential|expires|key|auth/i.test(k));}catch{return false;}
}
export function makeShareHash(slots,title,names) {
 if(slots.length!==9||!slots.some(Boolean)||!slots.every(c=>c===null||isShareable(c)))throw new Error('LOCAL_SHARE');
 const payload={v:1,title:String(title).slice(0,100),names:!!names,slots:slots.map(c=>cleanCandidate(c,false))};
 const hash='#nine='+btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
 if(hash.length>24000)throw new Error('LONG_SHARE');
 return hash;
}
// Each placement is independent: the same candidate may fill multiple cells.
export function placeCandidate(slots,candidate,target=null) {
 const next=[...slots],index=target===null?next.findIndex(c=>!c):target;
 if(!candidate||!Number.isInteger(index)||index<0||index>8)return next;
 next[index]={...candidate};return next;
}
export function clearSlot(slots,index){return slots.map((c,i)=>i===index?null:c);}

function candidateSearchNames(c) {
 const values=[c?.name,c?.title,...(Array.isArray(c?.searchNames)?c.searchNames:[])];
 for(const field of ['name_translations','title_translations','translations']) {
  let map=c?.[field];if(typeof map==='string'){try{map=JSON.parse(map);}catch{map={};}}
  if(map&&typeof map==='object'){for(const value of Object.values(map)){if(typeof value==='string')values.push(value);else if(value&&typeof value==='object')values.push(...Object.values(value).filter(v=>typeof v==='string'));}}
 }
 for(const [key,value] of Object.entries(c||{}))if(/^(name|title)_[a-z]{2}$/.test(key)&&typeof value==='string')values.push(value);
 return values.filter(v=>typeof v==='string');
}
export function candidateMatches(candidate,query) {
 const normalize=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
 const keyword=normalize(query);return !keyword||candidateSearchNames(candidate).some(name=>normalize(name).includes(keyword));
}
