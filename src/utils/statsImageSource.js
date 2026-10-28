import {wasImageRecentlyLoaded} from './recentLoadedImages';
const DEFAULT_STORAGE='https://irfyuvuazhujtlgpkfci.supabase.co';
let transformsBlockedUntil=0;
export function pauseStatsImageTransforms(now=Date.now()){transformsBlockedUntil=now+60000;}
export function staticCandidateImage(value) {
 if(typeof value!=='string'||!value.trim())return '';
 const source=value.trim();
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
export function getStatsImageSource(value,options={}) {
 const original=staticCandidateImage(value);
 if(!original)return {url:'',transformed:false};
 const now=options.now??Date.now();
 if(wasImageRecentlyLoaded(original,now))return {url:original,transformed:false};
 const enabled=options.enabled??(process.env.REACT_APP_STATS_IMAGE_TRANSFORMS!=='false');
 if(!enabled||now<transformsBlockedUntil)return {url:original,transformed:false};
 try {
  const url=new URL(original);
  const storage=new URL(options.storageOrigin||process.env.REACT_APP_SUPABASE_URL||DEFAULT_STORAGE);
  const prefix='/storage/v1/object/public/';
  if(url.origin!==storage.origin||!url.pathname.startsWith(prefix)||url.pathname.slice(prefix.length).split('/').length<2)return {url:original,transformed:false};
  url.pathname=url.pathname.replace(prefix,'/storage/v1/render/image/public/');
  url.searchParams.delete('download');
  url.searchParams.set('width','96');url.searchParams.set('height','96');
  url.searchParams.set('resize','contain');url.searchParams.set('quality','70');
  return {url:url.href,transformed:true};
 }catch{return {url:original,transformed:false};}
}
