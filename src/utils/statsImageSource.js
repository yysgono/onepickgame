import { originalStorageImageUrl } from './originalStorageImageUrl';
// Compatibility export: transformations are disabled in code.
export function pauseStatsImageTransforms() {}
export function staticCandidateImage(value) {
 if(typeof value!=='string'||!value.trim())return '';
 const source=originalStorageImageUrl(value.trim());
 if(/^data:image\//i.test(source)||/^blob:/i.test(source))return source;
 try {
  const url=new URL(source,typeof window!=='undefined'?window.location.origin:'https://www.onepickgame.com');
  if(!['http:','https:'].includes(url.protocol))return '';
  const host=url.hostname.toLowerCase().replace(/^(?:www\.|m\.)/,'');
  if(['youtube.com','youtube-nocookie.com','youtu.be'].includes(host)){
   const parts=url.pathname.split('/').filter(Boolean);
   const id=host==='youtu.be'?parts[0]:url.searchParams.get('v')||(['embed','shorts','live'].includes(parts[0])?parts[1]:'');
   return /^[A-Za-z0-9_-]{11}$/.test(id||'')?`https://i.ytimg.com/vi/${id}/mqdefault.jpg`:'';
  }
  if(/\.(mp4|webm|mov|m4v|m3u8|mp3|wav|ogg)$/i.test(url.pathname))return '';
  return source;
 } catch {return '';}
}
export function getStatsImageSource(value, options={}) {
 return {url:staticCandidateImage(value),transformed:false};
}

