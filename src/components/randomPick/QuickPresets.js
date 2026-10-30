import {localizeExtraUi} from "../../utils/newLanguageUi";
import React,{useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {MODES} from './copy';
import {encodeCandidates} from './sharedCandidates';
import {rowsFromNames} from './savedCandidates';
export default function QuickPresets({lang,copy}){
 const [selected,setSelected]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const navigate=useNavigate();const ko=lang==='ko';
 const presets=ko?[['🍪 간식 랜덤뽑기',['쿠키','감자칩','초콜릿','아이스크림','도넛','과일','떡','견과류']],['🍚 오늘 뭐 먹지?',['한식','중식','일식','분식','양식','샌드위치','쌀국수','샐러드']],['☕ 카페 메뉴',['아메리카노','카페라테','바닐라라테','차','스무디','초콜릿 음료']]]:[['🍪 Snack picker',['Cookies','Chips','Chocolate','Ice cream','Donut','Fruit','Rice cake','Nuts']],['🍚 What to eat?',['Korean','Chinese','Japanese','Pasta','Sandwich','Noodles','Salad','Pizza']],['☕ Cafe menu',['Americano','Latte','Vanilla latte','Tea','Smoothie','Hot chocolate']]];
 async function start(mode){if(busy)return;setBusy(true);setError('');try{const encoded=await encodeCandidates(rowsFromNames(selected[1].join('\n')),null);navigate(`/${lang}/random-pick/${mode}#candidates=${encodeURIComponent(encoded)}`);}catch{setError(ko?'다시 시도해 주세요.':localizeExtraUi('Please try again.'));}finally{setBusy(false);}}
 return <section style={{padding:22,border:'1px solid #ddd5ee',borderRadius:16,margin:'22px 0'}}><h2>{ko?'오늘 뭐 뽑을까요?':localizeExtraUi('What will you pick today?')}</h2><div style={{display:'flex',flexWrap:'wrap',gap:10}}>{presets.map(p=><button key={p[0]} type="button" disabled={busy} onClick={()=>setSelected(p)}>{localizeExtraUi(p[0],lang)}</button>)}</div>{selected&&<div><h3>{localizeExtraUi(selected[0],lang)} · {ko?'게임을 선택하세요':localizeExtraUi('Choose a game')}</h3><p>{selected[1].join(' · ')}</p><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{MODES.filter(m=>!['dice','slots','pirate'].includes(m)).map(m=><button type="button" disabled={busy} key={m} onClick={()=>start(m)}>{copy.modes[m]}</button>)}</div><button type="button" disabled={busy} onClick={()=>setSelected(null)}>{ko?'닫기':localizeExtraUi('Close')}</button></div>}{error&&<p role="alert">{error}</p>}</section>;
}
