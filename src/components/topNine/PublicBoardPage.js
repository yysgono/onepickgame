import {loadBoardTitleSources} from './localizedTitle';
import React,{useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import TopNinePage from '../TopNinePage';
import Seo from '../../seo/Seo';
import {supabase} from '../../utils/supabaseClient';
import {makeShareHash,readShared} from './core';
import copy from './copy.json';

export default function PublicBoardPage(){
 const {lang:routeLang,id}=useParams(),navigate=useNavigate(),lang=copy[routeLang]?routeLang:'en',t=copy[lang];
 useEffect(()=>{
  try{const key='top-nine-viewer';let visitor=sessionStorage.getItem(key);if(!visitor){visitor=crypto.randomUUID();sessionStorage.setItem(key,visitor);}supabase.rpc('record_top_nine_view',{p_id:id,p_visitor:visitor}).catch(()=>{});}catch{}
 },[id]);
 const [result,setResult]=useState(null),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let live=true;setResult(null);
  supabase.from('top_nine_public_boards').select('id,title,slots,show_names,show_ranks,source_worldcup_ids,guest_nickname,category').eq('id',id).maybeSingle().then(async({data,error})=>{
   if(!live)return;
   if(error){setResult({error:true});return;}
   if(!data){setResult({missing:true});return;}
   try{
    const slots=data.slots.map(c=>c?.id==='tn-empty-cell'&&c.src==='https://www.onepickgame.com/top-nine-empty.png'?null:c);
    const board=readShared(makeShareHash(slots,data.title,data.show_names,data.show_ranks));
    const titleSources=await loadBoardTitleSources(supabase,[data]);if(!live)return;
    setResult(board?{board:{...board,category:data.category||'',authorNickname:data.guest_nickname||'',titleSources,sourceIds:data.source_worldcup_ids||[]}}:{missing:true});
   }catch{setResult({missing:true});}
  }).catch(()=>{if(live)setResult({error:true});});
  return()=>{live=false;};
 },[id,retry]);
 if(result?.board)return <TopNinePage key={id} publicBoard={result.board} publicId={id} onHome={()=>navigate('/'+lang+'/mytop9')}/>;
 return <main className="top-nine"><Seo title={t.title+' | One Pick Game'} lang={lang} slug={'mytop9/'+id} indexable={false}/><p role="status">{!result?t.loading:result.error?t.error:t.empty}</p>{result?.error&&<button onClick={()=>setRetry(n=>n+1)}>{t.retry}</button>}<Link to={'/'+lang+'/mytop9'}>{lang==='ko'?'구절판 홈으로':t.back}</Link></main>;
}
