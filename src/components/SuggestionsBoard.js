import headerLabels from './headerCommunityCopy.json';
import {getCommunityUi} from './communityUi';
import React,{useEffect,useRef,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {supabase} from '../utils/supabaseClient';
import Seo from '../seo/Seo';
import {useSitePublisher} from './SitePublishing';
import './communityPublishing.css';
export default function SuggestionsBoard({user,adminView=false}){
 const {lang='en'}=useParams(),ko=lang==='ko',admin=useSitePublisher();
 const ui=getCommunityUi(lang);
 const [title,setTitle]=useState(''),[body,setBody]=useState(''),[items,setItems]=useState([]),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[replies,setReplies]=useState({}),[sent,setSent]=useState(false);
 const rows=useRef([]),version=useRef(0),lock=useRef(false);
 async function load(reset=false){if(!user||(adminView&&!admin)||(lock.current&&!reset))return;const v=reset?++version.current:version.current;lock.current=true;setBusy(true);setError('');try{let q=supabase.from('site_suggestions').select('id,title,body,language,reply,created_at,replied_at');if(!adminView)q=q.eq('author_id',user.id);const {data,error}=await q.order('created_at',{ascending:false}).order('id',{ascending:false}).range(reset?0:rows.current.length,(reset?0:rows.current.length)+12);if(v!==version.current)return;if(error)throw error;setMore(data.length>12);rows.current=reset?data.slice(0,12):[...rows.current,...data.slice(0,12)];setItems(rows.current);}catch(e){if(v===version.current)setError(e.message);}finally{if(v===version.current){lock.current=false;setBusy(false);}}}
 useEffect(()=>{rows.current=[];setItems([]);setMore(false);load(true);return()=>{version.current++;lock.current=false;};},[user?.id,adminView,admin]);
 async function save(e){e.preventDefault();if(!user||saving)return;setSaving(true);setError('');try{const {error}=await supabase.from('site_suggestions').insert({author_id:user.id,language:lang,title:title.trim(),body:body.trim()});if(error)throw error;setTitle('');setBody('');setSent(true);await load(true);}catch(e){setError(e.message);}finally{setSaving(false);}}
 async function reply(id){const text=(replies[id]||'').trim();if(!text||saving)return;setSaving(true);setError('');try{const {error}=await supabase.rpc('reply_site_suggestion',{p_id:id,p_reply:text});if(error)throw error;setReplies(v=>({...v,[id]:''}));await load(true);}catch(e){setError(e.message);}finally{setSaving(false);}}
 return <main className="site-publishing"><Seo lang={lang} slug={adminView?'admin-suggestions':'suggestions'} title={(headerLabels[lang]||headerLabels.en)[4]} description="Private feedback" indexable={false}/><h1>{adminView?(ui.inbox):((headerLabels[lang]||headerLabels.en)[4])}</h1>{!user?<Link to={`/${lang}/login`}>{ui.loginRequired}</Link>:adminView&&!admin?<p>{ui.publisherOnly}</p>:<>
 {admin&&!adminView&&<Link className="blog-write-link" to={`/${lang}/admin-suggestions`}>{ui.inbox}</Link>}
 {!adminView&&<><p>{ui.privateHint}</p><form onSubmit={save}><label>{ui.title}<input required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>{ui.content}<textarea required maxLength={10000} value={body} onChange={e=>setBody(e.target.value)}/></label><button disabled={saving}>{saving?'…':ui.publish}</button></form></>}
 {sent&&<p role="status">{ui.sent}</p>}
 {items.map(p=><article className="community-post" key={p.id}><h2>{p.title}</h2><time>{new Date(p.created_at).toLocaleString(lang)} · {p.language}</time><p style={{whiteSpace:'pre-wrap'}}>{p.body}</p>{p.reply&&<blockquote><strong>{ui.reply}</strong><p style={{whiteSpace:'pre-wrap'}}>{p.reply}</p></blockquote>}{adminView&&<form onSubmit={e=>{e.preventDefault();reply(p.id);}}><label>{ui.reply}<textarea required maxLength={10000} value={replies[p.id]||''} onChange={e=>setReplies(v=>({...v,[p.id]:e.target.value}))}/></label><button disabled={saving}>{ui.save}</button></form>}</article>)}
 {!busy&&!error&&!items.length&&<p>{ui.noPosts}</p>}{more&&<button disabled={busy} onClick={()=>load()}>{ui.more}</button>}
 </>}{busy&&<p role="status">{ui.loading}</p>}{error&&<p role="alert">{error}<button onClick={()=>load(rows.current.length===0)}>{ui.retry}</button></p>}</main>;
}
