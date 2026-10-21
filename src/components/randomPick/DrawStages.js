import React,{useEffect,useRef,useState} from 'react';
import {randomInt} from '../../utils/randomPickCore';
import {reelSequence} from './reelSequence';
import {makeOrderRace,stepOrderRace,STEP} from './orderRaceRules';
const colors=['#68caa7','#f5bd67','#d69dcc','#78bcee','#ada2e8','#e98e87'];
export function CandidatePicture({row}){const [bad,setBad]=useState(false);useEffect(()=>setBad(false),[row?.image]);return row?.image&&!bad?<img src={row.image} alt="" onError={()=>setBad(true)}/>:<span className="rp-picture-text">{row?.name||'?'}</span>;}
export function CardStage({rows,draw,done,onDone,copy}){
 const [position,setPosition]=useState(0),[animate,setAnimate]=useState(false),callback=useRef(onDone);callback.current=onDone;
 const target=28,duration=6;
 const cards=draw?reelSequence(draw.pool,draw.winner,target,target+6):rows;
 useEffect(()=>{setAnimate(false);setPosition(0);if(!draw)return;let raf,timer;raf=requestAnimationFrame(()=>{raf=requestAnimationFrame(()=>{setAnimate(true);setPosition(target);});});timer=setTimeout(()=>callback.current(),duration*1000+200);return()=>{cancelAnimationFrame(raf);clearTimeout(timer);};},[draw?.token]);
 return <div className="rp-carousel"><div className="rp-carousel-pointer">▼</div><div className="rp-carousel-track" style={{transform:`translateX(calc(50% - 110px - ${done?target:position} * 238px))`,transition:animate&&!done?`transform ${duration}s cubic-bezier(.12,.5,.12,1)`:'none'}}>{cards.map((row,i)=><article key={`${row.id}:${i}`} className={done&&i===target?'winner':''}><CandidatePicture row={row}/>{row.image&&<strong>{row.name}</strong>}<small>ONE PICK GAME</small></article>)}</div>{!rows.length&&<p className="rp-empty-stage">{copy.minimum}</p>}</div>;
}
const faceTurns={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
const pips={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
export function DiceStage({draw,count,onFinish,copy}){
 const [faces,setFaces]=useState([1,2,3]),[turns,setTurns]=useState([[0,0],[0,0],[0,0]]),[rolling,setRolling]=useState(false),callback=useRef(onFinish);callback.current=onFinish;
 useEffect(()=>{if(!draw){setRolling(false);return;}setRolling(true);const next=Array.from({length:count},()=>randomInt(6)+1);setFaces(next);let frame;frame=requestAnimationFrame(()=>setTurns(old=>next.map((face,i)=>{const [x,y]=faceTurns[face];return [Math.ceil((old[i]?.[0]||0)/360)*360+1080+randomInt(3)*360+x,Math.ceil((old[i]?.[1]||0)/360)*360+1080+randomInt(3)*360+y];})));const end=setTimeout(()=>{setRolling(false);callback.current(next,draw.token);},2800);return()=>{cancelAnimationFrame(frame);clearTimeout(end);};},[draw?.token,count]);
 return <div className="rp-dice-table"><div className="rp-dice-row">{Array.from({length:count},(_,i)=><div className={`rp-dice-flight ${rolling?'rolling':''}`} key={i} style={{'--delay':`${i*65}ms`}}><div className="rp-dice-scene"><div className="rp-dice-cube" style={{transform:`rotateX(${turns[i]?.[0]||0}deg) rotateY(${turns[i]?.[1]||0}deg)`}} role="img" aria-label={rolling?copy.loading:String(faces[i]||1)}>{[1,2,3,4,5,6].map(face=><div key={face} className={`rp-dice-face face-${face}`} aria-hidden="true">{Array.from({length:9},(_,j)=><i key={j} className={pips[face].includes(j+1)?'pip':''}/>)}</div>)}</div></div></div>)}</div><p>{copy.modes.dice}</p></div>;
}
export function OrderRace({draw,rows,onFinish,fast,copy}){
 const [positions,setPositions]=useState([]),[arrived,setArrived]=useState([]),callback=useRef(onFinish),raceRef=useRef(null),lanesRef=useRef(null);callback.current=onFinish;
 useEffect(()=>{raceRef.current=draw?makeOrderRace(draw.pool,draw.seed):null;setPositions(raceRef.current?.runners||[]);setArrived([]);},[draw?.token]);
 useEffect(()=>{if(!draw)return;let frame,live=true,last=performance.now(),accumulator=0;
 function tick(now){if(!live)return;const race=raceRef.current;if(!race)return;accumulator+=document.visibilityState==='hidden'?0:Math.min(.05,(now-last)/1000);last=now;
 let steps=fast?120:Math.floor(accumulator/STEP);if(!fast)accumulator-=steps*STEP;
 for(let s=0;s<steps&&race.order.length<race.runners.length;s++)stepOrderRace(race);
 setPositions(race.runners.map(r=>({...r})));setArrived([...race.order]);if(race.order.length===race.runners.length){callback.current([...race.order],draw.token);return;}frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);return()=>{live=false;cancelAnimationFrame(frame);};},[draw?.token,fast]);
 return <div className="rp-race-track rp-race-horizontal"><div className="rp-race-finish">{copy.result} ▰ ▱ ▰ ▱ ▰ ▱</div>{rows.length>6&&<div className="rp-race-scroll-controls"><button onClick={()=>lanesRef.current?.scrollBy({top:-500,behavior:'smooth'})}>↑ {copy.scrollUp}</button><button onClick={()=>lanesRef.current?.scrollBy({top:500,behavior:'smooth'})}>↓ {copy.scrollDown}</button></div>}<div className="rp-race-lanes" ref={lanesRef} tabIndex={0} role="region" aria-label={copy.participants}>{(draw?positions:rows.map(row=>({row,distance:0,done:false}))).map((r,i)=><div className="rp-runner-lane" key={r.row.id}><div className="rp-runner" style={{left:`calc(${10-Math.min(1,r.distance/1400)*130}px + ${Math.min(1,r.distance/1400)*100}%)`,background:colors[i%6]}}><strong>{r.row.name}</strong>{r.done&&<b>#{arrived.findIndex(x=>x.id===r.row.id)+1}</b>}</div></div>)}</div></div>;
}
