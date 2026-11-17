import {useEffect,useRef,useState} from 'react';
export const normalizeTopNineSearch=value=>String(value||'').normalize('NFC').trim().slice(0,100);
export default function useTopNineLiveSearch(query,fetchRows,{enabled=true,composing=false,delay=300}={}){
 const normalized=normalizeTopNineSearch(query),[term,setTerm]=useState(''),[rows,setRows]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(false),[more,setMore]=useState(false),[offset,setOffset]=useState(0),[submitted,setSubmitted]=useState(0);
 const composingBlocked=composing&&!/[가-힣]$/.test(normalized);
 const generation=useRef(0),abort=useRef(null),immediate=useRef(false);
 useEffect(()=>{
  const version=++generation.current;abort.current?.abort();
  if(!enabled||!normalized){immediate.current=false;setTerm('');setRows([]);setOffset(0);setMore(false);setError(false);setLoading(false);return;}
  if(composingBlocked){immediate.current=false;setLoading(false);return;}
  let live=true;const controller=new AbortController();abort.current=controller;
  const timer=setTimeout(async()=>{
   if(!live)return;setTerm(normalized);setRows([]);setOffset(0);setMore(false);setError(false);setLoading(true);
   try{const result=await fetchRows(normalized,0,{signal:controller.signal});if(live&&generation.current===version){setRows(result);setMore(result.length===30);}}
   catch(failure){if(live&&generation.current===version&&failure?.name!=='AbortError')setError(true);}
   finally{if(live&&generation.current===version)setLoading(false);}
  },immediate.current?0:delay);immediate.current=false;
  return()=>{live=false;generation.current++;clearTimeout(timer);controller.abort();abort.current?.abort();};
 },[normalized,enabled,composingBlocked,delay,submitted,fetchRows]);
 async function loadMore(){
  if(loading||!more||composingBlocked||normalized!==term)return;
  const version=generation.current,next=offset+30,controller=new AbortController();abort.current=controller;setLoading(true);setError(false);
  try{const result=await fetchRows(term,next,{signal:controller.signal});if(generation.current===version){setRows(old=>[...new Map(old.concat(result).map(row=>[String(row.id),row])).values()]);setOffset(next);setMore(result.length===30);}}
  catch(failure){if(generation.current===version&&failure?.name!=='AbortError')setError(true);}
  finally{if(generation.current===version)setLoading(false);}
 }
 return {term,rows,loading,error,more,loadMore,pending:enabled&&(composingBlocked||normalized!==term||loading),submit(){immediate.current=true;setSubmitted(v=>v+1);}};
}
