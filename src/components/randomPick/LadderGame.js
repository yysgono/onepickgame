import React,{useEffect,useMemo,useRef,useState} from 'react';
import {shuffle} from '../../utils/randomPickCore';
import {makeLadder,ladderPath,pathLength,pathAtDistance} from './gameRules';
const colors=['#e56d6d','#328ac6','#9c62ce','#d08b20','#198b66','#dd6898'];
export default function LadderGame({rows,count,copy,onBusy}){
 const container=useRef(null),[availableWidth,setAvailableWidth]=useState(0);
 useEffect(()=>{const el=container.current;if(!el)return;const measure=()=>setAvailableWidth(el.clientWidth);measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[]);
 const signature=rows.map(r=>r.id).join('|');
 const [runId,setRunId]=useState(0);
 const [top,setTop]=useState([]),[bottom,setBottom]=useState([]),[rungs,setRungs]=useState([]),[active,setActive]=useState(null),[distance,setDistance]=useState(0),[all,setAll]=useState(false),[hidden,setHidden]=useState(false),[skip,setSkip]=useState(false);
 const callback=useRef(onBusy);callback.current=onBusy;
 useEffect(()=>{const sample=shuffle(rows).slice(0,count);setTop(sample.map(r=>({...r})));setBottom(sample.map((_,i)=>String(i+1)));setRungs(sample.length>=2?makeLadder(sample.length):[]);setActive(null);setAll(false);setDistance(0);callback.current(false);},[signature,count]); // stable random subset; name edits synchronize separately
 useEffect(()=>setTop(old=>old.map(row=>({...row,name:rows.find(r=>r.id===row.id)?.name||row.name}))),[rows]);
 const width=Math.max(230,top.length*110+10,availableWidth),gap=(width-10)/Math.max(1,top.length);
 const paths=useMemo(()=>top.map((_,i)=>ladderPath(top.length,rungs,i,gap)),[top.length,rungs,gap]);
 const length=active===null?0:pathLength(paths[active]?.points||[[0,0]]),busy=active!==null&&distance<length&&!all;
 useEffect(()=>{callback.current(busy);return()=>callback.current(false);},[busy]);
 useEffect(()=>{if(active===null||all)return;let frame,last=performance.now(),live=true,travel=0;const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;function tick(now){if(!live)return;travel+=document.visibilityState==='hidden'?0:Math.min(.05,(now-last)/1000)*230;last=now;setDistance(skip||reduced?length:Math.min(length,travel));if(travel<length&&!skip&&!reduced)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);return()=>{live=false;cancelAnimationFrame(frame);};},[active,length,skip,rungs,all,runId]);
 function trace(i){if(busy)return;setRunId(v=>v+1);setActive(i);setDistance(0);setSkip(false);setAll(false);}
 function rebuild(){setRungs(makeLadder(top.length));setActive(null);setDistance(0);setAll(false);setSkip(false);}
 const points=p=>p.map(point=>point.join(',')).join(' ');
 return <section className="rp-ladder-game"><div className="rp-actions"><button disabled={busy||top.length<2} onClick={rebuild}>{copy.resetLadder}</button><button aria-pressed={hidden} onClick={()=>setHidden(v=>!v)}>{hidden?copy.showPreview:copy.hidePreview}</button><button disabled={top.length<2} onClick={()=>{setAll(true);setDistance(length);}}>{copy.allResults}</button>{busy&&<button onClick={()=>{setSkip(true);setDistance(length);}}>{copy.skip}</button>}</div><p>{copy.ladderHelp}</p>
 <div className="rp-ladder-scroll" ref={container}><div style={{width,minWidth:'100%'}}><div className="rp-ladder-labels" style={{gridTemplateColumns:`repeat(${top.length},minmax(0,1fr))`}}>{top.map((row,i)=><div key={row.id}><input aria-label={`${copy.name} ${i+1}`} value={row.name} disabled={busy} maxLength={120} onChange={e=>{const name=e.target.value;setTop(old=>old.map((r,j)=>i===j?{...r,name}:r));}}/><button disabled={busy} onClick={()=>trace(i)}>{i+1} ▾</button></div>)}</div>
 <svg viewBox={`0 0 ${width} 840`} width="100%" height="840" preserveAspectRatio="none" role="img" aria-label={copy.modes.ladder}>
 <g style={{filter:hidden?'blur(9px)':undefined}} stroke="#b0c7be" strokeWidth="5" fill="none">{top.map((_,i)=><path key={i} d={`M${5+gap/2+i*gap} 60V780`}/>)}{rungs.map((r,i)=><path key={i} d={`M${5+gap/2+r.left*gap} ${60+r.y*660/(rungs.length+1)}h${gap}`}/>)}</g>
 {(all?paths:active===null?[]:[paths[active]]).map((path,i)=><polyline key={i} points={points(all?path.points:pathAtDistance(path.points,distance))} stroke={colors[(all?i:active)%colors.length]} strokeWidth="6" strokeLinejoin="round" fill="none"/>)}
 </svg><div className="rp-ladder-labels" style={{gridTemplateColumns:`repeat(${top.length},minmax(0,1fr))`}}>{bottom.map((value,i)=><input key={i} aria-label={`${copy.outcomes} ${i+1}`} maxLength={120} disabled={busy} value={value} onChange={e=>{const value=e.target.value;setBottom(old=>old.map((x,j)=>i===j?value:x));}}/>)}</div></div></div>
 {(all||(active!==null&&!busy))&&<div className="rp-result" aria-live="polite"><h2>{copy.result}</h2><ul>{(all?top: [top[active]]).map((row,i)=>{const index=all?i:active;return <li key={row.id} style={{color:colors[index%colors.length]}}>{row.name} → {bottom[paths[index].end]}</li>;})}</ul></div>}
 </section>;
}
