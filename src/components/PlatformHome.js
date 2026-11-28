import React,{useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Link,Navigate,useLocation,useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import Seo from '../seo/Seo';
import homeCopy from '../seo/siteHomeCopy.json';
import home from '../seo/platformHome';
import paths from '../seo/sitePaths';
import homeData from '../seo/platformHomeData';
import loadPublicPlatformHome from '../utils/publicPlatformHome';
import worldcupContent from '../seo/worldcupCardContent';
import quizCopy from '../seo/quizCardCopy.json';
import MediaRenderer from './MediaRenderer';
import {BoardThumbnail} from './topNine/PublicBoards';
import layout from './topNine/collageLayout';
import ToolArt from './randomPick/ToolArt';
import TierCardPreview from './tierList/TierCardPreview';
import QuizCard from './QuizCard';
import ContentLanguageSelect from './ContentLanguageSelect';
import TopNineIcon from './TopNineIcon';
import './PlatformHome.css';
const icons=home.MODES.map(mode=>mode.icon);
function bootstrap(lang){try{const value=JSON.parse(document.getElementById('platform-home-data')?.textContent||'null');return homeData.valid(value,lang)?value:null;}catch{return null;}}
function Preview({row,index}){
 if(row.tierPreview)return <TierCardPreview item={row.tierPreview}/>;
 if(row.mode)return <ToolArt mode={row.mode}/>;
 if(row.slots)return <div className="platform-collage" dir="ltr">{row.slots.map((slot,i)=><div key={i} className="platform-collage-cell" style={layout.layouts[i]?.style}>{slot&&<BoardThumbnail candidate={slot} index={i}/>}</div>)}<svg viewBox="0 0 100 100" aria-hidden="true"><path d={layout.boundaryPath} vectorEffect="non-scaling-stroke"/></svg></div>;
 if(row.images?.length)return <div className={'platform-duel'+(row.images.length===1?' platform-single':'')}>{row.images.map((src,i)=><MediaRenderer key={i+':'+src} url={src} alt="" playable={false} loading="lazy" deferUntilVisible style={{width:'100%',height:'100%',objectFit:'cover'}}/>)}{row.images.length>1&&<img className="platform-vs" src="/ui/vs-badge-v78.webp" alt="" width="72" height="72"/>}</div>;
 return row.image?<MediaRenderer url={row.image} alt="" playable={false} loading="lazy" deferUntilVisible style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span className="platform-placeholder" aria-hidden="true">{icons[index]}</span>;
}
function Card({row,group,index,copy,lang}){
 if(group.kind==='quiz')return <QuizCard className="platform-card platform-card--quiz" href={row.href} title={row.label} image={row.image} questionCount={row.questionCount} plays={row.plays} copy={quizCopy[lang]||quizCopy.en}/>;
 const content=<><div className="platform-card-media"><Preview row={row} index={index}/></div><strong title={row.label}><span>{row.label}</span></strong></>;
 if(group.kind==='worldcup'){
  const meta=worldcupContent.COPY[lang]||worldcupContent.COPY.en;
  return <article className="platform-card platform-card--worldcup" style={{'--card-accent':row.accent||'#F97316'}}><Link className="platform-card-link" to={row.href}>{content}<p className="platform-card-candidates"><span>{row.description}</span></p><div className="platform-card-meta"><span>👤 {meta.candidates} <strong>{new Intl.NumberFormat(lang).format(row.candidateCount||0)}</strong></span><span>▶ {meta.plays} <strong>{new Intl.NumberFormat(lang).format(row.plays||0)}</strong></span><span>🕒 {meta.updated} <strong>{worldcupContent.formatDate(row.date)}</strong></span></div></Link><Link className="platform-card-start" to={row.href}>{copy.start}</Link></article>;
 }
 return <Link className={'platform-card platform-card--'+group.kind} to={row.href}>{content}</Link>;
}
function CardRail({group,index,copy,lang,current,onLoadMore,paging,pageError}){
 const track=useRef(null),hasMore=Boolean(group.hasMore),busy=paging||current?.loading;
 const fill=useCallback(()=>{const node=track.current;if(node&&node.clientWidth>0&&node.scrollWidth<=node.clientWidth+1&&hasMore&&!busy&&!pageError)onLoadMore(group.kind);},[hasMore,busy,pageError,onLoadMore,group.kind]);
 useEffect(()=>{
  const node=track.current;if(!node)return undefined;
  const frame=requestAnimationFrame(fill),observer=typeof ResizeObserver==='function'?new ResizeObserver(fill):null;
  observer?.observe(node);window.addEventListener('resize',fill);
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',fill);};
 },[fill,group.rows.length]);
 const scroll=async direction=>{const node=track.current;if(!node)return;
  if(direction>0&&hasMore&&node.scrollWidth-Math.abs(node.scrollLeft)-node.clientWidth<node.clientWidth){await onLoadMore(group.kind);requestAnimationFrame(()=>node.scrollBy({left:(lang==='ar'?-1:1)*node.clientWidth,behavior:'smooth'}));}
  else node.scrollBy({left:direction*(lang==='ar'?-1:1)*node.clientWidth,behavior:'smooth'});
 };
 const onScroll=()=>{const node=track.current;if(node&&hasMore&&!busy&&!pageError&&node.scrollWidth-Math.abs(node.scrollLeft)-node.clientWidth<=2)onLoadMore(group.kind);};
 return <><div className="platform-rail"><button className="platform-rail-arrow" type="button" aria-label={copy.titles[index]+' ←'} disabled={group.rows.length<2&&!hasMore} onClick={()=>scroll(-1)}>{lang==='ar'?'›':'‹'}</button><div className="platform-cards" ref={track} onScroll={onScroll} aria-busy={!current||current.loading||paging}>{group.rows.length?group.rows.map(row=><Card row={row} group={group} index={index} copy={copy} lang={lang} key={row.href}/>):<p role="status">{!current||current.loading||paging?copy.loading:current.error||group.unavailable?copy.failed:copy.empty}</p>}</div><button className="platform-rail-arrow" type="button" aria-label={copy.titles[index]+' →'} disabled={group.rows.length<2&&!hasMore} onClick={()=>scroll(1)}>{lang==='ar'?'‹':'›'}</button></div>{paging&&<p className="platform-page-status" role="status">{copy.loading}</p>}{pageError&&<button className="platform-retry" onClick={()=>onLoadMore(group.kind,true)}>{copy.retry}</button>}</>;
}
export default function PlatformHome({language}){
 const params=useParams(),location=useLocation(),{i18n}=useTranslation(),lang=paths.language(language||params.lang||'en'),copy=home.COPY[lang];
 const modeNav=useRef(null);
 const [retry,setRetry]=useState(0),[state,setState]=useState(()=>({lang,data:bootstrap(lang),loading:false,error:false}));
 const stateRef=useRef(state);stateRef.current=state;
 const jobs=useRef(new Map()),generation=useRef(null);
 const [paging,setPaging]=useState({}),[pageErrors,setPageErrors]=useState({});
 const query=new URLSearchParams(location.search),legacy=['search','creator','focus'].some(key=>query.has(key));
 useLayoutEffect(()=>{
  const nav=modeNav.current;
  if(!nav)return;
  const labels=[...nav.querySelectorAll('.platform-mode > strong')];
  const range=document.createRange();
  if(typeof range.getBoundingClientRect!=='function')return;
  const fit=()=>{
   // Measure at the stylesheet size so a wider card restores the original size.
   labels.forEach(label=>{label.style.fontSize='';});
   const sizes=labels.map(label=>{
    range.selectNodeContents(label);
    const width=label.getBoundingClientRect().width;
    const textWidth=range.getBoundingClientRect().width;
    if(width<=1||textWidth<=width)return '';
    const size=parseFloat(window.getComputedStyle(label).fontSize);
    return Math.floor(size*(width-1)/textWidth*100)/100+'px';
   });
   labels.forEach((label,index)=>{label.style.fontSize=sizes[index];});
  };
  let frame=0;
  const schedule=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(fit);
  };
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
  observer?.observe(nav);
  window.addEventListener('resize',schedule);
  document.fonts?.addEventListener('loadingdone',schedule);
  fit();
  return()=>{
   cancelAnimationFrame(frame);
   observer?.disconnect();
   window.removeEventListener('resize',schedule);
   document.fonts?.removeEventListener('loadingdone',schedule);
  };
 },[lang,legacy]);
 useLayoutEffect(()=>{generation.current=Symbol();setPaging({});setPageErrors({});const pending=jobs.current;return()=>{generation.current=null;pending.forEach(job=>job.controller.abort());pending.clear();};},[lang,retry]);
 const loadMore=useCallback((kind,refresh=false)=>{
  const current=stateRef.current,group=current.data?.groups.find(item=>item.kind===kind),key=lang+':'+kind;
  if(current.lang!==lang||current.loading||!group?.hasMore)return Promise.resolve(false);
  if(jobs.current.has(key))return jobs.current.get(key).promise;
  const token=generation.current,offset=group.nextOffset,job={controller:new AbortController(),promise:null};jobs.current.set(key,job);
  setPaging(prev=>({...prev,[key]:true}));setPageErrors(prev=>({...prev,[key]:false}));
  job.promise=(async()=>{
   try{
    const data=await homeData.load({lang,kind,offset,limit:home.LIMIT,fetch,readPublic:loadPublicPlatformHome,signal:job.controller.signal,refresh});
    const next=data.groups.find(item=>item.kind===kind);
    if(next.unavailable||next.hasMore&&next.nextOffset<=offset)throw Error('HOME_PAGE_UNAVAILABLE');
    if(generation.current!==token)return false;
    setState(prev=>{
     if(prev.lang!==lang||!prev.data)return prev;
     const existing=prev.data.groups.find(item=>item.kind===kind);if(existing.nextOffset!==offset)return prev;
     const rows=Array.from(new Map(existing.rows.concat(next.rows).map(row=>[row.href,row])).values());
     return {...prev,data:{...prev.data,groups:prev.data.groups.map(item=>item.kind===kind?{...next,rows}:item)}};
    });return true;
   }catch(error){if(generation.current===token&&error.name!=='AbortError')setPageErrors(prev=>({...prev,[key]:true}));return false;}
   finally{if(jobs.current.get(key)===job)jobs.current.delete(key);if(generation.current===token)setPaging(prev=>({...prev,[key]:false}));}
  })();return job.promise;
 },[lang]);
 useEffect(()=>{if(i18n.language!==lang)i18n.changeLanguage(lang);},[lang,i18n]);
 useEffect(()=>{
  if(legacy)return;
  const initial=retry===0?bootstrap(lang):null;
  if(initial&&!initial.groups.some(group=>group.unavailable)){setState({lang,data:initial,loading:false,error:false});return;}
  const controller=new AbortController();let live=true;
  setState({lang,data:initial,loading:true,error:false});
  homeData.load({lang,initial,fetch,readPublic:loadPublicPlatformHome,signal:controller.signal,refresh:retry>0}).then(data=>{if(live)setState({lang,data,loading:false,error:false});}).catch(error=>{if(live&&error.name!=='AbortError')setState({lang,data:initial,loading:false,error:true});});
  return()=>{live=false;controller.abort();};
 },[lang,retry,legacy]);
 if(legacy)return <Navigate replace to={paths.worldcupHome(lang)+location.search+location.hash}/>;
 const current=state.lang===lang?state:null,groups=current?.data?.groups||home.empty(lang).groups;
 return <main className="platform-home" dir={lang==='ar'?'rtl':'ltr'}>
  <Seo lang={lang} title={homeCopy[lang].title} description={copy.intro}/>
  <header className="platform-hero"><nav ref={modeNav} className="platform-modes" aria-label={copy.titles.join(', ')}>{groups.map((group,index)=><Link key={group.kind} to={group.href} className={'platform-mode platform-mode-'+group.kind}><span aria-hidden="true">{group.kind==='nine'?<TopNineIcon size={56}/>:icons[index]}</span><strong>{copy.titles[index]}</strong></Link>)}</nav></header>
  <div className="platform-language"><ContentLanguageSelect/></div>
  {groups.map((group,index)=><section key={group.kind} className={'platform-section platform-section-'+group.kind} aria-labelledby={'platform-'+group.kind}>
   <div className="platform-section-heading"><h2 id={'platform-'+group.kind}><Link className="platform-section-main-link" to={group.href}><span aria-hidden="true">{group.kind==='nine'?<TopNineIcon size={32}/>:icons[index]} </span>{copy.titles[index]}</Link></h2><Link to={group.href}>{copy.all} <span aria-hidden="true">→</span></Link></div>
   <p className="platform-section-intro">{copy.descriptionLines[index].map((line,i)=><span key={i}>{line}{i<copy.descriptionLines[index].length-1?' ':''}</span>)}</p>
   <CardRail group={group} index={index} copy={copy} lang={lang} current={current} onLoadMore={loadMore} paging={paging[lang+':'+group.kind]} pageError={pageErrors[lang+':'+group.kind]}/>
   {!current?.loading&&(current?.error||group.unavailable)&&<button className="platform-retry" onClick={()=>setRetry(value=>value+1)}>{copy.retry}</button>}
  </section>)}
 </main>;
}
