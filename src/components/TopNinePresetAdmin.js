import ThumbnailSetting from './topNine/ThumbnailSetting';
import {supabase} from '../utils/supabaseClient';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {TOPICS} from './topNine/topics';
import {loadAdminRows,saveAdminRows} from './topNine/adminApi';
import PresetTitleTranslations from './PresetTitleTranslations';
import {titleOf,enabledRows,reorderRows,moveRow,toggleRow,snapshot,changedPayloads} from './presetAdmin/model';
const buttonStyle={minWidth:36,minHeight:40,border:'1px solid #c4b5fd',borderRadius:7,background:'#f5f3ff',color:'#6d28d9',fontWeight:800,cursor:'pointer'};
export default function TopNinePresetAdmin(){
  const [rows,setRows]=useState([]),[baseline,setBaseline]=useState(()=>new Map()),[query,setQuery]=useState(''),[visible,setVisible]=useState(5),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[retry,setRetry]=useState(0),[dragged,setDragged]=useState(null),[dropTarget,setDropTarget]=useState(null);
  const [thumbnails,setThumbnails]=useState({});
  useEffect(()=>{let live=true;supabase.from('top_nine_thumbnails').select('source_worldcup_id,image_url').then(({data})=>{if(live)setThumbnails(Object.fromEntries((data||[]).map(row=>[row.source_worldcup_id,row.image_url])));});return()=>{live=false;};},[]);
  const drag=useRef(null),mounted=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{let live=true;setLoading(true);setError('');loadAdminRows().then(data=>{if(live){setRows(data);setBaseline(snapshot(data));}}).catch(e=>{if(live)setError('구절판 목록을 불러오지 못했어요. '+e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[retry]);
  const selected=useMemo(()=>enabledRows(rows),[rows]);
  const filtered=useMemo(()=>{const term=query.trim().toLowerCase();return [...rows].filter(row=>!term||[titleOf(row),...Object.values(row.title_translations||{}),...Object.values(row.top_nine_title_translations||{})].some(value=>String(value).toLowerCase().includes(term))).sort((a,b)=>Number(b.enabled)-Number(a.enabled)||(a.enabled?Number(a.sort_order)-Number(b.sort_order):Date.parse(b.created_at||0)-Date.parse(a.created_at||0))||String(a.id).localeCompare(String(b.id)));},[rows,query]);
  const changes=useMemo(()=>changedPayloads(rows,baseline),[rows,baseline]);
  const update=(id,patch)=>{setMessage('');setRows(previous=>previous.map(row=>String(row.id)===String(id)?{...row,...patch}:row));};
  const clearDrag=()=>{drag.current=null;setDragged(null);setDropTarget(null);};
  async function save(){if(saving||loading||!changes.length)return;setSaving(true);setError('');setMessage('');const captured=rows;try{await saveAdminRows(changes);if(mounted.current){setBaseline(snapshot(captured));setMessage(`추천 설정과 모든 언어 제목을 저장했어요. (${changes.length}개 변경)`);}}catch(e){if(mounted.current)setError('저장하지 못했어요. 입력한 내용은 유지됩니다. '+e.message);}finally{if(mounted.current)setSaving(false);}}
  return <section style={{border:'1px solid #d8c9fa',borderRadius:12,padding:20,margin:'30px 0',color:'#202534'}}>
    <h2>🟪 구절판 / My Top 9 추천 프리셋</h2>
    <p style={{lineHeight:1.7}}>추천할 월드컵을 선택하세요. 왼쪽 ⋮⋮ 손잡이를 드래그하거나 위·아래 버튼으로 순서를 바꿀 수 있어요. 현재 <strong>{selected.length}개 선택됨</strong></p>
    <p style={{lineHeight:1.7}}>각 항목의 ‘다른 언어 제목 펼치기’를 열어 번역을 입력한 뒤, 아래 저장 버튼을 한 번만 누르세요. 원본 월드컵·티어표 제목은 바뀌지 않아요. 번역이 없으면 영어 전용 제목, 그다음 원본 제목을 표시해요.</p>
    {loading&&<p role="status">불러오는 중…</p>}
    {error&&<p role="alert" style={{color:'#b42346',overflowWrap:'anywhere'}}>{error}</p>}
    {error&&loading===false&&rows.length===0&&<button style={buttonStyle} type="button" onClick={()=>setRetry(n=>n+1)}>다시 시도</button>}
    <fieldset disabled={saving||loading} style={{border:0,padding:0,minWidth:0,margin:0}}>
      <legend style={{position:'absolute',width:1,height:1,overflow:'hidden',clipPath:'inset(50%)'}}>구절판 추천 목록 편집</legend>
      <input aria-label="구절판 프리셋 검색" placeholder="원본 제목 또는 번역 제목 검색" value={query} onChange={e=>{setQuery(e.target.value);setVisible(5);}} style={{width:'100%',maxWidth:520,minHeight:40,padding:'8px 12px',boxSizing:'border-box',border:'1px solid #c4b5fd',borderRadius:8,marginBottom:15}}/>
      <div style={{display:'grid',gap:8}}>{filtered.slice(0,visible).map(row=>{const title=titleOf(row),position=selected.findIndex(item=>String(item.id)===String(row.id));return <div key={row.id} data-top-nine-preset-id={row.id}
        onDragOver={e=>{if(saving||!row.enabled||drag.current==null||String(drag.current)===String(row.id))return;e.preventDefault();e.dataTransfer.dropEffect='move';const rect=e.currentTarget.getBoundingClientRect();const after=e.clientY>rect.top+rect.height/2;setDropTarget(previous=>previous?.id===row.id&&previous.after===after?previous:{id:row.id,after});}}
        onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDropTarget(previous=>previous?.id===row.id?null:previous);}}
        onDrop={e=>{if(saving||!row.enabled||drag.current==null)return;e.preventDefault();const rect=e.currentTarget.getBoundingClientRect(),source=drag.current;setRows(previous=>reorderRows(previous,source,row.id,e.clientY>rect.top+rect.height/2));setMessage('');clearDrag();}}
        style={{display:'flex',alignItems:'flex-start',gap:10,padding:12,border:'1px solid #ddd6fe',borderRadius:8,minWidth:0,background:row.enabled?'#fdfcff':'#fff',opacity:dragged===row.id?0.5:1,boxShadow:dropTarget?.id===row.id?`inset 0 ${dropTarget.after?'-3px':'3px'} 0 #7c3aed`:'none'}}>
        {row.enabled&&<button type="button" draggable={!saving} aria-label={`${title} 순서 드래그`} title="드래그해서 추천 순서 변경" onDragStart={e=>{if(saving){e.preventDefault();return;}drag.current=row.id;setDragged(row.id);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(row.id));e.dataTransfer.setDragImage?.(e.currentTarget.parentElement,20,20);}} onDragEnd={clearDrag} style={{...buttonStyle,cursor:'grab',fontSize:22,flexShrink:0}}>⋮⋮</button>}
        <input type="checkbox" aria-label={`${title} 구절판 추천`} checked={row.enabled} onChange={()=>{setRows(previous=>toggleRow(previous,row.id));setMessage('');}} style={{marginTop:13,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}><strong style={{display:'block',overflowWrap:'anywhere',lineHeight:1.5}}>{title}</strong>
          {(row.enabled||Object.keys(row.top_nine_title_translations||{}).length>0)&&<>
            <label style={{display:'block',marginTop:10,fontSize:14,fontWeight:700}}>기본 프리셋 <select aria-label={`${title} 기본 프리셋`} value={row.topic} onChange={e=>update(row.id,{topic:e.target.value})} style={{maxWidth:'100%',padding:6,border:'1px solid #c4b5fd',borderRadius:6}}>{TOPICS.map(([key,en,ko])=><option key={key} value={key}>{ko} / {en}</option>)}</select></label>
            <ThumbnailSetting id={row.id} url={thumbnails[row.id]||''} disabled={saving} onSaved={url=>setThumbnails(old=>({...old,[row.id]:url}))}/>
            <PresetTitleTranslations title={title} value={row.top_nine_title_translations} primaryLanguage="en" disabled={saving} placeholder="예: My Top 9 Games" onChange={titles=>update(row.id,{top_nine_title_translations:titles})}/>
          </>}
        </div>
        {row.enabled&&<div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end',maxWidth:112}}><span aria-label="추천 순서" style={{minWidth:18,textAlign:'center',fontWeight:800}}>{position+1}</span>{[-1,1].map(delta=><button key={delta} type="button" disabled={saving||(delta<0?position===0:position===selected.length-1)} aria-label={`${title} ${delta<0?'위로':'아래로'}`} onClick={()=>{setRows(previous=>moveRow(previous,row.id,delta));setMessage('');}} style={buttonStyle}>{delta<0?'↑':'↓'}</button>)}</div>}
      </div>;})}</div>
      {!loading&&!filtered.length&&<p style={{textAlign:'center'}}>검색 결과가 없어요.</p>}
      {visible<filtered.length&&<div style={{textAlign:'center',marginTop:15}}><button type="button" style={{...buttonStyle,padding:'8px 28px'}} onClick={()=>setVisible(n=>n+5)}>더보기 ↓</button><p style={{fontSize:13}}>{Math.min(visible,filtered.length)} / {filtered.length}개 표시 중</p></div>}
      <button type="button" disabled={saving||loading||!changes.length} onClick={save} style={{marginTop:18,padding:'12px 20px',border:0,borderRadius:8,background:'#7c3aed',color:'#fff',fontWeight:800,cursor:'pointer',opacity:changes.length?1:0.6}}>{saving?'저장 중…':`변경사항 한 번에 저장${changes.length?` (${changes.length}개)`:''}`}</button>
    </fieldset>
    {message&&<p role="status">{message}</p>}
  </section>;
}
