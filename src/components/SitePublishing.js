import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
export const SITE_LANGUAGES=['ko','en','ja','zh','es','fr','vi','de','ru','id','pt','hi','tr','th','ar','bn','it','pl','nl','cs'];
export function useSitePublisher(){
 const [allowed,setAllowed]=useState(false);
 useEffect(()=>{let active=true,version=0; const check=async()=>{const n=++version;try{const {data,error}=await supabase.rpc('can_publish_site_content');if(active&&n===version)setAllowed(!error&&data===true);}catch{if(active&&n===version)setAllowed(false);}};check();const {data}=supabase.auth.onAuthStateChange(()=>{setAllowed(false);setTimeout(()=>{if(active)check();},0);});return()=>{active=false;data.subscription.unsubscribe();};},[]);
 return allowed;
}
export function plainArticle(html){const doc=new DOMParser().parseFromString(html||'','text/html');doc.querySelectorAll('script,style').forEach(n=>n.remove());doc.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));doc.querySelectorAll('p,div,h1,h2,h3,li').forEach(n=>n.append('\n'));return doc.body.textContent.trim();}
export function articleHtml(text){return text.split('\n').map(line=>'<p>'+line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</p>').join('');}
