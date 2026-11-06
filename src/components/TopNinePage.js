import CommentBox from './CommentBox';
import categoryLabels from './topNine/categoryLabels.json';
import {supabase} from '../utils/supabaseClient';
import {boardDescription} from './topNine/boardDescription';
import {localizedBoardTitle,loadBoardTitleSources} from './topNine/localizedTitle';
// @refresh reset
import TopNineGame from "./topNine/TopNineGame";
import GameCountSelect from "./topNine/GameCountSelect";
import {createGame,advanceGame as advanceGameState,chooseMore,fillRemaining,activatedPhoto} from "./topNine/game";
import {prepareMemberSlots} from "./topNine/memberImages";
import SiteCandidatePicker from "./topNine/SiteCandidatePicker";
import TopNineIcon from "./TopNineIcon";
import ContentLanguageSelect from "./ContentLanguageSelect";
import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useLocation,useParams} from 'react-router-dom';
import Seo from '../seo/Seo';
import {templateTitle} from '../utils/templateTitles';
import copy from './topNine/copy.json';
import PublicBoards,{PublishBoard,DeleteBoard} from './topNine/PublicBoards';
import {listTemplates,sourcePage,searchSources,loadSource} from './topNine/api';
import {normalizeCandidates,candidateMatches,toggleCandidate,placeCandidate,clearSlot,swapSlots,cropRect,normalizeZoom,readShared,makeShareHash,safeMedia} from './topNine/core';
import {importFile,mediaFrame,exportPNG,downloadBlob,isVideo} from './topNine/media';
import {draftStore} from './topNine/draft';
import './topNine/topNine.css';
import "../styles/presetCardSizes.css";
const blank=()=>Array(9).fill(null);
function Photo({candidate}){const [bad,setBad]=useState(false);return bad?<span className="tn-missing">◇</span>:isVideo(candidate.src)?<video src={candidate.src} muted playsInline preload="metadata" onError={()=>setBad(true)}/>:<img src={candidate.src} alt="" loading="lazy" decoding="async" onError={()=>setBad(true)}/>;}
function CropPhoto({candidate,frame}) {
 const ref=useRef();
 useEffect(()=>{let live=true;if(!frame)return;const img=new Image();img.onload=()=>{if(!live||!ref.current)return;const ctx=ref.current.getContext('2d');ctx.clearRect(0,0,400,400);ctx.drawImage(img,...cropRect(img.naturalWidth,img.naturalHeight,candidate.zoom,candidate.x,candidate.y),0,0,400,400);};img.src=frame;return()=>{live=false;};},[candidate,frame]);
 return <canvas ref={ref} width="400" height="400" role="img" aria-label={candidate.name}/>;
}
export default function TopNinePage({publicBoard=null,publicId='',onHome}={}){
 const {lang:routeLang}=useParams(),location=useLocation();const lang=copy[routeLang]?routeLang:'en',t=copy[lang];
 const shared=useMemo(()=>publicBoard||readShared(location.hash),[publicBoard,location.hash]);
 const [sitePicker,setSitePicker]=useState(false),[pendingCup,setPendingCup]=useState(null),[galleryTick,setGalleryTick]=useState(0),[templateMore,setTemplateMore]=useState(false),[templateOffset,setTemplateOffset]=useState(0),[stage,setStage]=useState(shared?'preview':'home'),[slots,setSlots]=useState(shared?.slots||blank),[title,setTitle]=useState(shared?.title||''),[baseTitle,setBaseTitle]=useState(shared?null:''),[names,setNames]=useState(shared?.names||false);
 const [candidates,setCandidates]=useState([]),[templates,setTemplates]=useState([]),[sources,setSources]=useState([]),[query,setQuery]=useState(''),[searchedQuery,setSearchedQuery]=useState(''),[candidateQuery,setCandidateQuery]=useState(''),[limit,setLimit]=useState(36),[sourceOffset,setSourceOffset]=useState(0),[moreSources,setMoreSources]=useState(false),[searched,setSearched]=useState(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[templateError,setTemplateError]=useState(false),[templateTick,setTemplateTick]=useState(0),[focus,setFocus]=useState(null),[draft,setDraft]=useState(null),[draftError,setDraftError]=useState(false),[shareURL,setShareURL]=useState('');
 const [frames,setFrames]=useState({}),[frameRetry,setFrameRetry]=useState(0),[game,setGame]=useState(null),[history,setHistory]=useState([]),[gameCount,setGameCount]=useState('54');
 const dragItem=useRef(null),uploadTarget=useRef(null),fileRef=useRef(),poolRef=useRef(),poolListRef=useRef(),lock=useRef(false),operation=useRef(0),alive=useRef(true),draftReady=useRef(false),frameJobs=useRef(new Set());
 const [dropCell,setDropCell]=useState(null);
 useEffect(()=>{const clear=()=>setDropCell(null);window.addEventListener("drop",clear);window.addEventListener("dragend",clear);return()=>{window.removeEventListener("drop",clear);window.removeEventListener("dragend",clear);};},[]);
 const [editingId,setEditingId]=useState(publicId);
 const savedBoard=useRef(publicBoard?JSON.stringify({slots:publicBoard.slots,title:publicBoard.title,names:publicBoard.names,sourceIds:publicBoard.sourceIds||[],category:publicBoard.category||''}):null);
 const [previewNames,setPreviewNames]=useState(null);
 const [category,setCategory]=useState(publicBoard?.category||'');
 const [sourceIds,setSourceIds]=useState(publicBoard?.sourceIds||[]);
 const selectedSource=useRef(null),restoredSources=useRef(new Set()),poolWasReset=useRef(false);
 const poolPosition=useRef(null);
 function rememberPoolPosition(excludedId){
  const list=poolListRef.current;if(!list)return;
  const top=list.getBoundingClientRect().top;
  const anchor=[...list.querySelectorAll('[data-candidate-id]')].find(node=>node.dataset.candidateId!==String(excludedId)&&node.getBoundingClientRect().bottom>top);
  poolPosition.current={scrollTop:list.scrollTop,anchorId:anchor?.dataset.candidateId,offset:anchor?anchor.getBoundingClientRect().top-top:0};
 }
 useLayoutEffect(()=>{
  const position=poolPosition.current,list=poolListRef.current;poolPosition.current=null;
  if(!position||!list)return;
  const anchor=[...list.querySelectorAll('[data-candidate-id]')].find(node=>node.dataset.candidateId===position.anchorId);
  list.scrollTop=anchor?list.scrollTop+anchor.getBoundingClientRect().top-list.getBoundingClientRect().top-position.offset:position.scrollTop;
 },[slots]);
 const previousTap=useRef(null),previousSlotTap=useRef(null);
 useEffect(()=>{
  previousTap.current=null;previousSlotTap.current=null;
  if(stage!=='home' && window.scrollY)window.scrollTo({top:0,behavior:'instant'});
 },[stage]);
 const languageRef=useRef(lang);languageRef.current=lang;
 const count=slots.filter(Boolean).length;
 useEffect(()=>{setMessage('');},[lang]);
 useEffect(()=>{
  if(location.state?.contentHome!=='top-nine'||location.hash)return;
  operation.current++;lock.current=false;setBusy(false);setStage('home');setFocus(null);
  setPendingCup(null);setSitePicker(false);setGame(null);setHistory([]);setMessage('');setShareURL('');dragItem.current=null;
 },[location.key,location.hash,location.state]);
 useEffect(()=>{if(poolListRef.current)poolListRef.current.scrollTop=0;},[candidateQuery]);
 useEffect(()=>{alive.current=true;draftStore().then(d=>{if(!alive.current)return;if(d?.v===1)setDraft(d);if(publicBoard&&new URLSearchParams(location.search).get('edit')==='1')editBoard(d?.v===1?d:null);}).catch(()=>{if(alive.current&&publicBoard&&new URLSearchParams(location.search).get('edit')==='1')editBoard(null);}).finally(()=>{draftReady.current=true;});return()=>{alive.current=false;operation.current++;};},[]);
 useEffect(()=>{if(!shared)return;setSlots(shared.slots);setTitle(shared.title);setBaseTitle(null);setNames(shared.names);setStage('preview');setFocus(null);setShareURL('');},[shared]);
 useEffect(()=>{let live=true;setTemplateError(false);listTemplates().then(rows=>{if(live){setTemplates(rows);setTemplateMore(rows.length===30);}}).catch(()=>{if(live)setTemplateError(true);});return()=>{live=false;};},[templateTick]);
 useEffect(()=>{
  if(stage==='home'||stage==='choose'||!draftReady.current||shared)return;
  const timer=setTimeout(()=>draftStore({v:1,boardId:editingId,slots,title,baseTitle,names,candidates,sourceIds,category},true).catch(()=>{if(alive.current)setDraftError(true);}),600);
  return()=>clearTimeout(timer);
 },[slots,title,baseTitle,names,candidates,sourceIds,category,editingId,stage,shared]);
 useEffect(()=>{
  slots.filter(Boolean).forEach(c=>{
   if(frameJobs.current.has(c.src))return;frameJobs.current.add(c.src);
   mediaFrame(c.src).then(frame=>{if(alive.current)setFrames(prev=>({...prev,[c.src]:{frame}}));}).catch(()=>{if(alive.current)setFrames(prev=>({...prev,[c.src]:{error:true}}));});
  });
 // Already requested sources are skipped, including when only the crop changes.
 },[slots,frameRetry]);
 useEffect(()=>{setShareURL('');},[slots,title,names]);
 useEffect(()=>{
  const id=new URLSearchParams(location.search).get('template');
  if(shared||publicId||!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return;
  work(async current=>{
   const raw=await loadSource(id);
   const metadata=await loadBoardTitleSources(supabase,[{sourceIds:[id]}]);
   if(!current())return;
   const total=normalizeCandidates(raw.data).length;
   if(!total)throw new Error('EMPTY');
   selectedSource.current={...raw,id};
   setPendingCup({...raw,...metadata.find(source=>String(source.id)===id),id,candidate_count:total});
   setStage('choose');
  });
 },[location.search,shared,publicId]);

 async function work(fn){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');const op=++operation.current;try{await fn(()=>alive.current&&op===operation.current);}catch(e){if(alive.current&&op===operation.current)setMessage((copy[languageRef.current]||copy.en).error);}finally{if(alive.current&&op===operation.current){lock.current=false;setBusy(false);}}}
 function resume(){if(!draft)return;const pool=(draft.candidates||[]).slice(0,2048).filter(c=>safeMedia(c?.src));const restored=Array.isArray(draft.slots)&&draft.slots.length===9?draft.slots.map(c=>c&&safeMedia(c.src)?{...c,zoom:normalizeZoom(c.zoom),x:Math.max(0,Math.min(100,Number(c.x)||0)),y:Math.max(0,Math.min(100,Number(c.y)||0))}:null):blank();setSlots(restored);setCandidates(pool);setTitle(String(draft.title||'').slice(0,100));setBaseTitle(typeof draft.baseTitle==='string'?draft.baseTitle:null);setNames(!!draft.names);setSourceIds(draft.sourceIds||[]);setCategory(draft.category||'');setEditingId(draft.boardId||'');setStage('pick');setFocus(null);}
 function chooseSource(cup){
  setPendingCup({...cup,candidate_count:undefined});setStage('choose');
  work(async current=>{
   const raw=await loadSource(cup.id);
   if(!current())return;
   const total=normalizeCandidates(raw.data).length;
   if(!total)throw new Error('EMPTY');
   selectedSource.current={...raw,id:cup.id};
   setPendingCup({...cup,candidate_count:total});
  });
 }
 function openSource(cup,mode){setPendingCup(null);work(async current=>{const raw=String(selectedSource.current?.id)===String(cup.id)?selectedSource.current:await loadSource(cup.id);if(!current())return;const settings=await supabase.from('top_nine_template_categories').select('category').eq('source_worldcup_id',cup.id).maybeSingle();if(!current())return;setCategory(settings.data?.category||'');const pool=normalizeCandidates(raw.data);if(!pool.length)throw new Error('EMPTY');setEditingId('');savedBoard.current=null;poolWasReset.current=false;restoredSources.current=new Set([cup.id]);setSourceIds([cup.id]);setCandidates(pool);setSlots(blank());const sourceTitle=templateTitle({...raw,...cup},'nine',lang,t.nav);setTitle(sourceTitle);setBaseTitle(sourceTitle);setFocus(null);setCandidateQuery('');setLimit(36);if(mode==='game'&&pool.length>=9){setHistory([]);setGame(createGame(pool,gameCount));setStage('game');}else{setStage('pick');}setFrames({});frameJobs.current.clear();});}
 function search(e,append=false){e?.preventDefault();work(async current=>{const offset=append?sourceOffset+30:0;const rows=await searchSources(append?searchedQuery:query,offset);if(!current())return;setSources(old=>append?[...old,...rows]:rows);if(!append)setSearchedQuery(query);setSourceOffset(offset);setMoreSources(rows.length===30);setSearched(true);});}
 function pickUpload(index=null){uploadTarget.current=index;fileRef.current.click();}
 async function ingestFiles(fileList,target=null,place=true){const files=Array.from(fileList||[]);if(!files.length)return;work(async current=>{const imported=[];let failed=0;for(const file of files.slice(0,50)){try{imported.push(await importFile(file));}catch{failed++;}if(!current())return;}if(imported.length){poolWasReset.current=false;setCandidates(old=>[...old,...imported].slice(-2048));if(place)setSlots(old=>{let next=[...old];imported.forEach((c,i)=>{next=placeCandidate(next,c,i===0?target:null);});return next;});setStage('pick');setFocus(target);setLimit(36);setCandidateQuery('');}if(failed||files.length>50){const latest=copy[languageRef.current]||copy.en;setMessage(latest.error+' '+latest.uploadHelp+' (50)');}});}
 async function upload(event){const files=Array.from(event.target.files||[]);event.target.value='';const target=uploadTarget.current;uploadTarget.current=null;await ingestFiles(files,target);}
 function addSiteCandidates(items){poolWasReset.current=false;setSourceIds(old=>[...new Set([...old,...items.map(c=>c.id?.match(/^site:([0-9a-f-]{36}):/i)?.[1]).filter(Boolean)])].slice(0,20));setCandidates(old=>{const map=new Map(old.map(c=>[c.id,c]));items.forEach(c=>{if(map.size<2048&&!map.has(c.id))map.set(c.id,c);});return [...map.values()];});setCandidateQuery('');setLimit(36);setStage('pick');}
 // Clicking only focuses or removes a photo. Reordering belongs to slotDrop.
 function slotClick(i,event){
  if(stage==='preview'||busy)return;
  if(!slots[i]){previousSlotTap.current=null;setFocus(i);pickUpload(i);return;}
  if(event.detail>0&&activatedPhoto(event,previousSlotTap)){
   setSlots(old=>clearSlot(old,i));setFocus(null);return;
  }
  setFocus(i);
 }
 function dragStart(event,item){if(busy)return;if(item.kind==='candidate')rememberPoolPosition(item.candidate.id);previousSlotTap.current=null;dragItem.current=item;event.dataTransfer?.setData('text/plain','onepick-top-nine');if(event.dataTransfer)event.dataTransfer.effectAllowed='copyMove';}
 function homeGridDragOver(event){
  if(busy||!Array.from(event.dataTransfer?.types||[]).includes('Files'))return;
  event.preventDefault();event.dataTransfer.dropEffect='copy';
  if(!event.target.closest?.('.tn-cell')){
   const empty=slots.findIndex(candidate=>!candidate);
   setDropCell(empty<0?null:empty);
  }
 }
 function homeGridDrop(event){
  event.preventDefault();event.stopPropagation();setDropCell(null);
  if(!busy&&event.dataTransfer?.files?.length)ingestFiles(event.dataTransfer.files);
 }
 function slotDrop(event,index){setDropCell(null);event.preventDefault();event.stopPropagation();if(busy||!['home','pick'].includes(stage))return;if(event.dataTransfer?.files?.length){dragItem.current=null;ingestFiles(event.dataTransfer.files,index);return;}const item=dragItem.current;dragItem.current=null;if(!item)return;if(item.kind==='slot')setSlots(old=>swapSlots(old,item.index,index));else setSlots(old=>placeCandidate(old,item.candidate,index));setFocus(index);}
 function poolDrop(event){event.preventDefault();event.stopPropagation();if(busy)return;if(event.dataTransfer?.files?.length){dragItem.current=null;ingestFiles(event.dataTransfer.files,null,false);return;}const item=dragItem.current;dragItem.current=null;if(item?.kind==='slot'){const candidate=slots[item.index];if(candidate)setCandidates(old=>old.some(c=>c.id===candidate.id)?old:[...old,candidate]);setSlots(old=>clearSlot(old,item.index));setFocus(null);}}
 function adjust(key,value){setSlots(old=>old.map((c,i)=>i===focus&&c?{...c,[key]:Number(value)}:c));}
 function startGame(){if(candidates.length<9)return;if(count&&!window.confirm(t.confirmReset))return;setSlots(blank());setFocus(null);setHistory([]);setGame(createGame(candidates,gameCount));setStage('game');}
 function applyGame(next){if(next.status==='done'){setSlots(next.chosen);setStage('pick');setGame(null);setFocus(null);}else setGame(next);}
 function advanceGame(){if(!game)return;setHistory(previous=>[...previous,game]);applyGame(advanceGameState(game));}
 function moreGame(){setHistory(previous=>[...previous,game]);applyGame(chooseMore(game));}
 function fillGame(){applyGame(fillRemaining(game));}
 async function download(){work(async current=>{const cache=Object.fromEntries(Object.entries(frames).filter(([,v])=>v.frame).map(([k,v])=>[k,v.frame]));const blob=await exportPNG(slots,title,stage==='preview'?(previewNames??names):names,cache);if(current())downloadBlob(blob);});}
 async function share(){if(publicId&&slots===publicBoard?.slots&&title===publicBoard.title&&names===publicBoard.names){setShareURL(window.location.origin+'/'+lang+'/mytop9/'+publicId);return;}work(async current=>{try{const prepared=await prepareMemberSlots(slots);const hash=makeShareHash(prepared,title,names);if(current())setShareURL(window.location.origin+`/${lang}/mytop9`+hash);}catch{if(current())setMessage((copy[languageRef.current]||copy.en).localShare);}});}
 function publishedHome(boardId){
  setEditingId(boardId);savedBoard.current=JSON.stringify({slots,title,names,sourceIds,category});
  draftStore({v:1,boardId,slots,title,baseTitle,names,candidates,sourceIds,category},true).catch(()=>{});
  if(onHome){onHome();return;}
  setGalleryTick(n=>n+1);setStage('home');setFocus(null);setShareURL('');setMessage('');
  if(location.hash)window.history.replaceState(null,'',window.location.pathname+window.location.search);
  window.scrollTo({top:0,behavior:'instant'});
 }
 function editBoard(restoredDraft=draft){
  // Event handlers pass a click event; only explicit draft objects override state.
  const editDraft=restoredDraft?.v===1?restoredDraft:draft;
  setStage('pick');setFocus(null);setCandidateQuery('');setLimit(36);
  if(poolWasReset.current)return;
  const occupied=slots.filter(Boolean);
  const matchingDraft=editDraft?.candidates?.length&&(editDraft.boardId===publicId&&publicId||occupied.length&&occupied.every(c=>editDraft.candidates.some(item=>item.src===c.src)));
  const draftPool=matchingDraft?editDraft.candidates.filter(c=>safeMedia(c.src)):[];
  const ids=[...new Set([...sourceIds,...(matchingDraft?editDraft.sourceIds||[]:[])])];
  const initialPool=[...new Map([...draftPool,...candidates,...occupied].map(c=>[c.src,c])).values()].slice(0,2048);
  setCandidates(initialPool);
  const missing=ids.filter(id=>!restoredSources.current.has(id));
  if(!missing.length)return;
  work(async current=>{
   const results=await Promise.allSettled(missing.map(id=>loadSource(id)));
   if(!current())return;
   const pool=results.flatMap((result,index)=>{
    if(result.status!=='fulfilled')return [];
    restoredSources.current.add(missing[index]);
    return normalizeCandidates(result.value.data).map(c=>({...c,id:'site:'+missing[index]+':'+c.id}));
   });
   setSourceIds(ids);
   setCandidates([...new Map([...pool,...initialPool].map(c=>[c.src,c])).values()].slice(0,2048));
   if(results.some(result=>result.status==='rejected'))setMessage(t.error);
  });
 }
 function resetPool(){
  if(!window.confirm(t.resetCandidatesConfirm))return;
  poolWasReset.current=true;
  setCandidates([]);setSourceIds([]);setCandidateQuery('');setLimit(36);setFocus(null);
 }
 function reset(){if((count||candidates.length)&&!window.confirm(t.confirmReset))return;if(onHome){onHome();return;}setStage('home');setSlots(blank());setCandidates([]);setSourceIds([]);setCategory('');setEditingId('');setTitle('');setBaseTitle('');setGame(null);setFocus(null);setShareURL('');setMessage('');setDraft(null);draftStore(null,true).catch(()=>{});}
 const selectedIds=new Set(slots.filter(Boolean).map(candidate=>candidate.id));
 const visibleCandidates=candidates.filter(c=>candidateMatches(c,candidateQuery)).sort((a,b)=>Number(selectedIds.has(b.id))-Number(selectedIds.has(a.id)));
 const showNames=stage==='preview'?(previewNames??names):names;
 const displayTitle=localizedBoardTitle({title,sourceIds},publicBoard?.titleSources,lang);
 const publicDescription=boardDescription({title,slots,sourceIds,titleSources:publicBoard?.titleSources,authorNickname:publicBoard?.authorNickname},lang);
 const changedSinceSave=savedBoard.current!==JSON.stringify({slots,title,names,sourceIds,category});
 const ready=count>0&&slots.every(c=>!c||frames[c.src]?.frame);
 return <main className="top-nine" dir={lang==='ar'?'rtl':'ltr'}>
 <Seo title={`${publicId?displayTitle:t.title} | One Pick Game`} description={publicId?publicDescription.replace(/\n/g,' '):t.subtitle} lang={lang} slug={publicId?'mytop9/'+publicId:'mytop9'} indexable={publicId?stage==='preview':!location.hash}/>
 {!publicId&&<header className="tn-heading"><div className="tn-hero-icon"><TopNineIcon size={52}/></div><h1>{t.title}</h1><p>{(t.introLines||[t.subtitle]).map((line,i)=><span className="tn-description-line" key={i}>{line}</span>)}</p><ContentLanguageSelect /></header>}
 <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.svg" multiple hidden onChange={upload}/>
 {message&&<div role="alert" className="tn-message tn-share-notice"><p>{message}</p>{message===t.localShare&&<><p>{t.memberUploadHelp}</p><a href={`/${lang}/login`}>{t.memberAccess.split(' / ')[0]}</a>{' · '}<a href={`/${lang}/signup`}>{t.memberAccess.split(' / ')[1]||t.memberAccess}</a></>}</div>}
 {draftError&&<p role="status" className="tn-message">{t.draftError}</p>}
 {busy&&<p role="status" className="tn-message">{t.loading}</p>}
 {stage==='home'?<>
 <div className={`tn-home-grid tn-grid ${dropCell!==null?'tn-drop-active':''}`} dir="ltr" onDragOver={homeGridDragOver} onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget))setDropCell(null);}} onDrop={homeGridDrop}>{slots.map((c,i)=><div key={i} className={`tn-cell ${i===4?'tn-onepick':''} ${dropCell===i?'tn-drop-target':''}`}><button disabled={busy} aria-label={`${i+1}: ${c?.name||'+'}`} onClick={()=>{setFocus(i);pickUpload(i);}} onDragEnter={e=>{if(!busy&&Array.from(e.dataTransfer?.types||[]).includes('Files')){e.preventDefault();setDropCell(i);}}} onDragOver={e=>{if(!busy&&Array.from(e.dataTransfer?.types||[]).includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';setDropCell(i);}}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDropCell(current=>current===i?null:current);}} onDrop={e=>slotDrop(e,i)}>{dropCell===i&&<span className="tn-drop-label" aria-hidden="true"><span>↓</span>{t.upload}</span>}{c&&frames[c.src]?.frame?<CropPhoto candidate={c} frame={frames[c.src].frame}/>:<span>{i===4?'One Pick': '+'}</span>}</button></div>)}</div>
 <div className="tn-actions"><button className="tn-primary tn-upload-button" disabled={busy} onClick={()=>pickUpload()}>{t.upload}</button><button className="tn-site-import" disabled={busy} onClick={()=>setSitePicker(true)}>{lang==='ko'?'사이트 내에서 골라오기':'Choose from the site'}</button>{draft&&<button disabled={busy} onClick={resume}>{t.restore}</button>}</div><p className="tn-muted">{t.uploadHelp}</p>
 <form className="tn-search" onSubmit={search}><input aria-label={t.search} placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)}/><button disabled={busy} type="submit">{lang==='ko'?'검색':'Search'}</button></form>
 <h2>{searched?t.search:t.templates}</h2>
 {templateError&&!searched&&<div className="tn-message">{t.error} <button onClick={()=>setTemplateTick(v=>v+1)}>{t.retry}</button></div>}
 <div className="tn-templates tn-picture-templates">{(searched?sources:templates).map(c=><button key={c.id} disabled={busy} onClick={()=>chooseSource(c)}>{safeMedia(c.thumbnail)?<Photo candidate={{src:safeMedia(c.thumbnail)}}/>:<span className="tn-card-placeholder" aria-hidden="true">▦</span>}<strong title={templateTitle(c,'nine',lang,t.nav)}><span className="tn-template-title">{templateTitle(c,'nine',lang,t.nav)}</span></strong></button>)}</div>
 {searched&&!sources.length&&<p>{t.empty}</p>}
 {searched?moreSources&&<button disabled={busy} onClick={()=>search(null,true)}>{t.more}</button>:templateMore&&<button disabled={busy} onClick={()=>work(async current=>{const offset=templateOffset+30;const rows=await sourcePage('',offset,true);if(current()){setTemplates(old=>[...old,...rows]);setTemplateOffset(offset);setTemplateMore(rows.length===30);}})}>{t.more}</button>}
 <PublicBoards lang={lang} tick={galleryTick}/>
 </>:stage==='choose'?<section className="tn-mode-choice"><h2>{templateTitle(pendingCup,'nine',lang,t.nav)}</h2><div className="tn-actions"><button className="tn-primary" disabled={busy} onClick={()=>openSource(pendingCup,'direct')}>{lang==='ko'?'직접 고르기':t.direct}</button><div className="tn-game-start"><button disabled={busy} onClick={()=>openSource(pendingCup,'game')}>{lang==='ko'?'게임으로 고르기':t.game}</button><GameCountSelect lang={lang} value={gameCount} onChange={setGameCount} total={pendingCup?.candidate_count} disabled={busy}/></div></div><button disabled={busy} onClick={()=>{setPendingCup(null);setStage('home');}}>{t.back}</button></section>:stage==='game'?<TopNineGame game={game} lang={lang} text={t} Photo={Photo} onChange={setGame} onNext={advanceGame} onBack={()=>{setGame(history[history.length-1]);setHistory(previous=>previous.slice(0,-1));}} onMore={moreGame} onFill={fillGame} canBack={history.length>0}/>:<>
 <div className="tn-actions"><button disabled={busy} onClick={()=>{if(onHome){onHome();return;}setStage('home');setFocus(null);setMessage('');}}>{lang==='ko'?'홈으로':'Home'}</button><button disabled={busy} onClick={reset}>{t.reset}</button>{stage==='pick'&&<><button className="tn-upload-button" disabled={busy} onClick={()=>pickUpload()}>{t.upload}</button><button className="tn-site-import" disabled={busy} onClick={()=>setSitePicker(true)}>{lang==='ko'?'사이트 내에서 골라오기':'Choose from the site'}</button></>}{stage==='preview'&&<><button disabled={busy} onClick={editBoard}>{t.edit}</button><button type="button" aria-pressed={showNames} onClick={()=>setPreviewNames(!showNames)}>{showNames?t.hideCandidateNames:t.showCandidateNames}</button></>}</div>
 {stage==='preview'&&publicId&&<div className="tn-public-intro"><h1 className="tn-result-title">{displayTitle}</h1><p className="tn-public-description">{publicDescription}</p><div className="tn-actions">{(publicBoard?.titleSources||[]).filter(source=>sourceIds.includes(source.id)).map(source=><a className="tn-reuse-template" key={source.id} href={'/'+lang+'/mytop9?template='+encodeURIComponent(source.id)}>{t.reuseTemplate}{sourceIds.length>1?' — '+templateTitle(source,'nine',lang):''}</a>)}</div></div>}
 <div className={`tn-editor ${stage==='preview'?'tn-preview':''}`}>
 <section className="tn-board-panel" aria-label={t.nav} onDragOver={e=>{if(stage==='pick')e.preventDefault();}} onDrop={e=>{if(stage!=='pick')return;e.preventDefault();if(e.dataTransfer?.files?.length)ingestFiles(e.dataTransfer.files);}}>
 {stage==='preview'&&!publicId&&title&&<h2 className="tn-result-title">{displayTitle}</h2>}
 <div className="tn-grid" dir="ltr">{slots.map((c,i)=><div key={i} className={`tn-cell ${i===4?'tn-onepick':''} ${focus===i&&stage==='pick'?'tn-focused':''}`}>
 <button type="button" disabled={busy||stage==='preview'} aria-label={`${i+1}: ${c?.name|| (i===4?'One Pick':'+')}`} aria-pressed={stage==='pick'?focus===i:undefined} onClick={event=>slotClick(i,event)} draggable={stage==='pick'&&!!c&&!busy} onDragStart={e=>dragStart(e,{kind:'slot',index:i})} onDragEnd={()=>{dragItem.current=null;}} onDragOver={e=>{if(stage==='pick'||stage==='home')e.preventDefault();}} onDrop={e=>slotDrop(e,i)}>
 {c?frames[c.src]?.frame?<CropPhoto candidate={c} frame={frames[c.src].frame}/>:<span>{frames[c.src]?.error?'◇':t.loading}</span>:<span>{i===4?'One Pick':'+'}</span>}</button>
 {c&&showNames&&(stage==='pick'?<input className="tn-name-input" type="text" value={c.name||''} maxLength={150} disabled={busy} aria-label={`${t.edit}: ${c.name||i+1}`} title={t.edit} onFocus={()=>setFocus(i)} onChange={event=>{const name=event.target.value;setSlots(previous=>previous.map((item,index)=>index===i?{...item,name}:item));}}/>:<span className="tn-name">{c.name}</span>)}
 {c&&frames[c.src]?.error&&<button className="tn-retry" onClick={()=>{frameJobs.current.delete(c.src);setFrames(f=>({...f,[c.src]:null}));setFrameRetry(v=>v+1);}}>{t.retry}</button>}
 </div>)}</div>
 {stage==='pick'?<><div className="tn-drag-help"><p>{t.boardPhotoHelp}</p>{(lang==='ko'?['빈칸을 누르면 사진을 등록할 수 있어요.','등록된 후보는 오른쪽 후보칸에서 드래그하여 넣을 수 있어요.','사진을 드래그해서 칸의 위치를 바꿀 수 있어요.']:['Tap an empty cell to add a photo.','Drag candidates from the list into any cell.','Drag photos to swap cells.']).map(line=><p key={line}>{line}</p>)}</div>
 {focus!==null&&slots[focus]&&<fieldset disabled={busy} className="tn-crop"><legend title={slots[focus].name||'One Pick'}>{slots[focus].name||'One Pick'}</legend>{[['zoom',t.zoom,0,3,.05],['x',t.horizontal,0,100,1],['y',t.vertical,0,100,1]].map(([key,label,min,max,step])=><label key={key}>{label}<input type="range" min={min} max={max} step={step} value={slots[focus][key]??(key==='zoom'?1:50)} onChange={e=>adjust(key,e.target.value)}/></label>)}<button onClick={()=>{setSlots(old=>old.map((c,i)=>i===focus?null:c));setFocus(null);}}>{t.remove}</button></fieldset>}
 <label className="tn-title-field">{lang==='ko'?'구절판 이름 (선택)':t.titleLabel}<input value={title} maxLength={100} disabled={busy} onChange={e=>setTitle(e.target.value)}/></label><label className="tn-category-field">{lang==='ko'?'카테고리':'Category'}<select aria-label={lang==='ko'?'구절판 카테고리':'Top 9 category'} value={category} disabled={busy} onChange={e=>setCategory(e.target.value)}><option value="">—</option>{Object.entries(categoryLabels[lang]||categoryLabels.en).filter(([key])=>key!=='all').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label className="tn-toggle"><input type="checkbox" checked={names} disabled={busy} onChange={e=>setNames(e.target.checked)}/>{t.names}</label><p className="tn-caption-help">{t.editNameHelp}</p>
 </>:<p className="tn-credit">OnePickGame.com</p>}
 {stage==='pick'&&<div className="tn-actions tn-sticky tn-board-complete"><strong aria-live="polite">{count} / 9</strong><button disabled={busy||!count} onClick={()=>{setStage('preview');setFocus(null);}}>{t.privateView}</button><PublishBoard existingId={editingId} sourceIds={sourceIds} category={category} slots={slots} title={title} autoTitle={!title.trim()||(baseTitle!==null&&title.trim()===baseTitle.trim())} names={names} lang={lang} disabled={busy||!count||!!editingId&&!changedSinceSave} onPublished={publishedHome}/></div>}
 </section>

 {stage==='pick'&&<section className="tn-pool" ref={poolRef} onDragOver={e=>e.preventDefault()} onDrop={poolDrop}><h2>{t.choose}</h2><div className="tn-pool-reset"><button type="button" disabled={busy||!candidates.length} onClick={resetPool}>{t.resetCandidates}</button></div><p className="tn-photo-help">{t.doublePhoto}</p><input type="search" aria-label={t.candidateSearch} placeholder={t.candidateSearch} value={candidateQuery} onChange={e=>{setCandidateQuery(e.target.value);setLimit(36);}}/>
 <div className="tn-pool-scroll" style={{overflowAnchor:'none'}} ref={poolListRef} role="region" aria-label={t.choose} tabIndex={0}>
 <div className="tn-candidates">{visibleCandidates.slice(0,limit).map(c=>{const checked=slots.some(s=>s?.id===c.id);return <button type="button" key={c.id} data-candidate-id={c.id} className={checked?'selected':''} aria-pressed={checked} disabled={busy} draggable={!busy} onDragStart={e=>dragStart(e,{kind:'candidate',candidate:c})} onDragEnd={()=>{dragItem.current=null;}} onPointerDown={e=>{previousTap.pointerType=e.pointerType;rememberPoolPosition(c.id);}} onClick={e=>{if(activatedPhoto(e,previousTap,true)){if(!poolPosition.current)rememberPoolPosition(c.id);setSlots(old=>toggleCandidate(old,c));setFocus(null);}}}><Photo candidate={c}/><span>{checked?'✓ ':''}{c.name}</span></button>;})}</div>
 {!visibleCandidates.length&&<p>{t.empty}</p>}{visibleCandidates.length>limit&&<button onClick={()=>setLimit(n=>n+36)}>{t.more}</button>}
 </div>
 <div className="tn-pool-game"><div className="tn-game-start"><button className="tn-primary" disabled={busy||candidates.length<9} onClick={startGame}>{t.game}</button><GameCountSelect lang={lang} value={gameCount} onChange={setGameCount} total={candidates.length} disabled={busy}/></div></div>
 </section>}
 </div>
 {stage==='preview'&&<p className="tn-share-notice">{t.memberUploadHelp}</p>}
 {stage==='preview'&&<div className="tn-actions tn-sticky"><strong aria-live="polite">{count} / 9</strong><button disabled={busy} onClick={editBoard}>{t.edit}</button>{publicId&&<DeleteBoard id={publicId} lang={lang} onDeleted={onHome}/>}<button className="tn-primary" disabled={busy||!ready} onClick={download}>↓ {t.download}</button><button disabled={busy||!ready} onClick={share}>{t.share}</button>{!editingId&&!shared&&<PublishBoard existingId={editingId} sourceIds={sourceIds} category={category} slots={slots} title={title} autoTitle={!title.trim()||(baseTitle!==null&&title.trim()===baseTitle.trim())} names={names} lang={lang} disabled={busy||!count||!!editingId&&!changedSinceSave} onPublished={publishedHome}/>}</div>}

 {shareURL&&<label className="tn-share">{t.share}<textarea readOnly value={shareURL} onFocus={e=>e.target.select()} rows="3"/></label>}
 </>}
 {publicId&&stage==='preview'&&<CommentBox cupId={publicId} kind="top-nine"/>}
 {sitePicker&&<SiteCandidatePicker lang={lang} onAdd={addSiteCandidates} onClose={()=>setSitePicker(false)}/>}
 </main>;
}
