import React,{useEffect,useState} from 'react';
import {TOPICS} from './topNine/topics';
import {supabase} from '../utils/supabaseClient';
import {TEMPLATE_LANGUAGES} from '../utils/templateTitles';
import {listTemplates,searchSources} from './topNine/api';
function TemplateRow({cup,onSaved}) {
 const [topic,setTopic]=useState(cup.topic||'games'),[lang,setLang]=useState('en'),[titles,setTitles]=useState(cup.top_nine_title_translations||{}),[enabled,setEnabled]=useState(cup.enabled??true),[order,setOrder]=useState(cup.sort_order||0),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function save(){setBusy(true);setMessage('');try {
 const {error}=await supabase.rpc('save_top_nine_template',{p_source:cup.id,p_topic:topic,p_language:lang,p_title:titles[lang]||'',p_enabled:enabled,p_order:Number(order)});if(error)throw error;
 setMessage('저장했습니다. 다른 언어도 선택하여 입력 후 저장하세요.');onSaved();
 }catch(e){setMessage('저장 실패: '+e.message);}finally{setBusy(false);}}
 return <fieldset disabled={busy} style={{border:'1px solid #d8c9fa',borderRadius:10,padding:16,minWidth:0}}><legend>{cup.title}</legend>
 <label>기본 프리셋 <select value={topic} onChange={e=>setTopic(e.target.value)}>{TOPICS.map(([key,en,ko])=><option key={key} value={key}>{ko} / {en}</option>)}</select></label><br/><label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> 구절판 추천 템플릿 표시</label>{' '}
 <label>표시 순서 <input type="number" min="0" max="100000" value={order} onChange={e=>setOrder(e.target.value)} style={{width:80}}/></label>
 <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}><select aria-label="구절판 제목 언어" value={lang} onChange={e=>{setLang(e.target.value);setMessage('');}}>{TEMPLATE_LANGUAGES.map(([code,label])=><option key={code} value={code}>{label}</option>)}</select>
 <input aria-label="구절판 전용 제목" placeholder="예: My Top 9 Celebrities" value={titles[lang]||''} maxLength={140} onChange={e=>setTitles({...titles,[lang]:e.target.value})} style={{flex:'1 1 240px',padding:10,minWidth:0}}/>
 <button type="button" onClick={save}>{busy?'저장 중…':'이 언어 제목 · 설정 저장'}</button></div><p role="status">{message}</p>
 </fieldset>;
}
export default function TopNinePresetAdmin(){
 const [rows,setRows]=useState([]),[query,setQuery]=useState(''),[sources,setSources]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[tick,setTick]=useState(0);
 useEffect(()=>{let live=true;listTemplates(true).then(data=>{if(live)setRows(data);}).catch(e=>{if(live)setError('구절판 SQL 적용 여부를 확인하세요. '+e.message);});return()=>{live=false;};},[tick]);
 async function search(e){e.preventDefault();setBusy(true);setError('');try{setSources(await searchSources(query));}catch(e){setError(e.message);}finally{setBusy(false);}}
 const all=[...rows,...sources.filter(c=>!rows.some(r=>r.id===c.id))];
 return <section style={{border:'1px solid #d8c9fa',borderRadius:12,padding:20,margin:'30px 0'}}><h2>🟪 구절판 / My Top 9 추천 템플릿</h2>
 <p>원본 월드컵·티어표와 별개의 제목입니다. 각 언어를 입력한 뒤 해당 언어 저장을 누르세요. 번역이 없으면 영어 전용 제목, 그다음 원본 제목을 표시합니다.</p>
 <form onSubmit={search}><label>추가할 월드컵 검색 <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="원본 월드컵 제목"/></label> <button disabled={busy}>{busy?'검색 중…':'검색'}</button></form>
 {error&&<p role="alert">{error}</p>}<div style={{display:'grid',gap:14,marginTop:16}}>{all.map(c=><TemplateRow key={c.id} cup={c} onSaved={()=>setTick(t=>t+1)}/>)}</div>
 {!all.length&&!error&&<p>월드컵을 검색하여 추천 템플릿으로 추가하세요.</p>}
 </section>;
}
