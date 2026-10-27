import React from 'react';
export default function AdminTodayContentStats({loading, quizCount, tierCount}) {
 return <>
  {[
   {key:'quiz',label:'오늘 퀴즈 플레이',count:quizCount,color:'#dc2626',note:'퀴즈 결과 저장 횟수 · 한국 시간 기준'},
   {key:'tier',label:'오늘 티어표 열람',count:tierCount,color:'#2563eb',note:'티어표 결과 페이지 열람 횟수 · 한국 시간 기준'},
  ].map(item=><div key={item.key} style={{background:'#f5f6fa',borderRadius:20,boxShadow:'0 4px 16px rgba(25,32,52,0.07)',minWidth:190,flex:'1 1 190px',maxWidth:240,padding:'30px 24px',textAlign:'center'}}>
   <div style={{fontSize:19,fontWeight:700,color:'#3b4872',marginBottom:8}}>{item.label}</div>
   <div style={{fontSize:42,fontWeight:900,color:item.color}}>{loading?'...':item.count==null?'집계 실패':item.count.toLocaleString()}</div>
   <p style={{fontSize:13,lineHeight:1.6,color:'#596579',margin:'12px 0 0'}}>{item.note}</p>
  </div>)}
 </>;
}
