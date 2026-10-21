import React, {useEffect,useMemo,useRef,useState} from 'react';
import {Link,useLocation,useNavigate,useParams} from 'react-router-dom';
import Seo from '../../seo/Seo';
import NotFoundPage from '../NotFoundPage';
import {getCopy,LANGUAGES,MODES} from './copy';
import {activeCandidates,createDraw,normalizeCandidates,randomInt} from '../../utils/randomPickCore';
import * as api from './api';
import PinballStage from './PinballStage';
import ToolArt from './ToolArt';
import {rememberCandidates,previousCandidates} from './previousCandidates';
import WheelStage from './WheelStage';
import LadderGame from './LadderGame';
import {CardStage,DiceStage,OrderRace} from './DrawStages';
import LotteryStage from './LotteryStage';
import {probabilities,numericCandidates,pickMany,makeBoxDeck} from './gameRules';
import './randomPick.css';
import {useTranslation} from 'react-i18next';
function CandidateImage({row}) {
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[row.image]);
  return row.image&&!failed?<img src={row.image} alt="" loading="lazy" onError={()=>setFailed(true)}/>:<span className="rp-name-image" aria-hidden="true">{row.name||'?'}</span>;
}
function ImportDialog({copy,onClose,onImport}) {
  const {t}=useTranslation();
  const [category,setCategory]=useState('');
  const [search,setSearch]=useState(''),[offset,setOffset]=useState(0),[rows,setRows]=useState([]),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[importing,setImporting]=useState(false);
  const input=useRef(null),importController=useRef(null),dialog=useRef(null);
  useEffect(()=>{const previous=document.activeElement;input.current?.focus();function key(e){if(e.key==='Escape')onClose();if(e.key==='Tab'){const els=Array.from(dialog.current?.querySelectorAll('button:not(:disabled),input:not(:disabled)')||[]);const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);importController.current?.abort();previous?.focus();};},[onClose]);
  useEffect(()=>{const controller=new AbortController();setBusy(true);setError('');const timer=setTimeout(()=>{api.searchCups(search,offset,controller.signal,category,!category&&!search.trim()).then(data=>{if(controller.signal.aborted)return;setRows(old=>offset?[...old,...data.slice(0,12)]:data.slice(0,12));setMore(data.length>12);}).catch(()=>{if(!controller.signal.aborted)setError(copy.error);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});},250);return()=>{clearTimeout(timer);controller.abort();};},[search,offset,category,retry,copy.error]);
  async function choose(id){if(importing)return;setImporting(true);setError('');const controller=new AbortController();importController.current=controller;try{const result=await api.importCup(id,controller.signal);if(!controller.signal.aborted){if(!result.rows.length){setError(copy.empty);return;}onImport(result);}}catch{if(!controller.signal.aborted)setError(copy.error);}finally{if(!controller.signal.aborted)setImporting(false);}}
  return <div className="rp-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section className="rp-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="rp-import-title"><div className="rp-flex"><h2 id="rp-import-title">{copy.import}</h2><button onClick={onClose} aria-label="Close">×</button></div><div className="rp-import-categories"><button aria-pressed={!category&&!search.trim()} onClick={()=>{setCategory('');setSearch('');setOffset(0);setRows([]);setRetry(v=>v+1);}}>{copy.recommended}</button>{['korea','anime_manga','person','game','sports','music','movie_drama','food','etc'].map(key=><button key={key} aria-pressed={category===key&&!search.trim()} onClick={()=>{setCategory(key);setSearch('');setOffset(0);setRows([]);setRetry(v=>v+1);}}>{t(`category_${key}`)}</button>)}</div><input ref={input} aria-label={copy.search} placeholder={copy.search} value={search} onChange={e=>{setSearch(e.target.value);setOffset(0);setRows([]);}} maxLength={100}/>{error&&<p role="alert">{error} <button onClick={()=>setRetry(v=>v+1)}>↻</button></p>}<div className="rp-import-list">{rows.map(row=>{let titles=row.title_translations;if(typeof titles==='string'){try{titles=JSON.parse(titles);}catch{titles={};}}return <button disabled={busy||importing} key={row.id} onClick={()=>choose(row.id)}>{titles?.[copy.lang]||row.title}</button>;})}</div>{(busy||importing)&&<p role="status">{copy.loading}</p>}{!busy&&!error&&!rows.length&&<p>{copy.empty}</p>}{more&&!error&&<button disabled={busy||importing} onClick={()=>setOffset(v=>v+12)}>{copy.more}</button>}</section></div>;
}
export default function RandomPickPage({user}) {
 const {lang='en',mode}=useParams(),copy=getCopy(lang),navigate=useNavigate(),location=useLocation();
 const [sourceCupId,setSourceCupId]=useState(null);
 const [rows,setRows]=useState([]),[newName,setNewName]=useState(''),[bulk,setBulk]=useState('');
 const [draw,setDraw]=useState(null),[done,setDone]=useState(false),[fast,setFast]=useState(false),[stop,setStop]=useState(false);
 const [message,setMessage]=useState(''),[showImport,setShowImport]=useState(false),[settingsOpen,setSettingsOpen]=useState(true);
 const [groups,setGroups]=useState(2),[pickCount,setPickCount]=useState(1),[rangeFrom,setRangeFrom]=useState(1),[rangeTo,setRangeTo]=useState(45),[diceCount,setDiceCount]=useState(1),[ladderCount,setLadderCount]=useState(6),[ladderBusy,setLadderBusy]=useState(false),[weights,setWeights]=useState({}),[boxes,setBoxes]=useState({}),[boxCount,setBoxCount]=useState(10);
 const [templates,setTemplates]=useState([]),[templatesError,setTemplatesError]=useState(false),[refresh,setRefresh]=useState(0),[operator,setOperator]=useState(false),[title,setTitle]=useState(''),[templateId,setTemplateId]=useState(null),[saving,setSaving]=useState(false),[loadingTemplate,setLoadingTemplate]=useState(false);
 const playRef=useRef(null),editorRef=useRef(null),rowsRef=useRef([]),counter=useRef(0),lock=useRef(false),alive=useRef(true),drawRef=useRef(null),boxLock=useRef(false),boxDeck=useRef(null);
 const templateParam=new URLSearchParams(location.search).get('template');
 const contextRef=useRef('');contextRef.current=`${mode}:${templateParam}:${user?.id||''}`;
 rowsRef.current=rows;drawRef.current=draw;
 const selected=useMemo(()=>activeCandidates(rows),[rows]),distribution=useMemo(()=>probabilities(rows,weights),[rows,weights]);
 const running=Boolean(draw&&!done),locked=running||ladderBusy||loadingTemplate;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{setSourceCupId(null);setRows([]);setNewName('');setBulk('');setTitle('');setGroups(2);setDraw(null);setDone(false);setFast(false);setStop(false);setWeights({});setBoxes({});boxDeck.current=null;setBoxCount(10);setLadderCount(6);setLadderBusy(false);setPickCount(1);setRangeFrom(1);setRangeTo(45);setDiceCount(1);setSettingsOpen(true);lock.current=false;setMessage('');setShowImport(false);setSaving(false);return()=>rememberCandidates(rowsRef.current);},[mode]);
 useEffect(()=>{if(mode==='pirate'||mode==='slots')navigate(`/${lang}/random-pick/${mode==='slots'?'cards':'dice'}`,{replace:true});},[mode,lang,navigate]);
 useEffect(()=>{let live=true;setOperator(false);if(user?.id)api.checkOperator().then(yes=>{if(live)setOperator(yes);});return()=>{live=false;};},[user?.id]);
 useEffect(()=>{const controller=new AbortController();api.loadTemplates(controller.signal).then(data=>{if(!controller.signal.aborted){setTemplates(data);setTemplatesError(false);}}).catch(()=>{if(!controller.signal.aborted)setTemplatesError(true);});return()=>controller.abort();},[refresh]);
 useEffect(()=>{const controller=new AbortController();setTemplateId(null);setSourceCupId(null);if(!templateParam){setLoadingTemplate(false);return()=>controller.abort();}setLoadingTemplate(true);setDraw(null);setDone(false);lock.current=false;api.loadTemplate(templateParam,controller.signal).then(data=>{if(controller.signal.aborted)return;if(!MODES.includes(data.mode))throw new Error('mode');if(data.mode!==mode){navigate(`/${lang}/random-pick/${data.mode}?template=${encodeURIComponent(data.id)}`,{replace:true});return;}const loaded=normalizeCandidates(data.candidates,`template:${data.id}`);setRows(loaded);resetBoxes();setTitle(data.title);const options=data.settings||{};setGroups(Math.max(2,Math.min(20,Number(options.groups)||2)));setDiceCount(Math.max(1,Math.min(3,Number(options.diceCount)||1)));setPickCount(Math.max(1,Math.min(loaded.length||1,Number(options.pickCount)||1)));setLadderCount(Math.max(2,Math.min(20,Number(options.ladderCount)||6)));setBoxCount(Math.max(1,Math.min(200,Number(options.boxCount)||10)));setWeights(Object.fromEntries(loaded.flatMap((r,i)=>Number.isFinite(options.weights?.[i])?[[r.id,options.weights[i]]]:[])));setTemplateId(data.id);}).catch(()=>{if(!controller.signal.aborted)setMessage(copy.error);}).finally(()=>{if(!controller.signal.aborted)setLoadingTemplate(false);});return()=>controller.abort();},[templateParam,mode,lang,navigate,copy.error]);
 const closeImport=React.useCallback(()=>setShowImport(false),[]);
 function reset(){lock.current=false;drawRef.current=null;setDraw(null);setDone(false);setFast(false);setStop(false);setMessage('');}
 function changeRows(value){setRows(value);reset();setBoxes({});boxDeck.current=null;}
 function replaceRows(result){if(rows.length&&!window.confirm(copy.confirmReplace))return;changeRows(result.rows);setSourceCupId(result.sourceCupId||null);setWeights({});setShowImport(false);setMessage(result.truncated?copy.limit:'');}
 function add(){const name=newName.trim();if(!name)return;if(rows.length>=200){setMessage(copy.limit);return;}changeRows(old=>[...old,{id:`manual:${++counter.current}`,name:name.slice(0,120),image:'',enabled:true}]);setNewName('');}
 function addBulk(){const names=bulk.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!names.length)return;if(rows.length+names.length>200){setMessage(copy.limit);return;}changeRows(old=>[...old,...names.map(name=>({id:`manual:${++counter.current}`,name:name.slice(0,120),image:'',enabled:true}))]);setBulk('');}
 function restore(){const previous=previousCandidates();if(previous.length)replaceRows({rows:normalizeCandidates(previous,`restored:${++counter.current}`)});}
 function generateNumbers(){try{replaceRows({rows:numericCandidates(rangeFrom,rangeTo)});}catch{setMessage(copy.rangeError);}}
 function finish(result,token){if(!alive.current||drawRef.current?.token!==token)return;setDraw(previous=>previous?.token===token?{...previous,...result}:previous);setDone(true);lock.current=false;}
 function raceError(){reset();setMessage(copy.error);}
 function start(){if(lock.current||loadingTemplate)return;const minimum=mode==='dice'?0:mode==='lotto'?1:2;if(selected.length<minimum){setMessage(copy.minimum);return;}if(mode==='wheel'&&!distribution.valid){setMessage(copy.weightError);return;}
  try{const token=++counter.current;let next;
   if(mode==='wheel')next={mode,token,pool:selected,winner:null};
   else if(mode==='order')next={mode,token,pool:selected,seed:randomInt(0x100000000),ordered:[],winner:null};
   else if(mode==='dice')next={mode,token,faces:[]};
   else if(mode==='lotto'){const winners=pickMany(selected,pickCount);next={mode,token,pool:selected,winners,winner:winners[0]};}
   else next={...createDraw(mode,rows,groups),token};
   lock.current=true;drawRef.current=next;setDraw(next);setDone(mode==='teams');setStop(false);setFast(false);setMessage('');if(mode==='teams'){lock.current=false;setSettingsOpen(false);}
  }catch{setMessage(mode==='lotto'?copy.countError:copy.error);}
 }
 function resetBoxes(){boxDeck.current=null;setBoxes({});}
 function revealBox(index){if(boxLock.current||boxes[index])return;boxLock.current=true;try{if(!boxDeck.current)boxDeck.current=makeBoxDeck(selected,Math.max(selected.length,boxCount));const winner=boxDeck.current[index];if(winner)setBoxes(old=>({...old,[index]:winner}));}catch{setMessage(copy.error);}finally{boxLock.current=false;}}
 function restart(){lock.current=false;drawRef.current=null;start();}
 function editWeight(id,raw){if(raw===''){setWeights(old=>{const next={...old};delete next[id];return next;});return;}const value=Number(raw);if(!Number.isFinite(value)||value<0||value>100){setMessage(copy.weightError);return;}setWeights(old=>({...old,[id]:value}));setMessage('');reset();}
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await playRef.current?.requestFullscreen();}catch{setMessage(copy.error);}}
 function resultText(){if(!draw)return '';const lines=mode==='teams'?draw.groups.map((group,i)=>`${copy.team} ${i+1}: ${group.map(row=>row.name).join(', ')}`):['order','pinball'].includes(mode)?draw.ordered.map((row,i)=>`${i+1}. ${row.name}`):mode==='lotto'?draw.winners.map(row=>row.name):mode==='dice'?[draw.faces.join(' + ')+` = ${draw.faces.reduce((a,b)=>a+b,0)}`]:[draw.winner?.name||''];return `${title||copy.modes[mode]}\n${lines.join('\n')}\nOne Pick Game\n${window.location.origin}/${lang}/random-pick/${mode}`;}
 async function share(){try{await navigator.clipboard.writeText(resultText());setMessage(copy.copied);}catch{setMessage(copy.error);}}
 async function save(){if(saving||!operator||!title.trim()||(mode!=='dice'&&selected.length<2))return;const context=contextRef.current;setSaving(true);try{const id=await api.saveTemplate(templateId,title,mode,selected,{groups:Number(groups)||2,diceCount:Number(diceCount),pickCount:Number(pickCount),ladderCount:Number(ladderCount),boxCount:Number(boxCount),weights:selected.map(r=>weights[r.id]??null)});if(alive.current&&contextRef.current===context){setTemplateId(id);setMessage(copy.saved);setRefresh(v=>v+1);}}catch{if(alive.current&&contextRef.current===context)setMessage(copy.error);}finally{if(alive.current&&contextRef.current===context)setSaving(false);}}
 async function remove(){if(!templateId||!window.confirm(copy.confirmDelete))return;const context=contextRef.current;setSaving(true);try{await api.deleteTemplate(templateId);if(alive.current&&contextRef.current===context){setRefresh(v=>v+1);setTemplateId(null);navigate(`/${lang}/random-pick/${mode}`,{replace:true});}}catch{if(alive.current&&contextRef.current===context)setMessage(copy.error);}finally{if(alive.current&&contextRef.current===context)setSaving(false);}}
 function configure(){reset();setSettingsOpen(true);requestAnimationFrame(()=>editorRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));}
 if(mode==='slots'||mode==='pirate')return null;
 if(!LANGUAGES.includes(lang)||(mode&&!MODES.includes(mode)))return <NotFoundPage/>;
 const pageTitle=mode?`${copy.modes[mode]} · ${copy.heading}`:copy.heading;
 const resultReady=done&&draw;
 const noCandidates=mode==='dice';
 return <main className={`rp rp-current-${mode||'home'}`} dir={lang==='ar'?'rtl':'ltr'}><Seo lang={lang} slug={`random-pick${mode?`/${mode}`:''}`} title={`${pageTitle} | ${lang==='ko'?'원픽게임':'OnePickGame'}`} description={`${pageTitle}. ${copy.intro} ${copy.import}.`} hreflangLangs={LANGUAGES}/>
 <header className="rp-heading">{mode&&<Link to={`/${lang}/random-pick`}>← {copy.back}</Link>}<h1>{pageTitle}</h1><p>{copy.intro}</p></header>
 {mode&&<nav className="rp-tool-nav" aria-label={copy.choose}>{MODES.map(id=><Link key={id} aria-current={mode===id?'page':undefined} to={`/${lang}/random-pick/${id}`}>{copy.modes[id]}</Link>)}</nav>}
 {!mode?<><div className="rp-modes">{MODES.map(id=><Link key={id} className={`rp-mode rp-mode-${id}`} to={`/${lang}/random-pick/${id}`}><div className="rp-mode-art" aria-hidden="true"><ToolArt mode={id}/></div><h2>{copy.modes[id]}</h2><span className="rp-mode-start">{copy.start} →</span></Link>)}</div>{templates.length>0&&<section><h2>{copy.presets}</h2><div className="rp-templates">{templates.filter(t=>MODES.includes(t.mode)).map(t=><Link key={t.id} to={`/${lang}/random-pick/${t.mode}?template=${encodeURIComponent(t.id)}`}><small>{copy.modes[t.mode]}</small><strong>{t.title}</strong></Link>)}</div></section>}{templatesError&&<p className="rp-note">{copy.templateError} <button onClick={()=>setRefresh(v=>v+1)}>↻</button></p>}</>:
 <><div className="rp-layout-controls"><button aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(v=>!v)}>{settingsOpen?copy.hideSettings:copy.settings}</button>{sourceCupId&&<Link className="rp-source-cup" to={`/${lang}/select-round/${sourceCupId}`}>{copy.playSource}</Link>}</div><div className={`rp-workspace ${settingsOpen?'':'rp-wide'} ${mode==='teams'?'rp-teams-workspace':''}`}>
 <section className="rp-play" ref={playRef}><div className="rp-play-toolbar">{mode!=='teams'&&<strong>{copy.modes[mode]}</strong>}<button onClick={fullscreen}>⛶ {copy.fullscreen}</button></div>
 {mode==='pinball'?<PinballStage rows={selected} draw={draw} done={done} fast={fast} onFinish={(ordered,token)=>finish({ordered,winner:ordered[0]},token)} onError={raceError} copy={copy}/>:
 mode==='wheel'?<WheelStage values={distribution.valid?distribution.values:[]} draw={draw} stop={stop} onFinish={(winner,token)=>finish({winner},token)} copy={copy}/>:
 mode==='ladder'?<LadderGame rows={selected} count={ladderCount} copy={copy} onBusy={setLadderBusy}/>:
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
 {done&&<button className="rp-primary" onClick={()=>{lock.current=false;start();}}>{copy.again}</button>}
 {mode==='boxes'&&Object.keys(boxes).length>0&&<button onClick={resetBoxes}>{copy.again}</button>}
 {(done||mode==='teams')&&<button onClick={configure}>{copy.reconfigure}</button>}
 </div>}
 {resultReady&&<section className="rp-result" aria-live="polite"><h2>{copy.result}</h2>
 {mode==='teams'?<div className="rp-team-grid">{draw.groups.map((group,i)=><div className="rp-team" key={i}><h3>{copy.team} {i+1} <small>({group.length})</small></h3><ul>{group.map(row=><li key={row.id}><CandidateImage row={row}/><span>{row.name}</span></li>)}</ul></div>)}</div>:
 ['order','pinball'].includes(mode)?<ol>{draw.ordered.map(row=><li key={row.id}>{row.name}</li>)}</ol>:
 mode==='lotto'?<div className="rp-winners">{draw.winners.map(row=><article key={row.id}><CandidateImage row={row}/><strong>{row.name}</strong></article>)}</div>:
 mode==='dice'?<h3>{draw.faces.join(' + ')} = {draw.faces.reduce((a,b)=>a+b,0)}</h3>:
 draw.winner?<><CandidateImage row={draw.winner}/><h3>{draw.winner.name}</h3></>:null}
 <button onClick={share}>{copy.share}</button><p className="rp-signature">One Pick Game</p></section>}
 <p className="rp-note">{mode==='pinball'?copy.physics:mode==='wheel'?copy.wheelHelp:!['ladder','dice','boxes','order'].includes(mode)?copy.fair:''}</p>
 </section>
 {settingsOpen&&<aside ref={editorRef} className="rp-editor"><fieldset disabled={locked}><legend>{noCandidates?copy.settings:copy.participants} {!noCandidates&&<strong>{selected.length} / {rows.length}</strong>}</legend>
 {mode==='dice'?<label>{copy.diceCount}<select value={diceCount} onChange={e=>{reset();setDiceCount(Number(e.target.value));}}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>:<>
 {mode==='boxes'&&<label>{copy.boxCount}<input type="number" min={Math.max(1,selected.length)} max="200" value={Math.max(selected.length,boxCount)} onChange={e=>{setBoxCount(Math.max(1,Math.min(200,Number(e.target.value)||1)));resetBoxes();}}/><small>{copy.blank}: {Math.max(0,boxCount-selected.length)}</small></label>}
 {mode==='lotto'&&<div className="rp-special-settings"><label>{copy.pickCount}<input type="number" min="1" max={selected.length||200} value={pickCount} onChange={e=>setPickCount(e.target.value)}/></label><div className="rp-number-range"><label>{copy.from}<input type="number" min="-999999" max="999999" value={rangeFrom} onChange={e=>setRangeFrom(e.target.value)}/></label><label>{copy.to}<input type="number" min="-999999" max="999999" value={rangeTo} onChange={e=>setRangeTo(e.target.value)}/></label></div><button onClick={generateNumbers}>{copy.generateNumbers}</button><small>{copy.rangeHelp}</small></div>}
 {mode==='ladder'&&<label>{copy.ladderCount}<input type="number" min="2" max="20" value={ladderCount} onChange={e=>setLadderCount(Math.max(2,Math.min(20,Number(e.target.value)||2)))}/><small>{copy.ladderImport}</small></label>}
 <button className="rp-restore" disabled={!previousCandidates().length} onClick={restore}>{copy.restore}</button><button className="rp-import" onClick={()=>setShowImport(true)}>{copy.import}</button>
 <form className={`rp-add ${mode==='wheel'?'rp-add-wheel':''}`} onSubmit={e=>{e.preventDefault();add();}}><input value={newName} onChange={e=>setNewName(e.target.value)} maxLength={120} placeholder={copy.name} aria-label={copy.name}/><button type="submit">＋ {copy.add}</button></form>
 <details className="rp-bulk" open={mode==='teams'?true:undefined}><summary>{copy.bulk}</summary><textarea rows={5} value={bulk} maxLength={24200} placeholder={copy.bulk} aria-label={copy.bulk} onChange={e=>setBulk(e.target.value)}/><button onClick={addBulk}>{copy.add}</button></details>
 <p>{copy.exclude}</p><div className="rp-actions"><button onClick={()=>changeRows(old=>old.map(row=>({...row,enabled:true})))}>{copy.selectAll}</button><button onClick={()=>changeRows(old=>old.map(row=>({...row,enabled:false})))}>{copy.clearSelection}</button><button onClick={()=>{if(!rows.length||window.confirm(copy.confirmReplace)){changeRows([]);setSourceCupId(null);setWeights({});}}}>{copy.reset}</button></div>
 {mode==='wheel'&&<><p className="rp-weight-help">{copy.weightHelp}</p><button onClick={()=>{setWeights({});reset();}}>{copy.autoWeights}</button>{!distribution.valid&&selected.length>0&&<p role="alert">{copy.weightError}</p>}</>}
 <div className="rp-candidates">{rows.map(row=><div key={row.id} className={`rp-candidate${row.enabled?'':' excluded'}`}><input type="checkbox" checked={row.enabled} aria-label={row.name} onChange={e=>{const enabled=e.target.checked;changeRows(old=>old.map(x=>x.id===row.id?{...x,enabled}:x));}}/><CandidateImage row={row}/><input aria-label={copy.name} value={row.name} maxLength={120} onChange={e=>{const name=e.target.value;changeRows(old=>old.map(x=>x.id===row.id?{...x,name}:x));}}/>
 {mode==='wheel'&&<label className="rp-weight"><input aria-label={`${row.name} %`} type="number" min="0" max="100" step="any" onFocus={e=>e.target.select()} disabled={!row.enabled} value={weights[row.id]??Number((distribution.values.find(v=>v.row.id===row.id)?.percent||0).toFixed(4))} onChange={e=>editWeight(row.id,e.target.value)}/><span>%</span>{weights[row.id]!==undefined&&<button aria-label={`${copy.autoWeights}: ${row.name}`} onClick={()=>editWeight(row.id,'')}>↺</button>}</label>}
 <button aria-label={`${copy.delete}: ${row.name}`} onClick={()=>changeRows(old=>old.filter(x=>x.id!==row.id))}>×</button></div>)}</div>
 {mode==='teams'&&<label>{copy.teamCount}<input type="number" min="2" max={Math.min(20,selected.length||20)} value={groups} onChange={e=>setGroups(e.target.value)}/></label>}
 </>}
 </fieldset>{operator&&<details className="rp-admin"><summary>{copy.admin}</summary><label>{copy.title}<input value={title} maxLength={140} onChange={e=>setTitle(e.target.value)}/></label><button disabled={saving||locked||!title.trim()||(mode!=='dice'&&selected.length<2)} onClick={save}>{copy.save}</button>{templateId&&<button disabled={saving||locked} onClick={remove}>{copy.delete}</button>}</details>}</aside>}
 </div></>}
 {message&&<p className="rp-message" role="status">{message}</p>}{showImport&&<ImportDialog copy={copy} onClose={closeImport} onImport={replaceRows}/>}
 </main>;
}
