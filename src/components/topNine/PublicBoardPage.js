import {loadShortLink} from './shortLinks';
import {draftStore} from './draft';
import {ownsGuestBoard,rememberGuestBoard} from './guestOwnership';
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
  supabase.from('top_nine_public_boards').select('id,title,slots,show_names,show_ranks,author_id,source_worldcup_ids,guest_nickname,category').eq('id',id).maybeSingle().then(async({data:publicData,error})=>{
   if(!live)return;
   if(error){setResult({error:true});return;}
   try{
    const data=publicData||await loadShortLink(supabase,id);if(!live)return;
    if(!data){setResult({missing:true});return;}
    const slots=data.slots.map(c=>c?.id==='tn-empty-cell'&&c.src==='https://www.onepickgame.com/top-nine-empty.png'?null:c);
    const board=readShared(makeShareHash(slots,data.title,data.show_names,data.show_ranks));
    const [titleSources,auth]=await Promise.all([data.unlisted?Promise.resolve([]):loadBoardTitleSources(supabase,[data]),Promise.resolve().then(()=>supabase.auth.getUser()).catch(()=>null)]);if(!live)return;
    const actor=auth?.data?.user;
    const oldDraft=!data.unlisted&&!data.author_id&&!ownsGuestBoard(id)?await Promise.resolve().then(()=>draftStore()).catch(()=>null):null;
    const guestOwner=ownsGuestBoard(id)||oldDraft?.boardId===id;
    if(!data.author_id&&guestOwner)rememberGuestBoard(id);
    const canEdit=!data.unlisted&&(data.author_id?!!actor&&!actor.is_anonymous&&actor.id===data.author_id:guestOwner);
    if(!live)return;
    setResult(board?{canEdit,board:{...board,unlisted:!!data.unlisted,isGuest:!data.author_id&&!data.unlisted,category:data.category||'',authorNickname:data.guest_nickname||'',titleSources,sourceIds:data.source_worldcup_ids||[]}}:{missing:true});
   }catch{setResult({error:true});}
  }).catch(()=>{if(live)setResult({error:true});});
  return()=>{live=false;};
 },[id,retry]);
 if(result?.board)return <TopNinePage key={id} publicBoard={result.board} publicId={id} canEdit={result.canEdit} onHome={()=>navigate('/'+lang+'/mytop9')}/>;
 return <main className="top-nine">{result?.missing&&<Seo title={t.title+' | One Pick Game'} lang={lang} slug={'mytop9/'+id} indexable={false}/>}<p role="status">{!result?t.loading:result.error?t.error:t.empty}</p>{result?.error&&<button onClick={()=>setRetry(n=>n+1)}>{t.retry}</button>}<Link to={'/'+lang+'/mytop9'}>{lang==='ko'?'구절판 취향표 홈으로':t.back}</Link></main>;
}
