import React,{useEffect,useRef,useState} from 'react';
import {getStatsImageSource,staticCandidateImage,pauseStatsImageTransforms} from '../utils/statsImageSource';
import {rememberLoadedImage} from '../utils/recentLoadedImages';
export default function StatsCandidateName({image,name,selected=false,isMobile=false}){
 const anchor=useRef(null);
 const [visible,setVisible]=useState(false),[failure,setFailure]=useState('');
 useEffect(()=>{setFailure('');},[image]);
 useEffect(()=>{
  if(visible)return undefined;
  if(typeof IntersectionObserver==='undefined'){setVisible(true);return undefined;}
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}
  },{rootMargin:'80px',threshold:0.01});
  if(anchor.current)observer.observe(anchor.current);
  return()=>observer.disconnect();
 },[visible]);
 const source=visible&&failure!=='all'?(failure==='thumbnail'?{url:staticCandidateImage(image),transformed:false}:getStatsImageSource(image)):{url:'',transformed:false};
 const size=isMobile?40:48;
 return <div style={{display:'flex',alignItems:'center',gap:isMobile?8:12,textAlign:'start',minWidth:0}}>
  <span ref={anchor} aria-hidden="true" style={{width:size,height:size,flex:`0 0 ${size}px`,display:'grid',placeItems:'center',overflow:'hidden',borderRadius:8,background:'#edf0f5',color:'#64748b',fontSize:20,fontWeight:700}}>
   {source.url?<img key={source.url} src={source.url} alt="" width={size} height={size} loading="lazy" decoding="async" onLoad={event=>rememberLoadedImage(event.currentTarget.currentSrc||source.url)} onError={()=>{
    if(source.transformed){pauseStatsImageTransforms();setFailure('thumbnail');}else setFailure('all');
   }} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>:[...String(name||'').trim()][0]||'—'}
  </span>
  <span title={name} style={{display:'-webkit-box',WebkitBoxOrient:'vertical',WebkitLineClamp:2,overflow:'hidden',overflowWrap:'anywhere',whiteSpace:'normal',lineHeight:1.4,minWidth:0}}>{selected?'✓ ':''}{name}</span>
 </div>;
}
