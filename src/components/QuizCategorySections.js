import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {getQuizPage} from '../utils/supabaseQuizApi';
import {createQuizListPager} from '../utils/quizListPager';
import MediaRenderer from './MediaRenderer';
import COPY from './quizCategoryHomeCopy.json';
import './QuizCategorySections.css';
const CATEGORIES=['knowledge','animation','sports','entertainment','game','food','other'];
function local(map,fallback,lang){if(typeof map==='string'){try{map=JSON.parse(map);}catch{map={};}}return map?.[lang]||map?.en||fallback||'';}
function useColumns(container){
 const cardWidth=440;
 const read=()=>{const width=container.current?.getBoundingClientRect().width || (typeof window==='undefined'?1600:window.innerWidth)-44;return typeof window!=='undefined'&&window.innerWidth<=650?2:Math.max(1,Math.min(40,Math.ceil((width-24)/(cardWidth+10)-0.0001)));};
 const [columns,setColumns]=useState(read);
 const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<=650);
 useEffect(()=>{const resize=()=>{setColumns(read());setMobile(window.innerWidth<=650);};resize();window.addEventListener('resize',resize);const observer=typeof window.ResizeObserver==='function'?new window.ResizeObserver(resize):null;if(container.current)observer?.observe(container.current);return()=>{window.removeEventListener('resize',resize);observer?.disconnect();};},[container,cardWidth]);
 return {columns,cardWidth,mobile};
}
function CategoryRow({category,index,columns,lang,contentLanguage,sort,copy,c,mobile}){
 const node=useRef(null),pagerRef=useRef(null),[active,setActive]=useState(index===0),[state,setState]=useState(null),[start,setStart]=useState(0);
 const track=useRef(null),[mobileIndex,setMobileIndex]=useState(0);
 const sizeRef=useRef(columns);sizeRef.current=columns;
 useEffect(()=>{if(active)return;const Observer=window.IntersectionObserver;if(!Observer){setActive(true);return;}const observer=new Observer(entries=>{if(entries.some(entry=>entry.isIntersecting)){setActive(true);observer.disconnect();}},{rootMargin:'0px'});if(node.current)observer.observe(node.current);return()=>observer.disconnect();},[active]);
 useEffect(()=>{if(!active)return;let live=true;setState(null);setStart(0);const pager=createQuizListPager({pageSize:sizeRef.current,fetchPage:page=>getQuizPage({...page,category,contentLanguage,sort}),onChange:next=>{if(live)setState(next);}});pagerRef.current=pager;pager.loadMore(sizeRef.current);return()=>{live=false;pager.dispose();if(pagerRef.current===pager)pagerRef.current=null;};},[active,category,contentLanguage,sort]);
 useEffect(()=>{if(!active||!pagerRef.current)return;const pager=pagerRef.current,desired=start+columns;pager.setPageSize(Math.max(1,Math.min(columns,desired-pager.snapshot().items.length)));pager.loadMore(desired);},[columns,active]);
 const items=state?.items||[],busy=active&&(!state||state.loading),hasNext=start+columns<items.length||Boolean(state?.hasMore);
 useEffect(()=>{if(mobile){setStart(0);setMobileIndex(0);if(track.current)track.current.scrollLeft=0;}},[mobile]);
 function onMobileScroll(event){if(!mobile)return;const el=event.currentTarget;const width=el.firstElementChild?.getBoundingClientRect().width||el.clientWidth;setMobileIndex(Math.round(Math.abs(el.scrollLeft)/(width+12)));if(el.scrollWidth-Math.abs(el.scrollLeft)-el.clientWidth<el.clientWidth*.35&&state?.hasMore&&!busy&&pagerRef.current){pagerRef.current.setPageSize(2);pagerRef.current.loadMore(items.length+2);}}
 function scrollMobile(index){const el=track.current;if(!el)return;const width=el.firstElementChild?.getBoundingClientRect().width||el.clientWidth;el.scrollTo({left:(lang==='ar'?-1:1)*index*(width+12),behavior:'smooth'});}
 async function next(){if(mobile){const pager=pagerRef.current;if(!pager||busy)return;const target=mobileIndex+1;pager.setPageSize(1);const count=await pager.loadMore(target+1);if(pagerRef.current===pager&&count!==false&&count>target)requestAnimationFrame(()=>scrollMobile(target));return;}if(busy||!pagerRef.current)return;const target=start+columns,pager=pagerRef.current;pager.setPageSize(columns);const loaded=await pager.loadMore(target+columns);if(pagerRef.current===pager&&loaded!==false&&loaded>target)setStart(target);}
 if(active&&state?.initialized&&!busy&&!state.error&&!items.length)return null;
 const categoryTo=`/${lang}/quiz?category=${encodeURIComponent(category)}`;
 return <section className="quiz-category-row" ref={node} aria-busy={busy}>
 <header><h2><Link to={categoryTo}>{c[category]}</Link></h2><Link className="quiz-category-all" to={categoryTo}>{copy.viewAll} →</Link></header>
 <div className="quiz-category-carousel">
 {items.length>0&&<button type="button" className="quiz-category-arrow quiz-category-arrow-prev" aria-label={copy.previous} disabled={busy||(mobile?mobileIndex===0:start===0)} onClick={()=>mobile?scrollMobile(Math.max(0,mobileIndex-1)):setStart(value=>Math.max(0,value-columns))}>‹</button>}
 <div ref={track} onScroll={onMobileScroll} className="quiz-category-cards" style={{'--quiz-columns':items.length?Math.min(columns,Math.max(1,items.length-start)):columns}}>
 {(mobile?items:items.slice(start,start+columns)).map(q=>{const title=local(q.title_translations,q.title,lang);return <Link key={q.id} className="quiz-category-card" to={`/${lang}/quiz/${q.id}`}>
 <div className="quiz-category-image">{q.thumbnail_url?<MediaRenderer url={q.thumbnail_url} alt={title} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 35%'}}/>:<span aria-hidden="true">❓</span>}</div>
 <div className="quiz-category-card-body"><h3 title={title}>{title}</h3><p>{Number(q.question_count)||0} {c.questions} · {Number(q.play_count)||0} {c.plays}</p><span className="quiz-category-play">{c.playNow} →</span></div></Link>;})}
 {!items.length&&(!active||busy)&&Array.from({length:columns},(_,i)=><div key={i} className="quiz-category-placeholder" aria-hidden="true"/>)}
 </div>
 {items.length>0&&<button type="button" className="quiz-category-arrow quiz-category-arrow-next" aria-label={copy.next} disabled={busy||!(mobile?(mobileIndex+1<items.length||state?.hasMore):hasNext)} onClick={next}>›</button>}
 </div>
 {busy&&<p className="quiz-category-status" role="status">{c.loading}</p>}
 {state?.error&&<div className="quiz-category-status" role="alert">{copy.loadFailed} <button type="button" disabled={busy} onClick={()=>pagerRef.current?.loadMore(start+columns)}>{copy.retry}</button></div>}

 </section>;
}
export default function QuizCategorySections({lang,contentLanguage,sort,c}){
 const container=useRef(null),{columns,cardWidth,mobile}=useColumns(container),[visible,setVisible]=useState(3),copy=COPY[lang]||COPY.en;
 return <div ref={container} className="quiz-category-sections" style={{'--quiz-card-width':`${cardWidth}px`}} dir={lang==='ar'?'rtl':'ltr'}>{CATEGORIES.slice(0,visible).map((category,index)=><CategoryRow key={`${category}:${contentLanguage}:${sort}`} {...{category,index,columns,lang,contentLanguage,sort,copy,c,mobile}}/>)}{visible<CATEGORIES.length&&<button type="button" className="quiz-more-categories" onClick={()=>setVisible(value=>Math.min(CATEGORIES.length,value+2))}>{copy.moreCategories} ↓</button>}</div>;
}
