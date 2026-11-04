import React from 'react';
import { TEMPLATE_LANGUAGES } from '../utils/templateTitles';
export default function PresetTitleTranslations({title,value={},onChange,disabled=false,primaryLanguage='ko',placeholder='추천 카드 제목'}) {
  const input=(code,label)=><label key={code} style={{display:'grid',gap:5,minWidth:0,fontSize:13,fontWeight:700,whiteSpace:'normal'}}>{label}<input
    aria-label={`${title} 추천 카드 제목 (${code})`} value={value[code]||''} maxLength={140} disabled={disabled}
    placeholder={placeholder} onChange={event=>onChange({...value,[code]:event.target.value})}
    style={{width:'100%',boxSizing:'border-box',minHeight:40,padding:'8px 10px',border:'1px solid #a5b4fc',borderRadius:7,color:'#111827',background:'#fff',font:'inherit',fontSize:15}}
  /></label>;
  const rest=TEMPLATE_LANGUAGES.filter(([code])=>code!==primaryLanguage);
  return <div style={{marginTop:8,minWidth:0,whiteSpace:'normal',textAlign:'left'}}>
    {input(primaryLanguage,TEMPLATE_LANGUAGES.find(([code])=>code===primaryLanguage)?.[1]||primaryLanguage)}
    <details style={{marginTop:10}}><summary style={{cursor:'pointer',fontSize:14,fontWeight:800,color:'#5542b8',padding:'6px 0'}}>다른 언어 제목 펼치기 · {rest.length}개 언어</summary>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 230px),1fr))',gap:12,padding:'12px 0'}}>{rest.map(([code,label])=>input(code,label))}</div>
    </details>
  </div>;
}
