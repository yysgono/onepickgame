import categoryLabels from './categoryLabels.json';
import {localizedBoardTitle,loadBoardTitleSources} from './localizedTitle';
import {Link} from 'react-router-dom';
import {createPortal} from 'react-dom';
import {authoredTitle,publishWithTitleRetry} from './publicTitle';
import {prepareMemberSlots} from "./memberImages";
import copy from './copy.json';
import {guestSalt,guestProof} from './guestProof';
import React,{useEffect,useState} from 'react';
import {supabase} from '../../utils/supabaseClient';
import {makeShareHash,readShared,cropRect,SLOT_RANKS} from './core';
import {isVideo} from './media';
import {hasBadword} from '../../badwords-multilang';
// The public RPC stores nine image records. Use one shared static tile for empty positions.
const emptyTile={id:'tn-empty-cell',name:'',src:'https://www.onepickgame.com/top-nine-empty.png',zoom:1,x:50,y:50};
export function PublishBoard({slots,title,names,showRanks=false,lang,onPublished,disabled=false,sourceIds=[],category='',existingId=''}) {
 const t=copy[lang]||copy.en,[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[open,setOpen]=useState(false),[guest,setGuest]=useState(false),[nickname,setNickname]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[editSalt,setEditSalt]=useState('');
 async function begin(){if(disabled||busy)return;setMessage('');setBusy(true);try{const {data}=await supabase.auth.getUser();const isGuest=!data?.user||data.user.is_anonymous;if(isGuest)makeShareHash(slots,title,names,showRanks);setGuest(isGuest);setEditSalt('');
 if(existingId){
  const original=await supabase.from('top_nine_public_boards').select('author_id').eq('id',existingId).maybeSingle();
  if(original.error||!original.data)throw Error('EDIT_PERMISSION');
  if(original.data.author_id){if(isGuest||original.data.author_id!==data.user.id)throw Error('EDIT_PERMISSION');}
  else{
   if(!isGuest)throw Error('EDIT_PERMISSION');
   const salt=await supabase.rpc('get_top_nine_guest_salt',{p_id:existingId});
   if(salt.error||!salt.data)throw Error('EDIT_PERMISSION');setEditSalt(salt.data);
  }
 }
 if(!isGuest){
  const profile=await supabase.from('profiles').select('nickname').eq('id',data.user.id).maybeSingle();
  setNickname(profile.data?.nickname||data.user.user_metadata?.nickname||data.user.user_metadata?.name||('OnePick-'+data.user.id.slice(0,6)));
 }
 setOpen(true);}catch(error){setMessage(error.message==='EDIT_PERMISSION'?t.editDenied:t.localShare);}finally{setBusy(false);}}
 async function publish(e){e.preventDefault();if(busy)return;setBusy(true);setMessage('');try{
 const prepared=guest?slots:await prepareMemberSlots(slots);makeShareHash(prepared,title,names,showRanks);if(hasBadword(title,lang)||slots.some(c=>c&&hasBadword(c.name,lang))||hasBadword(nickname,lang))throw Error('TEXT');
 if(guest&&(password!==confirm||password.length<8))throw Error('PASSWORD');
 const salt=guest?(editSalt||guestSalt()):null,proof=guest?await guestProof(password,salt):null;
 const published=await publishWithTitleRetry(supabase,{p_title:authoredTitle(title,nickname),p_slots:prepared.map(c=>c??emptyTile),p_names:names,p_show_ranks:showRanks,p_nickname:guest?nickname:null,p_salt:salt,p_proof:proof,p_source_worldcup_ids:sourceIds,p_category:category,...(existingId?{p_board_id:existingId}:{})});
 if(!published.data)throw Error('PUBLISH_FAILED');
 setMessage(t.published);setOpen(false);setPassword('');setConfirm('');onPublished(published.data);
 }catch{setMessage(t.publishFailed);}finally{setBusy(false);}}
 return <><button className="tn-publish-button" disabled={busy||disabled} onClick={begin}>{existingId?t.saveChanges:t.publish}</button>{!open&&message&&<div className="tn-publish-status" role="status"><p>{message}</p>{message===t.localShare&&<><p>{t.memberUploadHelp}</p><a href={`/${lang}/login`}>{t.memberAccess}</a></>}</div>}{open&&createPortal(<div className="top-nine tn-picker-overlay tn-public-overlay" dir={lang==='ar'?'rtl':'ltr'}><section className="tn-publish-dialog" role="dialog" aria-modal="true" aria-label={existingId?t.saveChanges:t.publish}><h2>{existingId?t.saveChanges:t.publish}</h2>{guest?<p>{t.publishHelp}</p>:<p>{t.memberUploadHelp}</p>}<form onSubmit={publish}>{guest&&<><label>{t.nickname}<input required minLength={2} maxLength={30} value={nickname} onChange={e=>setNickname(e.target.value)}/></label><label>{t.password}<input type="password" required minLength={8} maxLength={100} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>{t.confirmPassword}<input type="password" required minLength={8} maxLength={100} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label></>}{message&&<p role="alert">{message}</p>}<div className="tn-actions"><button className="tn-primary" disabled={busy}>{existingId?t.saveChanges:t.publish}</button><button type="button" disabled={busy} onClick={()=>{setOpen(false);setPassword('');setConfirm('');setMessage('');}}>{t.close}</button></div></form></section></div>,document.body)}</>;
}
export function BoardThumbnail({candidate}){
 const [dimensions,setDimensions]=useState(null);
 const measure=event=>{const node=event.currentTarget;const w=node.naturalWidth||node.videoWidth,h=node.naturalHeight||node.videoHeight;if(w&&h)setDimensions({src:candidate.src,w,h});};
 let style={display:'block',position:'absolute',width:'100%',height:'100%',objectFit:'cover',maxWidth:'none',aspectRatio:'auto'};
 if(dimensions?.src===candidate.src){
  const {w,h}=dimensions,[x,y,size]=cropRect(w,h,candidate.zoom,candidate.x,candidate.y);
  style={...style,objectFit:'fill',width:`${w/size*100}%`,height:`${h/size*100}%`,left:`${-x/size*100}%`,top:`${-y/size*100}%`};
 }
 return <span style={{display:'block',position:'relative',aspectRatio:'1',overflow:'hidden',background:'#fff'}}>{isVideo(candidate.src)?<video src={candidate.src} muted playsInline preload="metadata" onLoadedMetadata={measure} style={style}/>:<img src={candidate.src} alt="" loading="lazy" onLoad={measure} style={style}/>}</span>;
}
export default function PublicBoards({lang,tick=0}) {
 const [category,setCategory]=useState('all'),[sort,setSort]=useState('latest');
 const t=copy[lang]||copy.en,ko=lang==='ko',[guestDelete,setGuestDelete]=useState(null),[deletePassword,setDeletePassword]=useState(''),[deleting,setDeleting]=useState(false),[rows,setRows]=useState([]),[page,setPage]=useState(0),[more,setMore]=useState(false),[error,setError]=useState(false),[retry,setRetry]=useState(0),[actor,setActor]=useState(null),[busy,setBusy]=useState(false);
 useEffect(()=>{let live=true;supabase.auth.getUser().then(({data})=>{if(live)setActor(data.user?.id);});return()=>{live=false;};},[]);
 useEffect(()=>{setPage(0);setRows([]);},[tick]);
 useEffect(()=>{let live=true;setBusy(true);setError(false);(async()=>{
 let query=supabase.from('top_nine_public_boards').select('id,title,slots,show_names,show_ranks,created_at,author_id,guest_nickname,source_worldcup_ids,category,view_count');
 if(category!=='all')query=query.eq('category',category);
 if(sort==='popular')query=query.order('view_count',{ascending:false});
 return query.order('created_at',{ascending:false}).order('id').range(page*12,page*12+11);
 })().then(async({data,error})=>{if(!live)return;if(error){setError(true);return;}const titleSources=await loadBoardTitleSources(supabase,data);if(!live)return;const enriched=data.map(row=>({...row,titleSources}));setRows(old=>page?[...old,...enriched]:enriched);setMore(data.length===12);}).catch(()=>{if(live)setError(true);}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};},[page,tick,retry,category,sort]);
 async function remove(id){if(!window.confirm(ko?'공개 목록에서 삭제할까요?':'Delete this public collage?'))return;const {error}=await supabase.rpc('delete_top_nine_board',{p_id:id});if(error)setError(true);else setRows(r=>r.filter(c=>c.id!==id));}
 async function removeGuest(e){e.preventDefault();setDeleting(true);try{const saltResult=await supabase.rpc('get_top_nine_guest_salt',{p_id:guestDelete});if(saltResult.error||!saltResult.data)throw Error('GUEST');const proof=await guestProof(deletePassword,saltResult.data);const {data,error}=await supabase.rpc('delete_top_nine_guest_board',{p_id:guestDelete,p_proof:proof});if(error||!data)throw Error('GUEST');setRows(rows=>rows.filter(r=>r.id!==guestDelete));setGuestDelete(null);setDeletePassword('');}catch{setError(true);}finally{setDeleting(false);}}
 return <section className="tn-gallery"><h2>{ko?'다른 사람들이 만든 구절판':'Community Top 9'}</h2>
 <div className="tn-category-filters" role="group" aria-label={ko?'구절판 카테고리':'Top 9 categories'}>{Object.entries(categoryLabels[lang]||categoryLabels.en).map(([key,label])=><button key={key} type="button" aria-pressed={category===key} onClick={()=>{if(category===key)return;setCategory(key);setPage(0);setRows([]);}}>{label}</button>)}</div>
 <div className="tn-sort-filters" role="group" aria-label={ko?'정렬':'Sort'}>{[['popular',ko?'인기순':'Popular'],['latest',ko?'최신순':'Latest']].map(([key,label])=><button key={key} type="button" aria-pressed={sort===key} onClick={()=>{if(sort===key)return;setSort(key);setPage(0);setRows([]);}}>{label}</button>)}</div>
 {error?<p role="alert">{ko?'목록을 불러오지 못했어요.':'Unable to load the gallery.'} <button onClick={()=>setRetry(n=>n+1)}>{ko?'다시 시도':'Retry'}</button></p>:!busy&&!rows.length?<p>{ko?'아직 공개된 구절판이 없어요. 첫 구절판을 공유해 보세요.':'No public collages yet. Share the first one.'}</p>:null}
 <div className="tn-public-cards">{rows.map(row=>{let data;try{data=readShared(makeShareHash(row.slots.map(c=>c?.id===emptyTile.id&&c.src===emptyTile.src?null:c),row.title,row.show_names,row.show_ranks));}catch{return null;}return <article key={row.id}><Link className="tn-public-card-link" to={`/${lang}/mytop9/${row.id}`}><div className="tn-mini-grid" dir="ltr">{data.slots.map((c,i)=><div key={i} className="tn-mini-cell">{c?<BoardThumbnail candidate={c}/>:<span className="tn-mini-empty"/>}{data.showRanks&&<span className={`tn-rank ${i===4?'tn-rank-first':''}`} aria-hidden="true">{SLOT_RANKS[i]}</span>}</div>)}</div><strong title={localizedBoardTitle(row,row.titleSources,lang)}>{localizedBoardTitle(row,row.titleSources,lang)}</strong></Link>{row.guest_nickname&&<small>{row.guest_nickname}</small>}{(!row.author_id||actor===row.author_id)&&<Link className="tn-public-edit-link" to={`/${lang}/mytop9/${row.id}?edit=1`}>{t.edit}</Link>}{!row.author_id&&<button onClick={()=>setGuestDelete(row.id)}>{t.deleteBoard}</button>}{row.author_id&&actor===row.author_id&&<button onClick={()=>remove(row.id)}>{ko?'삭제':'Delete'}</button>}</article>;})}</div>
 {more&&<button type="button" className="tn-gallery-more" disabled={busy} onClick={()=>setPage(n=>n+1)}>{ko?'더보기':'Show more'}</button>}
 {guestDelete&&<div className="tn-picker-overlay"><form className="tn-publish-dialog" onSubmit={removeGuest}><label>{t.password}<input type="password" required minLength={8} value={deletePassword} onChange={e=>setDeletePassword(e.target.value)}/></label>{error&&<p role="alert">{t.error}</p>}<div className="tn-actions"><button disabled={deleting}>{t.deleteBoard}</button><button type="button" disabled={deleting} onClick={()=>{setGuestDelete(null);setDeletePassword('');}}>{t.close}</button></div></form></div>}
 </section>;
}

export function DeleteBoard({id,lang,onDeleted}){
 const t=copy[lang]||copy.en;
 const [permission,setPermission]=useState(null),[open,setOpen]=useState(false),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{
  let live=true;setPermission(null);
  Promise.all([supabase.auth.getUser(),supabase.from('top_nine_public_boards').select('author_id').eq('id',id).maybeSingle()]).then(([auth,row])=>{
   if(!live||row.error||!row.data)return;
   const actor=auth.data?.user;
   if(!row.data.author_id)setPermission('guest');
   else if(actor&&!actor.is_anonymous&&actor.id===row.data.author_id)setPermission('member');
  }).catch(()=>{});
  return()=>{live=false;};
 },[id]);
 async function remove(event){
  event.preventDefault();if(busy)return;setBusy(true);setError(false);
  try{
   let result;
   if(permission==='guest'){
    const salt=await supabase.rpc('get_top_nine_guest_salt',{p_id:id});
    if(salt.error||!salt.data)throw Error('GUEST');
    const proof=await guestProof(password,salt.data);
    result=await supabase.rpc('delete_top_nine_guest_board',{p_id:id,p_proof:proof});
    if(!result.data)throw Error('GUEST');
   }else if(permission==='member')result=await supabase.rpc('delete_top_nine_board',{p_id:id});
   else throw Error('PERMISSION');
   if(result.error)throw result.error;
   setOpen(false);setPassword('');onDeleted?.();
  }catch{setError(true);}finally{setBusy(false);}
 }
 if(!permission)return null;
 return <><button type="button" onClick={()=>{setError(false);setOpen(true);}}>{t.deleteBoard}</button>{open&&createPortal(<div className="top-nine tn-picker-overlay tn-public-overlay" dir={lang==='ar'?'rtl':'ltr'}><section className="tn-publish-dialog" role="dialog" aria-modal="true" aria-label={t.deleteBoard}><h2>{t.deleteBoard}</h2><form onSubmit={remove}>{permission==='guest'&&<label>{t.password}<input type="password" required minLength={8} maxLength={100} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>}{error&&<p role="alert">{t.error}</p>}<div className="tn-actions"><button type="submit" disabled={busy}>{t.deleteBoard}</button><button type="button" disabled={busy} onClick={()=>{setOpen(false);setPassword('');}}>{t.close}</button></div></form></section></div>,document.body)}</>;
}
