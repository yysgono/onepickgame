// URL hints only: no blobs, decoded images, localStorage or persistent session data.
const recent = new Map();
const MAX_URLS = 512;
const TTL = 60 * 60 * 1000;
export function imageUrlKey(value) {
 if(typeof value!=='string' || value.length>4096)return '';
 try {
  const url=new URL(value,typeof window!=='undefined'?window.location.origin:'https://www.onepickgame.com');
  return ['https:','http:'].includes(url.protocol)?url.href:'';
 } catch {return '';}
}
export function rememberLoadedImage(value, now=Date.now()) {
 const key=imageUrlKey(value);if(!key)return;
 recent.delete(key);recent.set(key,now);
 while(recent.size>MAX_URLS)recent.delete(recent.keys().next().value);
}
export function wasImageRecentlyLoaded(value,now=Date.now()) {
 const key=imageUrlKey(value),time=recent.get(key);
 if(time==null)return false;
 if(now-time>=TTL || time>now){recent.delete(key);return false;}
 return true;
}
