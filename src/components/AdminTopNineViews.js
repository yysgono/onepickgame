import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from '../utils/supabaseClient';
import {localizedBoardTitle,loadBoardTitleSources} from './topNine/localizedTitle';
const count=value=>Number.isSafeInteger(Number(value))&&Number(value)>=0&&value!==null&&value!==undefined;
export default function AdminTopNineViews({refreshTick=0}){
 const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let live=true;setLoading(true);setError('');setData(null);
  Promise.resolve().then(()=>supabase.rpc('get_admin_top_nine_views_v1')).then(async({data,error})=>{
   if(error)throw error;
   if(!data||!count(data.total)||!count(data.today)||!Array.isArray(data.recent))throw Error('통계 응답을 확인하지 못했습니다.');
   let recent=data.recent;
   const ids=[...new Set(recent.map(row=>row.board_id).filter(Boolean))];
   if(ids.length){
    try{
     const result=await supabase.from('top_nine_public_boards').select('id,title,source_worldcup_ids,title_is_custom').in('id',ids);
     if(!result.error&&Array.isArray(result.data)){
      const boards=result.data,sources=await loadBoardTitleSources(supabase,boards),byId=new Map(boards.map(board=>[String(board.id),board]));
      recent=recent.map(row=>{const board=byId.get(String(row.board_id));return board?{...row,title:localizedBoardTitle({...board,title:row.title||board.title},sources,'ko')}:row;});
     }
    }catch{ /* Keep statistics available if optional title metadata cannot be read. */ }
   }
   if(live)setData({...data,recent});
  }).catch(failure=>{if(live)setError(['PGRST202','42883','42P01'].includes(failure.code)?'구절판 열람 통계 SQL을 먼저 적용해 주세요.':'구절판 열람 통계를 불러오지 못했습니다. 관리자 권한과 연결 상태를 확인해 주세요.');}).finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[refreshTick,retry]);
 return <section className="admin-top-nine-views" style={{margin:'28px 0 32px',padding:'clamp(18px,3vw,28px)',border:'1px solid #ded3f2',borderRadius:16,background:'#faf7ff'}}>
  <h3 style={{margin:'0 0 18px',color:'#654299'}}>구절판 취향표 열람 통계</h3>
  {loading?<p role="status">통계 불러오는 중...</p>:error?<div role="alert"><p>{error}</p><button type="button" onClick={()=>setRetry(n=>n+1)}>다시 시도</button></div>:data&&<>
   <div style={{display:'flex',flexWrap:'wrap',gap:16}}>{[['누적 조회수',data.total],['오늘 열람 수',data.today]].map(([label,value])=><div key={label} style={{flex:'1 1 200px',background:'#fff',border:'1px solid #e6def0',borderRadius:12,padding:18,textAlign:'center'}}><div style={{fontWeight:700,color:'#665577'}}>{label}</div><strong style={{display:'block',fontSize:32,color:'#7139ce',marginTop:8}}>{Number(value).toLocaleString('ko-KR')}회</strong></div>)}</div>
   <p style={{fontSize:13,lineHeight:1.7,color:'#70627e'}}>누적은 현재 공개된 취향표의 조회수 합계, 오늘은 한국 시간 {data.today_date}에 기록된 열람입니다. 같은 탭 세션에서 같은 구절판은 한 번 집계하며, 등록·나만 보기 완료 수와는 다릅니다.</p>
   <h4 style={{fontSize:18,margin:'24px 0 14px'}}>최근 열람된 구절판 · 최근 30건</h4>
   {data.recent.length?<div style={{maxHeight:430,overflowY:'auto'}}>{data.recent.map(row=><Link key={row.id} to={'/ko/mytop9/'+encodeURIComponent(row.board_id)} style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:'8px 16px',padding:'12px 14px',marginBottom:8,border:'1px solid #e6def0',borderRadius:10,background:'#fff',color:'#342842',textDecoration:'none'}}><strong style={{flex:'1 1 220px',overflowWrap:'anywhere'}}>{row.title}</strong><span style={{fontSize:13,color:'#755d89'}}>누적 {Number(row.view_count||0).toLocaleString('ko-KR')}회</span><time dateTime={row.viewed_at} style={{fontSize:13,color:'#755d89'}}>{new Date(row.viewed_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</time></Link>)}</div>:<p>아직 기록된 구절판 열람이 없습니다.</p>}
   <p style={{fontSize:12,lineHeight:1.7,color:'#70627e'}}>최근 기록은 공개 결과 페이지의 기존 조회 기록을 사용합니다. 기록되지 않았던 과거 열람은 복원하지 않습니다. 삭제된 구절판과 나만 보기·템플릿 화면 열람은 포함하지 않습니다. 열람 기록 시작: {data.started_at?new Date(data.started_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'아직 기록 없음'} (KST)</p>
  </>}
 </section>;
}
