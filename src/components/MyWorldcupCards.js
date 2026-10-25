import homeCopy from '../seo/homeShellCopy.json';
import {getCommunityUi} from './communityUi';
import React,{useEffect,useRef,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {supabase} from '../utils/supabaseClient';
import ContentNav from './ContentNav';
import Seo from '../seo/Seo';
import './communityPublishing.css';
export default function MyWorldcupCards({user,onDelete}){
 const {lang='en'}=useParams(),ko=lang==='ko';const ui=getCommunityUi(lang);const [items,setItems]=useState([]),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[search,setSearch]=useState(''),[term,setTerm]=useState('');const rows=useRef([]),version=useRef(0),locked=useRef(false);
 useEffect(()=>{const id=setTimeout(()=>setTerm(search.trim()),300);return()=>clearTimeout(id);},[search]);
 async function load(reset=false){if(!user||(locked.current&&!reset))return;const v=reset?++version.current:version.current;locked.current=true;setBusy(true);setError('');try{const {data,error}=await supabase.rpc('get_my_worldcup_cards',{p_offset:reset?0:rows.current.length,p_search:term});if(v!==version.current)return;if(error)throw error;rows.current=reset?data.items:[...rows.current,...data.items];setItems(rows.current);setMore(data.has_more);}catch(e){if(v===version.current)setError(e.message);}finally{if(v===version.current){locked.current=false;setBusy(false);}}}
 useEffect(()=>{rows.current=[];setItems([]);setMore(false);load(true);return()=>{version.current++;locked.current=false;};},[user?.id,term]);
 function name(c){let map=c.title_translations;if(typeof map==='string'){try{map=JSON.parse(map);}catch{map={};}}return map?.[lang]||map?.en||c.title;}
 async function remove(id){if(!window.confirm(ui.confirmDelete))return;try{await onDelete(id);load(true);}catch(e){setError(e.message);}}
 return <><Seo lang={lang} slug="my-worldcups" title={ui.myContent} description="My content" indexable={false}/><ContentNav active="worldcup" user={user}/>{user&&<main className="site-publishing"><Link className="blog-write-link" to={`/${lang}/worldcup-maker`}>＋ {(homeCopy[lang]||homeCopy.en).create}</Link><label>{ui.search}<input value={search} onChange={e=>setSearch(e.target.value)}/></label><section className="my-content-cards">{items.map(c=><article key={c.id}><Link to={`/${lang}/select-round/${c.id}`}>{c.image&&<img loading="lazy" src={c.image} alt={name(c)}/>}<h2>{name(c)}</h2></Link><Link to={`/${lang}/edit-worldcup/${c.id}`}>{ui.edit}</Link> <button onClick={()=>remove(c.id)}>{ui.delete}</button></article>)}</section>{error&&<p role="alert">{error}<button onClick={()=>load(rows.current.length===0)}>{ui.retry}</button></p>}{busy&&<p role="status">{ui.loading}</p>}{!busy&&!error&&!items.length&&<p>{ui.noPosts}</p>}{more&&<button disabled={busy} onClick={()=>load()}>{ui.more}</button>}</main>}</>;
}
