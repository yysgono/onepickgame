import {loadPlayCounts,recordModePlay} from "./playCounts";
import {saveCandidateSet,loadCandidateSet,deleteCandidateSet,rowsFromNames} from "./savedCandidates";
import savedCandidatesCopy from "./savedCandidatesCopy.json";
import {encodeCandidates,decodeCandidates,attachSourceImages} from './sharedCandidates';
import {downloadResultImage} from './resultImage';
import React, {useEffect,useMemo,useRef,useState} from 'react';
import {Link,useLocation,useNavigate,useParams} from 'react-router-dom';
import Seo from '../../seo/Seo';
import NotFoundPage from '../NotFoundPage';
import {getCopy,LANGUAGES,MODES} from './copy';
import {activeCandidates,createDraw,normalizeCandidates,randomInt} from '../../utils/randomPickCore';
import * as api from './api';
import PinballStage from './PinballStage';
import ToolArt from './ToolArt';
import {rememberCandidates,previousCandidates,previousSourceCup} from './previousCandidates';
import WheelStage from './WheelStage';
import LadderGame from './LadderGame';
import {CardStage,DiceStage,OrderRace} from './DrawStages';
import LotteryStage from './LotteryStage';
import {probabilities,numericCandidates,pickMany,makeBoxDeck} from './gameRules';
import './randomPick.css';
import {constrainedTeams} from './teamRules';
import TeamConditions from './TeamConditions';
import {useTranslation} from 'react-i18next';
function CandidateImage({row}) {
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[row.image]);
  return row.image&&!failed?<img src={row.image} alt="" loading="lazy" onError={()=>setFailed(true)}/>:<span className="rp-name-image" aria-hidden="true">{row.name||'?'}</span>;
}
function ImportDialog({copy,onClose,onImport}) {
  const {t}=useTranslation();
  const [category,setCategory]=useState('');
  const [pending,setPending]=useState(null),[checked,setChecked]=useState(new Set());
  const [search,setSearch]=useState(''),[offset,setOffset]=useState(0),[rows,setRows]=useState([]),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[importing,setImporting]=useState(false);
  const input=useRef(null),importController=useRef(null),dialog=useRef(null);
  useEffect(()=>{const previous=document.activeElement;input.current?.focus();function key(e){if(e.key==='Escape')onClose();if(e.key==='Tab'){const els=Array.from(dialog.current?.querySelectorAll('button:not(:disabled),input:not(:disabled)')||[]);const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);importController.current?.abort();previous?.focus();};},[onClose]);
  useEffect(()=>{const controller=new AbortController();setBusy(true);setError('');const timer=setTimeout(()=>{api.searchCups(search,offset,controller.signal,category,!category&&!search.trim()).then(data=>{if(controller.signal.aborted)return;setRows(old=>offset?[...old,...data.slice(0,12)]:data.slice(0,12));setMore(data.length>12);}).catch(()=>{if(!controller.signal.aborted)setError(copy.error);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});},250);return()=>{clearTimeout(timer);controller.abort();};},[search,offset,category,retry,copy.error]);
  async function choose(id){if(importing)return;setImporting(true);setError('');const controller=new AbortController();importController.current=controller;try{const result=await api.importCup(id,controller.signal);if(!controller.signal.aborted){if(!result.rows.length){setError(copy.empty);return;}setPending(result);setChecked(new Set(result.rows.map(row=>row.id)));}}catch{if(!controller.signal.aborted)setError(copy.error);}finally{if(!controller.signal.aborted)setImporting(false);}}
  if(pending)return <div className="rp-overlay"><section className="rp-dialog" ref={dialog} role="dialog" aria-modal="true" aria-label={copy.participants}><div className="rp-flex"><h2>{copy.participants} ({checked.size} / {pending.rows.length})</h2><button onClick={onClose} aria-label="Close">×</button></div><div className="rp-actions"><button onClick={()=>setChecked(new Set(pending.rows.map(row=>row.id)))}>{copy.selectAll}</button><button onClick={()=>setChecked(new Set())}>{copy.clearSelection}</button><button onClick={()=>setPending(null)}>← {copy.importBack}</button></div><button className="rp-primary rp-import-confirm" disabled={!checked.size} onClick={()=>onImport({...pending,rows:pending.rows.filter(row=>checked.has(row.id))})}>{copy.import} ({checked.size})</button><div className="rp-import-list">{pending.rows.map(row=><label className="rp-import-choice" key={row.id}><input type="checkbox" checked={checked.has(row.id)} onChange={e=>{const enabled=e.target.checked;setChecked(old=>{const next=new Set(old);enabled?next.add(row.id):next.delete(row.id);return next;});}}/>{row.name}</label>)}</div></section></div>;
  return <div className="rp-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section className="rp-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="rp-import-title"><div className="rp-flex"><h2 id="rp-import-title">{copy.import}</h2><button onClick={onClose} aria-label="Close">×</button></div><div className="rp-import-categories"><button aria-pressed={!category&&!search.trim()} onClick={()=>{setCategory('');setSearch('');setOffset(0);setRows([]);setRetry(v=>v+1);}}>{copy.recommended}</button>{['korea','anime_manga','person','game','sports','music','movie_drama','food','travel','brands','etc'].map(key=><button key={key} aria-pressed={category===key&&!search.trim()} onClick={()=>{setCategory(key);setSearch('');setOffset(0);setRows([]);setRetry(v=>v+1);}}>{t(`category_${key}`)}</button>)}</div><input ref={input} aria-label={copy.search} placeholder={copy.search} value={search} onChange={e=>{setSearch(e.target.value);setOffset(0);setRows([]);}} maxLength={100}/>{error&&<p role="alert">{error} <button onClick={()=>setRetry(v=>v+1)}>↻</button></p>}<div className="rp-import-list">{rows.map(row=>{let titles=row.title_translations;if(typeof titles==='string'){try{titles=JSON.parse(titles);}catch{titles={};}}return <button disabled={busy||importing} key={row.id} onClick={()=>choose(row.id)}>{titles?.[copy.lang]||row.title}</button>;})}</div>{(busy||importing)&&<p role="status">{copy.loading}</p>}{!busy&&!error&&!rows.length&&<p>{copy.empty}</p>}{more&&!error&&<button disabled={busy||importing} onClick={()=>setOffset(v=>v+12)}>{copy.more}</button>}</section></div>;
}
export default function RandomPickPage(props){
 const {mode}=useParams();
 return <RandomPickContent key={mode||'home'} {...props}/>;
}
function RandomPickContent({user}) {
 const {lang='en',mode}=useParams(),copy=getCopy(lang),navigate=useNavigate(),location=useLocation();
 const homeEditedRef=useRef(false);
 const [savedPreview,setSavedPreview]=useState([]),[playCounts,setPlayCounts]=useState(null);
 const [savedSourceId,setSavedSourceId]=useState(null),[savedEditing,setSavedEditing]=useState(false),[savedDraft,setSavedDraft]=useState([]);
 const savedCopy=savedCandidatesCopy[lang]||savedCandidatesCopy.en;
 const [candidateSaving,setCandidateSaving]=useState(false),[savedAvailable,setSavedAvailable]=useState(false),[homeNames,setHomeNames]=useState('');
 const [sourceCupId,setSourceCupId]=useState(null);
 const [shareLink,setShareLink]=useState('');
 const [sharing,setSharing]=useState(false),[savingImage,setSavingImage]=useState(false);
 const sourceCupRef=useRef(null);sourceCupRef.current=sourceCupId;
 const [setupCount,setSetupCount]=useState(6),[teamRules,setTeamRules]=useState([]);
 const [rows,setRows]=useState([]),[newName,setNewName]=useState(''),[bulk,setBulk]=useState('');
 const [draw,setDraw]=useState(null),[done,setDone]=useState(false),[fast,setFast]=useState(false),[stop,setStop]=useState(false);
 const [message,setMessage]=useState(''),[showImport,setShowImport]=useState(false),[settingsOpen,setSettingsOpen]=useState(true);
 const [groups,setGroups]=useState(2),[pickCount,setPickCount]=useState(1),[rangeFrom,setRangeFrom]=useState(1),[rangeTo,setRangeTo]=useState(45),[diceCount,setDiceCount]=useState(1),[ladderCount,setLadderCount]=useState(6),[ladderBusy,setLadderBusy]=useState(false),[weights,setWeights]=useState({}),[boxes,setBoxes]=useState({}),[boxCount,setBoxCount]=useState(10);
 const [templates,setTemplates]=useState([]),[templatesError,setTemplatesError]=useState(false),[refresh,setRefresh]=useState(0),[operator,setOperator]=useState(false),[title,setTitle]=useState(''),[templateId,setTemplateId]=useState(null),[saving,setSaving]=useState(false),[loadingTemplate,setLoadingTemplate]=useState(false);
 const playRef=useRef(null),editorRef=useRef(null),rowsRef=useRef([]),counter=useRef(0),lock=useRef(false),alive=useRef(true),drawRef=useRef(null),boxLock=useRef(false),boxDeck=useRef(null);
 const templateParam=new URLSearchParams(location.search).get('template');
 const presetParam=new URLSearchParams(location.search).get('preset');
 const contextRef=useRef('');contextRef.current=`${mode}:${templateParam}:${user?.id||''}`;
 rowsRef.current=rows;drawRef.current=draw;
 const selected=useMemo(()=>activeCandidates(rows),[rows]),distribution=useMemo(()=>probabilities(rows,weights),[rows,weights]);
 const running=Boolean(draw&&!done),locked=running||ladderBusy||loadingTemplate;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{setSetupCount(6);setTeamRules([]);setSourceCupId(null);setRows([]);setNewName('');setBulk('');setTitle('');setGroups(2);setDraw(null);setDone(false);setFast(false);setStop(false);setWeights({});setBoxes({});boxDeck.current=null;setBoxCount(10);setLadderCount(6);setLadderBusy(false);setPickCount(1);setRangeFrom(1);setRangeTo(45);setDiceCount(1);setSettingsOpen(true);lock.current=false;setMessage('');setShowImport(false);setSaving(false);return()=>{if(mode)rememberCandidates(rowsRef.current,sourceCupRef.current);};},[mode]);
 useEffect(()=>{let live=true;loadCandidateSet().then(saved=>{if(!live)return;setSavedAvailable(Boolean(saved?.rows.length));setSavedPreview(saved?.rows||[]);setSavedSourceId(saved?.sourceCupId||null);if(!mode&&saved&&!homeEditedRef.current){setRows(saved.rows);setHomeNames(saved.rows.map(row=>row.name).join('\n'));setSourceCupId(saved.sourceCupId);}}).catch(()=>{if(live)setSavedAvailable(false);});return()=>{live=false;};},[mode]);
 useEffect(()=>{if(mode)return;let live=true;loadPlayCounts().then(counts=>{if(live)setPlayCounts(counts);}).catch(()=>{if(live)setPlayCounts(null);});return()=>{live=false;};},[mode]);
 useEffect(()=>{if(mode==='pirate'||mode==='slots')navigate(`/${lang}/random-pick/${mode==='slots'?'cards':'dice'}`,{replace:true});},[mode,lang,navigate]);
 useEffect(()=>{let live=true;setOperator(false);if(user?.id)api.checkOperator().then(yes=>{if(live)setOperator(yes);});return()=>{live=false;};},[user?.id]);
 useEffect(()=>{const controller=new AbortController();api.loadTemplates(controller.signal).then(data=>{if(!controller.signal.aborted){setTemplates(data);setTemplatesError(false);}}).catch(()=>{if(!controller.signal.aborted)setTemplatesError(true);});return()=>controller.abort();},[refresh]);
 useEffect(()=>{const controller=new AbortController();setTemplateId(null);setSourceCupId(null);if(!templateParam){setLoadingTemplate(false);return()=>controller.abort();}setLoadingTemplate(true);setDraw(null);setDone(false);lock.current=false;api.loadTemplate(templateParam,controller.signal).then(data=>{if(controller.signal.aborted)return;if(!MODES.includes(data.mode))throw new Error('mode');if(data.mode!==mode){navigate(`/${lang}/random-pick/${data.mode}?template=${encodeURIComponent(data.id)}`,{replace:true});return;}const loaded=normalizeCandidates(data.candidates,`template:${data.id}`);setRows(loaded);resetBoxes();setTitle(data.title);const options=data.settings||{};setTeamRules((Array.isArray(options.teamRules)?options.teamRules:[]).slice(0,100).flatMap(r=>loaded[r.a]&&loaded[r.b]&&['apart','together'].includes(r.type)?[{a:loaded[r.a].id,b:loaded[r.b].id,type:r.type}]:[]));setGroups(Math.max(2,Math.min(20,Number(options.groups)||2)));setDiceCount(Math.max(1,Math.min(3,Number(options.diceCount)||1)));setPickCount(Math.max(1,Math.min(loaded.length||1,Number(options.pickCount)||1)));setLadderCount(Math.max(2,Math.min(20,Number(options.ladderCount)||6)));setBoxCount(Math.max(1,Math.min(200,Number(options.boxCount)||10)));setWeights(Object.fromEntries(loaded.flatMap((r,i)=>Number.isFinite(options.weights?.[i])?[[r.id,options.weights[i]]]:[])));setTemplateId(data.id);}).catch(()=>{if(!controller.signal.aborted)setMessage(copy.error);}).finally(()=>{if(!controller.signal.aborted)setLoadingTemplate(false);});return()=>controller.abort();},[templateParam,mode,lang,navigate,copy.error]);
 const shareParam=new URLSearchParams(location.hash.slice(1)).get('candidates');
 useEffect(()=>{
  if(!shareParam||templateParam||!mode)return;
  const controller=new AbortController();setLoadingTemplate(true);
  (async()=>{const shared=await decodeCandidates(shareParam);let next=shared.rows;
   if(shared.sourceCupId&&!['teams','order','ladder','dice'].includes(mode)&&next.some(row=>row.wantsImage)){
    try{const original=await api.importCup(shared.sourceCupId,controller.signal);next=attachSourceImages(next,original.rows);}catch(error){if(controller.signal.aborted)return;}
   }
   if(controller.signal.aborted)return;setRows(next);setSourceCupId(shared.sourceCupId);setLadderCount(Math.min(20,Math.max(2,next.length)));setBoxCount(Math.max(1,next.length));setDraw(null);setDone(false);
  })().catch(()=>{if(!controller.signal.aborted)setMessage(copy.error);}).finally(()=>{if(!controller.signal.aborted)setLoadingTemplate(false);});
  return()=>controller.abort();
 },[shareParam,templateParam,mode,copy.error]);
 useEffect(()=>{
  if(!presetParam||templateParam||shareParam||mode!=='cards')return;
  const c=new AbortController();setLoadingTemplate(true);
  api.loadFeaturedOne(presetParam,c.signal).then(data=>{if(c.signal.aborted)return;setRows(normalizeCandidates(data.candidates,'featured:'+data.slot));setSourceCupId(data.source_cup_id||null);setTitle(data.title_translations?.[lang]||data.title||copy.featuredTitles[['movie','anime','food'].indexOf(data.slot)]);setDraw(null);setDone(false);}).catch(()=>{if(!c.signal.aborted)setMessage(copy.error);}).finally(()=>{if(!c.signal.aborted)setLoadingTemplate(false);});
  return()=>c.abort();
 },[presetParam,templateParam,shareParam,mode,lang,copy]);
 const closeImport=React.useCallback(()=>setShowImport(false),[]);
 function reset(){setShareLink('');lock.current=false;drawRef.current=null;setDraw(null);setDone(false);setFast(false);setStop(false);setMessage('');}
 function changeRows(value){setRows(value);reset();setBoxes({});boxDeck.current=null;}
 function replaceRows(result){if((rows.length||(!mode&&homeNames.trim()))&&!window.confirm(copy.confirmReplace))return;if(!mode)homeEditedRef.current=true;setTeamRules([]);changeRows(result.rows);if(!mode)setHomeNames(result.rows.map(row=>row.name).join("\n"));setSourceCupId(result.sourceCupId||null);setWeights({});setShowImport(false);setMessage(result.truncated?copy.limit:'');}
 function prepare(){const maximum=mode==='ladder'?20:200;const count=Math.trunc(Number(setupCount));if(!Number.isFinite(count)||count<2||count>maximum)return;replaceRows({rows:Array.from({length:count},(_,i)=>({id:`manual:${++counter.current}`,name:`${copy.name} ${i+1}`,image:'',enabled:true}))});if(mode==='ladder')setLadderCount(count);}
 useEffect(()=>{if(mode==='ladder')setLadderCount(old=>Math.max(old,Math.min(20,selected.length)));},[mode,selected.length]);
 function add(){const name=newName.trim();if(!name)return;if(rows.length>=200){setMessage(copy.limit);return;}changeRows(old=>[...old,{id:`manual:${++counter.current}`,name:name.slice(0,120),image:'',enabled:true}]);setNewName('');}
 function addBulk(){const names=bulk.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!names.length)return;if(rows.length+names.length>200){setMessage(copy.limit);return;}changeRows(old=>[...old,...names.map(name=>({id:`manual:${++counter.current}`,name:name.slice(0,120),image:'',enabled:true}))]);setBulk('');}
 async function restoreSaved(){if(locked||candidateSaving)return;setCandidateSaving(true);try{const saved=await loadCandidateSet();if(!alive.current)return;if(!saved){setMessage(savedCopy[4]);setSavedAvailable(false);return;}replaceRows(saved);}catch{if(alive.current)setMessage(savedCopy[5]);}finally{if(alive.current)setCandidateSaving(false);}}
 async function saveHomeCandidates(){if(candidateSaving)return;const names=homeNames.split(/\r?\n/).map(value=>value.trim()).filter(Boolean);if(names.length>200||names.some(name=>name.length>120)){setMessage(copy.limit);return;}const next=rowsFromNames(homeNames,rows);if(!next.length){setMessage(savedCopy[4]);return;}setCandidateSaving(true);try{await saveCandidateSet(next,sourceCupId);if(!alive.current)return;setRows(next);setSavedPreview(next);setSavedSourceId(sourceCupId);setSavedEditing(false);setSavedAvailable(true);setMessage(savedCopy[3]);}catch{if(alive.current)setMessage(savedCopy[5]);}finally{if(alive.current)setCandidateSaving(false);}}
 function editSavedCandidates(){setSavedDraft(savedPreview.map(row=>({...row})));setSavedEditing(true);}
 async function saveEditedCandidates(){if(candidateSaving)return;if(!savedDraft.length){await deleteSavedCandidates();return;}if(savedDraft.some(row=>!row.name.trim()||row.name.trim().length>120)){setMessage(copy.name);return;}setCandidateSaving(true);try{const saved=await saveCandidateSet(savedDraft,savedSourceId);if(!alive.current)return;homeEditedRef.current=true;setRows(saved.rows);setSourceCupId(saved.sourceCupId);setHomeNames(saved.rows.map(row=>row.name).join('\n'));setSavedPreview(saved.rows);setSavedAvailable(true);setSavedEditing(false);setMessage(savedCopy[3]);}catch{if(alive.current)setMessage(savedCopy[5]);}finally{if(alive.current)setCandidateSaving(false);}}
 async function deleteSavedCandidates(){if(candidateSaving||!window.confirm(savedCopy[11]))return;setCandidateSaving(true);try{await deleteCandidateSet();if(!alive.current)return;homeEditedRef.current=true;setSavedPreview([]);setSavedAvailable(false);setSavedSourceId(null);setSavedEditing(false);setRows([]);setHomeNames('');setSourceCupId(null);setMessage(savedCopy[12]);}catch{if(alive.current)setMessage(savedCopy[5]);}finally{if(alive.current)setCandidateSaving(false);}}
 function restore(){const previous=previousCandidates();if(previous.length)replaceRows({sourceCupId:previousSourceCup(),rows:normalizeCandidates(previous,`restored:${++counter.current}`)});}
 function generateNumbers(){try{replaceRows({rows:numericCandidates(rangeFrom,rangeTo)});}catch{setMessage(copy.rangeError);}}
 function finish(result,token){if(!alive.current||drawRef.current?.token!==token)return;setDraw(previous=>previous?.token===token?{...previous,...result}:previous);setDone(true);lock.current=false;}
 function raceError(){reset();setMessage(copy.error);}
 function start(){if(lock.current||loadingTemplate||candidateSaving)return;const minimum=mode==='dice'?0:mode==='lotto'?1:2;if(selected.length<minimum){setMessage(copy.minimum);return;}if(mode==='wheel'&&!distribution.valid){setMessage(copy.weightError);return;}
  try{const token=++counter.current;let next;
   if(mode==='wheel')next={mode,token,pool:selected,winner:null};
   else if(mode==='order')next={mode,token,pool:selected,seed:randomInt(0x100000000),ordered:[],winner:null};
   else if(mode==='dice')next={mode,token,faces:[]};
   else if(mode==='lotto'){const winners=pickMany(selected,pickCount);next={mode,token,pool:selected,winners,winner:winners[0]};}
   else next={...createDraw(mode,rows,groups),token};
   if(mode==='teams'&&teamRules.length)next.groups=constrainedTeams(selected,groups,teamRules);
   lock.current=true;drawRef.current=next;setDraw(next);setDone(mode==='teams');setStop(false);setFast(false);setMessage('');void recordModePlay(mode);if(mode==='teams'){lock.current=false;setSettingsOpen(false);}
  }catch(error){setMessage(error.message==='TEAM_CONFLICT'?copy.teamConflict:error.message==='TEAM_LIMIT'?copy.teamLimit:mode==='lotto'?copy.countError:copy.error);}
 }
 function resetBoxes(){boxDeck.current=null;setBoxes({});}
 function revealBox(index){if(boxLock.current||boxes[index])return;boxLock.current=true;try{if(!boxDeck.current){boxDeck.current=makeBoxDeck(selected,Math.max(selected.length,boxCount));void recordModePlay("boxes");}const winner=boxDeck.current[index];if(winner)setBoxes(old=>({...old,[index]:winner}));}catch{setMessage(copy.error);}finally{boxLock.current=false;}}
 function restart(){lock.current=false;drawRef.current=null;start();}
 function editWeight(id,raw){if(raw===''){setWeights(old=>{const next={...old};delete next[id];return next;});return;}const value=Number(raw);if(!Number.isFinite(value)||value<0||value>100){setMessage(copy.weightError);return;}setWeights(old=>({...old,[id]:value}));setMessage('');reset();}
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await playRef.current?.requestFullscreen();}catch{setMessage(copy.error);}}
 function resultText(){if(!draw)return '';const lines=mode==='teams'?draw.groups.map((group,i)=>`${copy.team} ${i+1}: ${group.map(row=>row.name).join(', ')}`):['order','pinball'].includes(mode)?draw.ordered.map((row,i)=>`${i+1}. ${row.name}`):mode==='lotto'?draw.winners.map(row=>row.name):mode==='dice'?[draw.faces.join(' + ')+` = ${draw.faces.reduce((a,b)=>a+b,0)}`]:[draw.winner?.name||''];return `🎉 ${title||copy.modes[mode]} · ${copy.result}\n${lines.join('\n')}\nOne Pick Game\n${window.location.origin}/${lang}/random-pick/${mode}`;}
 async function share(){if(sharing)return;setSharing(true);try{
  const encoded=mode==='dice'?'':await encodeCandidates(selected,sourceCupId);
  const url=`${window.location.origin}/${lang}/random-pick/${mode}${encoded?'#candidates='+encoded:''}`;
  setShareLink(url);const text=resultText().split('\n').slice(0,-1).join('\n');
  if(navigator.share){try{await navigator.share({title:title||copy.modes[mode],text,url});}catch(error){if(error.name==='AbortError')return;await navigator.clipboard.writeText(text+'\n'+url);setMessage(copy.copied);}}
  else{await navigator.clipboard.writeText(text+'\n'+url);setMessage(copy.copied);}
 }catch(error){if(error?.name!=='AbortError')setMessage(error.message==='SHARE_TOO_LONG'?copy.shareTooLong:copy.error);}finally{setSharing(false);}}
 async function saveResultImage(){if(savingImage)return;setSavingImage(true);try{await downloadResultImage(title||copy.modes[mode],resultText());}catch{setMessage(copy.error);}finally{setSavingImage(false);}}
 async function save(){if(saving||!operator||!title.trim()||(mode!=='dice'&&selected.length<2))return;const context=contextRef.current;setSaving(true);try{const id=await api.saveTemplate(templateId,title,mode,selected,{groups:Number(groups)||2,diceCount:Number(diceCount),pickCount:Number(pickCount),ladderCount:Number(ladderCount),boxCount:Number(boxCount),teamRules:teamRules.filter(r=>selected.some(x=>x.id===r.a)&&selected.some(x=>x.id===r.b)).map(r=>({a:selected.findIndex(x=>x.id===r.a),b:selected.findIndex(x=>x.id===r.b),type:r.type})),weights:selected.map(r=>weights[r.id]??null)});if(alive.current&&contextRef.current===context){setTemplateId(id);setMessage(copy.saved);setRefresh(v=>v+1);}}catch{if(alive.current&&contextRef.current===context)setMessage(copy.error);}finally{if(alive.current&&contextRef.current===context)setSaving(false);}}
 async function remove(){if(!templateId||!window.confirm(copy.confirmDelete))return;const context=contextRef.current;setSaving(true);try{await api.deleteTemplate(templateId);if(alive.current&&contextRef.current===context){setRefresh(v=>v+1);setTemplateId(null);navigate(`/${lang}/random-pick/${mode}`,{replace:true});}}catch{if(alive.current&&contextRef.current===context)setMessage(copy.error);}finally{if(alive.current&&contextRef.current===context)setSaving(false);}}
 function configure(){reset();setSettingsOpen(true);requestAnimationFrame(()=>editorRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));}
 if(mode==='slots'||mode==='pirate')return null;
 if(!LANGUAGES.includes(lang)||(mode&&!MODES.includes(mode)))return <NotFoundPage/>;
 const pageTitle=mode?`${copy.modes[mode]} · ${copy.heading}`:copy.heading;
 const resultReady=done&&draw;
 const noCandidates=mode==='dice';
 const textOnly=['teams','order','ladder'].includes(mode);
 return <main className={`rp rp-current-${mode||'home'}${textOnly?' rp-text-only':''}`} dir={lang==='ar'?'rtl':'ltr'}><Seo lang={lang} slug={`random-pick${mode?`/${mode}`:''}`} title={mode?`${copy.modes[mode]} | ${lang==='ko'?'원픽게임':'OnePickGame'}`:copy.seoTitle} description={mode?copy.modeDescriptions[mode]:copy.intro} hreflangLangs={LANGUAGES}/>
 <header className="rp-heading">{mode&&<Link to={`/${lang}/random-pick`}>← {copy.back}</Link>}<h1>{pageTitle}</h1><p>{mode?copy.modeDescriptions[mode]:lang==='ko'?<>이름을 직접 입력하거나 월드컵 후보를 불러와 랜덤으로 뽑아보세요.<br/>룰렛, 공 이름 뽑기, 핀볼, 카드, 사다리, 제비뽑기, 팀 나누기로 선택하는 재미를 즐기고 결과를 공유할 수 있습니다.</>:copy.intro}</p></header>
 {mode&&<nav className="rp-tool-nav" aria-label={copy.choose}>{MODES.map(id=><Link key={id} aria-current={mode===id?'page':undefined} to={`/${lang}/random-pick/${id}`}>{copy.modes[id]}</Link>)}</nav>}
 {!mode?<><section className="rp-home-candidates"><h2>{savedCopy[2]}</h2><p>{savedCopy[6]}</p><button type="button" className="rp-import" onClick={()=>setShowImport(true)}>{copy.import}</button><label>{copy.bulk}<textarea rows={5} value={homeNames} maxLength={24200} onChange={event=>{homeEditedRef.current=true;setHomeNames(event.target.value);}} placeholder={copy.bulk}/></label><button type="button" className="rp-saved-load" disabled={candidateSaving} onClick={saveHomeCandidates}>💾 {savedCopy[0]}</button><div className="rp-saved-summary" aria-live="polite"><h3>{savedCopy[7]} ({savedPreview.length})</h3>{savedPreview.length?<><div className="rp-saved-tools"><button type="button" disabled={candidateSaving||savedEditing} onClick={editSavedCandidates}>✎ {savedCopy[9]}</button><button type="button" className="rp-saved-delete" disabled={candidateSaving} onClick={deleteSavedCandidates}>× {savedCopy[10]}</button></div>{savedEditing?<div className="rp-saved-edit"><div className="rp-saved-edit-list">{savedDraft.map((row,index)=><div key={row.id}><span>{index+1}</span><input aria-label={`${copy.name} ${index+1}`} maxLength={120} disabled={candidateSaving} value={row.name} onChange={event=>{const name=event.target.value;setSavedDraft(previous=>previous.map((item,i)=>i===index?{...item,name}:item));}}/><button type="button" disabled={candidateSaving} aria-label={`${copy.delete}: ${row.name}`} onClick={()=>setSavedDraft(previous=>previous.filter((_,i)=>i!==index))}>×</button></div>)}</div><div className="rp-saved-tools"><button type="button" disabled={candidateSaving||savedDraft.length>=200} onClick={()=>setSavedDraft(previous=>[...previous,{id:`new:${Date.now()}:${previous.length}`,name:'',image:'',enabled:true}])}>＋ {copy.add}</button><button type="button" disabled={candidateSaving} onClick={saveEditedCandidates}>{savedCopy[14]}</button><button type="button" disabled={candidateSaving} onClick={()=>setSavedEditing(false)}>{savedCopy[13]}</button></div></div>:<><ul>{savedPreview.slice(0,8).map((row,index)=><li key={index}>{row.name}</li>)}</ul>{savedPreview.length>8&&<span>+{savedPreview.length-8}</span>}</>}</>:<p>{savedCopy[4]}</p>}</div></section><div className="rp-modes">{MODES.map(id=><Link key={id} className={`rp-mode rp-mode-${id}`} to={`/${lang}/random-pick/${id}`}><div className="rp-mode-art" aria-hidden="true"><ToolArt mode={id}/></div><h2>{copy.modes[id]}</h2><span className="rp-mode-start">{copy.start} →</span><small className="rp-mode-plays">{savedCopy[8].replace("{n}",Number.isFinite(playCounts?.[id])?new Intl.NumberFormat(lang).format(playCounts[id]):"—")}</small></Link>)}</div>{templates.length>0&&<section><h2>{copy.presets}</h2><div className="rp-templates">{templates.filter(t=>MODES.includes(t.mode)).map(t=><Link key={t.id} to={`/${lang}/random-pick/${t.mode}?template=${encodeURIComponent(t.id)}`}><small>{copy.modes[t.mode]}</small><strong>{t.title}</strong></Link>)}</div></section>}{templatesError&&<p className="rp-note">{copy.templateError} <button onClick={()=>setRefresh(v=>v+1)}>↻</button></p>}</>:
 <><div className="rp-layout-controls"><button aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(v=>!v)}>{settingsOpen?copy.hideSettings:copy.settings}</button>{sourceCupId&&<Link className="rp-source-cup" to={`/${lang}/select-round/${sourceCupId}`}>{copy.playSource}</Link>}</div><div className={`rp-workspace ${settingsOpen?'':'rp-wide'} ${mode==='teams'?'rp-teams-workspace':''}`}>
 <section className="rp-play" ref={playRef}><div className="rp-play-toolbar">{mode!=='teams'&&<strong>{copy.modes[mode]}</strong>}<button onClick={fullscreen}>⛶ {copy.fullscreen}</button></div>
 {!selected.length&&['ladder','cards','order'].includes(mode)?<div className="rp-initial-setup"><h2>{copy.setupTitle}</h2><p>{copy.setupHelp}</p><form onSubmit={e=>{e.preventDefault();prepare();}}><label>{copy.ladderCount}<input aria-label={copy.ladderCount} type="number" min="2" max={mode==='ladder'?20:200} value={setupCount} onChange={e=>setSetupCount(e.target.value)}/></label><button className="rp-primary" type="submit">{copy.prepare}</button></form><button className="rp-import" onClick={()=>setShowImport(true)}>{copy.import}</button></div>:mode==='pinball'?<PinballStage rows={selected} draw={draw} done={done} fast={fast} onFinish={(ordered,token)=>finish({ordered,winner:ordered[0]},token)} onError={raceError} copy={copy}/>:
 mode==='wheel'?<WheelStage values={distribution.valid?distribution.values:[]} draw={draw} stop={stop} onFinish={(winner,token)=>finish({winner},token)} copy={copy}/>:
 mode==='ladder'?<LadderGame rows={selected} count={ladderCount} copy={copy} onBusy={setLadderBusy} onPlay={()=>{void recordModePlay("ladder");}}/>:
 mode==='lotto'?<LotteryStage rows={selected} draw={draw} done={done} onDone={()=>finish({},draw?.token)} copy={copy}/>:
 mode==='cards'?<CardStage rows={selected} draw={draw} done={done} onDone={()=>finish({},draw?.token)} copy={copy}/>:
 mode==='dice'?<DiceStage draw={draw} count={diceCount} onFinish={(faces,token)=>finish({faces},token)} copy={copy}/>:
 mode==='order'?<OrderRace rows={selected} draw={draw} fast={fast} onFinish={(ordered,token)=>finish({ordered,winner:ordered[0]},token)} copy={copy}/>:
 mode==='boxes'?<div className="rp-box-grid" style={{'--box-columns':Math.min(5,Math.max(1,Math.max(selected.length,boxCount))),'--box-mobile-columns':Math.min(3,Math.max(1,Math.max(selected.length,boxCount)))}}>{Array.from({length:Math.max(selected.length,boxCount)},(_,i)=><button key={i} disabled={Boolean(boxes[i])} onClick={()=>revealBox(i)} className={boxes[i]?`revealed ${boxes[i].blank?'is-blank':''}`:''} aria-label={`${i+1}${boxes[i]?': '+(boxes[i].blank?copy.blank:boxes[i].name):''}`}>{boxes[i]?(boxes[i].blank?<><span className="rp-blank-x">×</span><strong>{copy.blank}</strong></>:<><CandidateImage row={boxes[i]}/><strong>{boxes[i].name}</strong></>):<span>{i+1}</span>}</button>)}</div>:null}

 {loadingTemplate?<p role="status">{copy.loading}</p>:<div className="rp-actions rp-main-actions">
 {!draw&&!['ladder','boxes'].includes(mode)&&<button className="rp-primary" disabled={!noCandidates&&(selected.length<(mode==='lotto'?1:2)||mode==='wheel'&&!distribution.valid)} onClick={start}>{mode==='teams'?copy.modes.teams:copy.start}</button>}
 {running&&mode==='wheel'&&<button className="rp-stop" disabled={stop} onClick={()=>setStop(true)}>{stop?copy.stopping:copy.stop}</button>}
 {running&&mode==='pinball'&&<button onClick={restart}>{copy.restart}</button>}
 {running&&!['wheel','dice'].includes(mode)&&<button className="rp-skip" disabled={fast} onClick={()=>['pinball','order'].includes(mode)?setFast(true):finish({},draw?.token)}>{fast?copy.loading:copy.skip}</button>}
 {mode==='teams'&&<button onClick={configure}>{copy.reconfigure}</button>}
 {done&&<button className="rp-primary" onClick={()=>{lock.current=false;start();}}>{copy.again}</button>}
 {mode==='boxes'&&Object.keys(boxes).length>0&&<button onClick={resetBoxes}>{copy.again}</button>}
 {(done&&mode!=='teams')&&<button onClick={configure}>{copy.reconfigure}</button>}
 </div>}
 {resultReady&&<section className="rp-result" aria-live="polite"><h2>{copy.result}</h2>
 {mode==='teams'?<div className="rp-team-grid">{draw.groups.map((group,i)=><div className="rp-team" key={i}><h3>{copy.team} {i+1} <small>({group.length})</small></h3><ul>{group.map(row=><li key={row.id}><span>{row.name}</span></li>)}</ul></div>)}</div>:
 ['order','pinball'].includes(mode)?<ol>{draw.ordered.map(row=><li key={row.id}>{row.name}</li>)}</ol>:
 mode==='lotto'?<div className="rp-winners">{draw.winners.map(row=><article key={row.id}><CandidateImage row={row}/><strong>{row.name}</strong></article>)}</div>:
 mode==='dice'?<h3>{draw.faces.join(' + ')} = {draw.faces.reduce((a,b)=>a+b,0)}</h3>:
 draw.winner?<><CandidateImage row={draw.winner}/><h3>{draw.winner.name}</h3></>:null}
 <div className="rp-actions"><button className="rp-primary" disabled={sharing} onClick={share}>🔗 {copy.share}</button><button disabled={savingImage} onClick={saveResultImage}>▣ {copy.saveResultImage}</button></div>{shareLink&&<input className="rp-share-link" aria-label={copy.share} readOnly value={shareLink} onFocus={e=>e.target.select()}/>}<p className="rp-signature">One Pick Game</p></section>}
 <p className="rp-note">{mode==='pinball'?copy.physics:mode==='wheel'?copy.wheelHelp:!['ladder','dice','boxes','order'].includes(mode)?copy.fair:''}</p>
 </section>
 {settingsOpen&&<aside ref={editorRef} className="rp-editor"><fieldset disabled={locked||candidateSaving}><legend>{noCandidates?copy.settings:copy.participants} {!noCandidates&&<strong>{selected.length} / {rows.length}</strong>}</legend>
 {mode==='dice'?<label>{copy.diceCount}<select value={diceCount} onChange={e=>{reset();setDiceCount(Number(e.target.value));}}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>:<>
 {mode==='boxes'&&<label className="rp-box-count">{copy.boxCount}<input type="number" min={Math.max(1,selected.length)} max="200" value={Math.max(selected.length,boxCount)} onChange={e=>{setBoxCount(Math.max(1,Math.min(200,Number(e.target.value)||1)));resetBoxes();}}/><small>{copy.blank}: {Math.max(0,boxCount-selected.length)}</small></label>}
 {mode==='boxes'&&<button className="rp-add-blank" disabled={Math.max(selected.length,boxCount)>=200} onClick={()=>{setBoxCount(Math.min(200,Math.max(selected.length,boxCount)+1));resetBoxes();}}>＋ {copy.addBlank}</button>}
 {mode==='lotto'&&<div className="rp-special-settings"><label>{copy.pickCount}<input type="number" min="1" max={selected.length||200} value={pickCount} onChange={e=>setPickCount(e.target.value)}/></label><div className="rp-number-range"><label>{copy.from}<input type="number" min="-999999" max="999999" value={rangeFrom} onChange={e=>setRangeFrom(e.target.value)}/></label><label>{copy.to}<input type="number" min="-999999" max="999999" value={rangeTo} onChange={e=>setRangeTo(e.target.value)}/></label></div><button onClick={generateNumbers}>{copy.generateNumbers}</button><small>{copy.rangeHelp}</small></div>}
 {mode==='ladder'&&<label>{copy.ladderCount}<input type="number" min="2" max="20" value={ladderCount} onChange={e=>setLadderCount(Math.max(2,Math.min(20,Number(e.target.value)||2)))}/><small>{copy.ladderImport}</small></label>}
 <button type="button" className="rp-saved-load" disabled={!savedAvailable||candidateSaving} onClick={restoreSaved}>📂 {savedCopy[1]}</button><small className="rp-saved-help">{savedCopy[6]}</small><button className="rp-restore" disabled={!previousCandidates().length} onClick={restore}>{copy.restore}</button><button className="rp-import" onClick={()=>setShowImport(true)}>{copy.import}</button>
 <form className={`rp-add ${mode==='wheel'?'rp-add-wheel':''}`} onSubmit={e=>{e.preventDefault();add();}}><input value={newName} onChange={e=>setNewName(e.target.value)} maxLength={120} placeholder={copy.name} aria-label={copy.name}/><button type="submit">＋ {copy.add}</button></form>
 <details className="rp-bulk" open><summary>{copy.bulk}</summary><textarea rows={5} value={bulk} maxLength={24200} placeholder={copy.bulk} aria-label={copy.bulk} onChange={e=>setBulk(e.target.value)}/><button onClick={addBulk}>{copy.add}</button></details>
 <p>{copy.exclude}</p><div className="rp-actions"><button onClick={()=>changeRows(old=>old.map(row=>({...row,enabled:true})))}>{copy.selectAll}</button><button onClick={()=>changeRows(old=>old.map(row=>({...row,enabled:false})))}>{copy.clearSelection}</button><button onClick={()=>{if(!rows.length||window.confirm(copy.confirmReplace)){changeRows([]);setSourceCupId(null);setWeights({});}}}>{copy.reset}</button></div>
 {mode==='wheel'&&<><p className="rp-weight-help">{copy.weightHelp}</p><button onClick={()=>{setWeights({});reset();}}>{copy.autoWeights}</button>{!distribution.valid&&selected.length>0&&<p role="alert">{copy.weightError}</p>}</>}
 <div className="rp-candidates">{rows.map(row=><div key={row.id} className={`rp-candidate${row.enabled?'':' excluded'}`}><input type="checkbox" checked={row.enabled} aria-label={row.name} onChange={e=>{const enabled=e.target.checked;changeRows(old=>old.map(x=>x.id===row.id?{...x,enabled}:x));}}/>{!textOnly&&<CandidateImage row={row.enabled?row:{...row,image:''}}/>}<input aria-label={copy.name} value={row.name} maxLength={120} onChange={e=>{const name=e.target.value;changeRows(old=>old.map(x=>x.id===row.id?{...x,name}:x));}}/>
 {mode==='wheel'&&<label className="rp-weight"><input aria-label={`${row.name} %`} type="number" min="0" max="100" step="any" onFocus={e=>e.target.select()} disabled={!row.enabled} value={weights[row.id]??Number((distribution.values.find(v=>v.row.id===row.id)?.percent||0).toFixed(4))} onChange={e=>editWeight(row.id,e.target.value)}/><span>%</span>{weights[row.id]!==undefined&&<button aria-label={`${copy.autoWeights}: ${row.name}`} onClick={()=>editWeight(row.id,'')}>↺</button>}</label>}
 <button aria-label={`${copy.delete}: ${row.name}`} onClick={()=>changeRows(old=>old.filter(x=>x.id!==row.id))}>×</button></div>)}</div>
 {mode==='teams'&&<TeamConditions rows={selected} rules={teamRules} onChange={value=>{setTeamRules(value);reset();}} copy={copy}/>}
 {mode==='teams'&&<label>{copy.teamCount}<input type="number" min="2" max={Math.min(20,selected.length||20)} value={groups} onChange={e=>setGroups(e.target.value)}/></label>}
 </>}
 </fieldset>{operator&&<details className="rp-admin"><summary>{copy.admin}</summary><label>{copy.title}<input value={title} maxLength={140} onChange={e=>setTitle(e.target.value)}/></label><button disabled={saving||locked||!title.trim()||(mode!=='dice'&&selected.length<2)} onClick={save}>{copy.save}</button>{templateId&&<button disabled={saving||locked} onClick={remove}>{copy.delete}</button>}</details>}</aside>}
 </div></>}
 {message&&<p className="rp-message" role="status">{message}</p>}{showImport&&<ImportDialog copy={copy} onClose={closeImport} onImport={replaceRows}/>}
 </main>;
}
