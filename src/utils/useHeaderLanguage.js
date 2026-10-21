import {useEffect,useState} from 'react';
import {useLocation,useNavigate,useNavigationType} from 'react-router-dom';
const LANGUAGES=['en','ko','ja','zh','es','fr','vi','de','ru','id','pt','hi','tr','th','ar','bn'];
const KEY='onepick_header_language_v1';
let memoryPreference=null;
export function rememberHeaderLanguage(language){
 if(!LANGUAGES.includes(language))return;
 memoryPreference=language;
 try{window.sessionStorage.setItem(KEY,language);}catch{}
}
function preferredLanguage(){
 try{const saved=window.sessionStorage.getItem(KEY);if(LANGUAGES.includes(saved))return saved;}catch{}
 return memoryPreference;
}
export default function useHeaderLanguage(i18n){
 const location=useLocation(),navigate=useNavigate(),navigationType=useNavigationType();
 const [restoreVersion,setRestoreVersion]=useState(0);
 useEffect(()=>{const restore=()=>setRestoreVersion(value=>value+1);window.addEventListener('pageshow',restore);return()=>window.removeEventListener('pageshow',restore);},[]);
 const prefix=location.pathname.split('/')[1];
 const routeLanguage=location.pathname==='/'?'en':LANGUAGES.includes(prefix)?prefix:null;
 const preference=preferredLanguage();
 const language=routeLanguage&&navigationType==='POP'&&preference?preference:routeLanguage;
 useEffect(()=>{
  if(!language)return;
  if(i18n.language!==language)i18n.changeLanguage(language);
  if(routeLanguage!==language){
   const rest=location.pathname==='/'?'':location.pathname.split('/').slice(2).join('/');
   navigate('/'+language+(rest?'/'+rest:'')+location.search+location.hash,{replace:true});
  }
  try{window.localStorage.setItem('onepickgame_lang',language);}catch{}
 },[location.key,location.pathname,location.search,location.hash,language,routeLanguage,navigate,i18n,i18n.language,restoreVersion]);
 return language||(i18n.language||'en').split('-')[0];
}
