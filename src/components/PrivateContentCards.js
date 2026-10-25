import homeCopy from '../seo/homeShellCopy.json';
import React,{useEffect,useRef,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {supabase} from '../utils/supabaseClient';
import Seo from '../seo/Seo';
import ContentNav from './ContentNav';
import {getCommunityUi} from './communityUi';
import './communityPublishing.css';
export default function PrivateContentCards({kind,user}){
 const {lang='en'}=useParams(),ui=getCommunityUi(lang),base=kind==='quiz'?'quiz':'tier-list';
 const [rows,setRows]=useState([]),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[search,setSearch]=useState(''),[term,setTerm]=useState('');const current=useRef([]),version=useRef(0),lock=useRef(false);
 useEffect(()=>{const id=setTimeout(()=>setTerm(search.trim()),300);return()=>clearTimeout(id);},[search]);
 async function load(reset=false){if(!user||(lock.current&&!reset))return;const ticket=reset?++version.current:version.current;lock.current=true;setBusy(true);setError('');try{const {data,error}=await supabase.rpc('get_my_content_cards',{p_kind:kind,p_offset:reset?0:current.current.length,p_search:term});if(ticket!==version.current)return;if(error)throw error;current.current=reset?data.items:[...current.current,...data.items];setRows(current.current);setMore(data.has_more);}catch(e){if(ticket===version.current)setError(e.message);}finally{if(ticket===version.current){lock.current=false;setBusy(false);}}}
 useEffect(()=>{current.current=[];setRows([]);setMore(false);load(true);return()=>{version.current++;lock.current=false;};},[kind,user?.id,term]);
 function title(item){let map=item.title_translations;if(typeof map==='string'){try{map=JSON.parse(map);}catch{map={};}}return map?.[lang]||map?.en||item.title;}
 return <><Seo lang={lang} slug={`${base}?mine=1`} title={`${ui.myContent} | OnePickGame`} description={ui.myContent} indexable={false}/><ContentNav active={base} user={user}/>{user&&<main className="site-publishing"><Link className="blog-write-link" to={`/${lang}/${base}/create`}>＋ {(homeCopy[lang]||homeCopy.en).modes[kind==='quiz'?2:1]}</Link><label>{ui.search}<input value={search} onChange={e=>setSearch(e.target.value)}/></label><section className="my-content-cards">{rows.map(item=><article key={item.id}><Link to={`/${lang}/${base}/${item.id}`}>{item.thumbnail_url&&<img loading="lazy" src={item.thumbnail_url} alt={title(item)}/>}<h2>{title(item)}</h2></Link><Link to={`/${lang}/${base}/${item.id}`}>{ui.open}</Link></article>)}</section>{!busy&&!error&&!rows.length&&<p>{ui.noPosts}</p>}{busy&&<p role="status">{ui.loading}</p>}{error&&<p role="alert">{error}<button onClick={()=>load(current.current.length===0)}>{ui.retry}</button></p>}{more&&<button disabled={busy} onClick={()=>load()}>{ui.more}</button>}</main>}</>;
}
