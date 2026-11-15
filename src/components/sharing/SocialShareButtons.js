import React,{useEffect,useState} from 'react';
import {shareLinks,copyShareUrl} from './shareLinks';
import copy from './copy.json';
import './socialShare.css';
export default function SocialShareButtons({title,url,lang='en',children}){
 const t=copy[lang]||copy.en,[status,setStatus]=useState(''),[sharingInstagram,setSharingInstagram]=useState(false);
 useEffect(()=>{setStatus('');},[url,title]);
 let links;try{links=shareLinks(title,url);}catch{return null;}
 async function shareInstagram(){
  if(sharingInstagram)return;
  setSharingInstagram(true);setStatus(t.instagramHelp);
  try{
   if(typeof navigator.share==='function'){
    try{await navigator.share({title:title||'One Pick Game',text:title||'One Pick Game',url});return;}
    catch(error){if(error?.name==='AbortError'){setStatus('');return;}}
   }
   setStatus(await copyShareUrl(url)?t.instagramCopied:t.instagramHelp+' '+t.failed);
  }finally{setSharingInstagram(false);}
 }
 return <div className="opg-social-share" role="group" aria-label={t.share} dir={lang==='ar'?'rtl':'ltr'}>
  <a className="opg-share-x" href={links.x} target="_blank" rel="noopener noreferrer" aria-label={t.share+' · X'}>𝕏 X</a>
  <a href={links.threads} target="_blank" rel="noopener noreferrer" aria-label={t.share+' · Threads'}>＠ Threads</a>
  <button type="button" className="opg-share-instagram" disabled={sharingInstagram} onClick={shareInstagram} title={t.instagramHelp}>◎ Instagram</button>
  <button type="button" onClick={async()=>setStatus(await copyShareUrl(url)?t.copied:t.failed)}>{t.copy}</button>
  {children}
  {status&&<span className="opg-share-status" role="status">{status}</span>}
 </div>;
}
