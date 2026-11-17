import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from '../../utils/supabaseClient';
import discovery from '../../seo/templateDiscovery';
import MediaRenderer from '../MediaRenderer';
import {BoardThumbnail} from '../topNine/PublicBoards';
import layout from '../topNine/collageLayout';
import './templateDiscovery.css';
function bootstrap(id,kind,lang){try{const value=JSON.parse(document.getElementById('template-discovery-data')?.textContent||'null');return value?.id===id&&value.kind===kind&&value.lang===lang?value.groups:null;}catch{return null;}}
function Card({row,source=false,kind}){
 const collage=row.slots?.some(Boolean);
 return <Link className={'td-card'+(source?' td-source-card':'')} to={row.href}>
  <div className={'td-card-media'+(collage?' td-card-media--collage':'')}>
   {source&&row.images?.length?<div className={'td-source-images'+(row.images.length===1?' td-source-single':'')}>{row.images.map((url,index)=><MediaRenderer key={index+':'+url} url={url} alt="" playable={false} loading="lazy" deferUntilVisible style={{width:'100%',height:'100%',objectFit:'cover'}}/>)}{row.images.length>1&&<b className="td-versus" aria-hidden="true">VS</b>}</div>:collage?<div className="td-collage">{row.slots.map((slot,index)=><div className="td-collage-cell" key={index} style={layout.layouts[index]?.style}>{slot&&<BoardThumbnail candidate={slot} index={index}/>}</div>)}<svg viewBox="0 0 100 100" aria-hidden="true"><path d={layout.boundaryPath} vectorEffect="non-scaling-stroke"/></svg></div>:row.image?<MediaRenderer url={row.image} alt="" playable={false} loading="lazy" deferUntilVisible style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 25%'}}/>:<span className="td-card-placeholder" aria-hidden="true">{source?'🏆':kind==='tier'?'📊':'▦'}</span>}
  </div>
  <div className="td-card-caption"><strong title={row.label}>{row.label}</strong></div>
 </Link>;
}
function CardRail({title,rows,kind,lang,copy}){
 const rail=useRef(null),key=(rows||[]).map(row=>row.href).join('|');
 const [selection,setSelection]=useState({key,page:0});
 const pages=Math.max(1,Math.ceil((rows?.length||0)/5));
 const page=selection.key===key?Math.min(selection.page,pages-1):0;
 useEffect(()=>{const node=rail.current;if(node){if(typeof node.scrollTo==='function')node.scrollTo({left:0,behavior:'auto'});else node.scrollLeft=0;}},[key,page]);
 if(!rows?.length)return null;
 const rtl=lang==='ar',move=direction=>setSelection(previous=>({key,page:Math.max(0,Math.min(pages-1,(previous.key===key?previous.page:0)+direction))}));
 return <div className="td-group"><h2>{title}</h2><div className="td-rail-frame">
  <button className="td-scroll-btn" type="button" aria-label={title+' · '+copy.previous} disabled={page===0} onClick={()=>move(-1)}>{rtl?'›':'‹'}</button>
  <ul className="td-card-rail" ref={rail}>{rows.slice(page*5,page*5+5).map(row=><li key={row.href}><Card row={row} kind={kind}/></li>)}</ul>
  <button className="td-scroll-btn" type="button" aria-label={title+' · '+copy.next} disabled={page===pages-1} onClick={()=>move(1)}>{rtl?'‹':'›'}</button>
 </div><div className="td-page-count" aria-live="polite" aria-atomic="true">{page+1} / {pages}</div></div>;
}
export default function TemplateDiscovery({cup,kind,lang}){
 const id=cup?.id,category=cup?.category,key=JSON.stringify([id,kind,lang]);
 const [state,setState]=useState(()=>({key,groups:bootstrap(id,kind,lang)}));
 const candidates=cup?.data,complete=!cup?._homeCardOnly&&Array.isArray(candidates)&&candidates.length>0;
 const [sourcePreview,setSourcePreview]=useState(null);
 useEffect(()=>{
  if(!complete||typeof discovery.loadSourcePreview!=='function')return;
  let alive=true;
  discovery.loadSourcePreview(supabase,cup).then(result=>{if(alive&&['ready','empty'].includes(result.status))setSourcePreview({key,candidates,images:result.images});}).catch(()=>{});
  return()=>{alive=false;};
 },[key,id,candidates,complete]);

 useEffect(()=>{
  let alive=true;const initial=bootstrap(id,kind,lang);
  if(initial){setState({key,groups:initial});return()=>{alive=false;};}
  discovery.load(supabase,cup,kind,lang).then(groups=>{if(alive)setState({key,groups});}).catch(()=>{if(alive)setState({key,groups:null});});
  return()=>{alive=false;};
 },[id,category,kind,lang,key]);
 const groups=state.key===key?state.groups:null,c=discovery.COPY[lang]||discovery.COPY.en;if(!groups)return null;
 return <section className="template-discovery" aria-label={c.title} dir={lang==='ar'?'rtl':undefined}>
  {groups.source&&<div className="td-group td-source-group"><h2>{c.source}</h2><Card row={{...groups.source,images:sourcePreview?.key===key&&sourcePreview.candidates===candidates?sourcePreview.images:groups.source.images}} source kind={kind}/></div>}
  <CardRail title={c[kind+'Works']} rows={groups.works} kind={kind} lang={lang} copy={c}/>
  <CardRail title={c.related} rows={groups.templates} kind={kind} lang={lang} copy={c}/>
 </section>;
}
