import CommunityComments from './CommunityComments';
import RichTextEditor from './RichTextEditor';
import {sanitizeRichHtml,richPlainText,richImageCount,plainToRich} from '../utils/richText';
import homeCopy from '../seo/homeShellCopy.json';
import {getCommunityUi} from './communityUi';
import React,{useEffect,useRef,useState} from 'react';
import {useParams} from 'react-router-dom';
import {supabase} from '../utils/supabaseClient';
import {BOARD_PAGE_SIZE,loadBoardPage,loadBoardBody,boardDate,boardPageNumbers} from '../utils/communityBoardApi';
import Seo from '../seo/Seo';
import {SITE_LANGUAGES,useSitePublisher} from './SitePublishing';
import copy from './headerCommunityCopy.json';
import './communityPublishing.css';
export default function CommunityBoardPage({board,user}){
 const {lang='en'}=useParams(),labels=copy[lang]||copy.en,name=labels[board==='notices'?0:1],admin=useSitePublisher(),ui=getCommunityUi(lang);
 const categories=[['all',ui.all],['general',ui.general],['worldcup',(homeCopy[lang]||homeCopy.en).modes[0]],['quiz',(homeCopy[lang]||homeCopy.en).modes[2]],['tier-list',(homeCopy[lang]||homeCopy.en).modes[1]],['random-pick',(homeCopy[lang]||homeCopy.en).modes[3]]];
 const [category,setCategory]=useState('all'),[postCategory,setPostCategory]=useState('general'),[postLanguage,setPostLanguage]=useState(lang),[languageOnly,setLanguageOnly]=useState(false),[currentLanguageOnly,setCurrentLanguageOnly]=useState(board==='notices');
 const [posts,setPosts]=useState([]),[pinned,setPinned]=useState([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[busy,setBusy]=useState(true),[error,setError]=useState(''),[saved,setSaved]=useState('');
 const [writing,setWriting]=useState(false),[editing,setEditing]=useState(null),[title,setTitle]=useState(''),[body,setBody]=useState(''),[uploading,setUploading]=useState(false),[saving,setSaving]=useState(false),[expanded,setExpanded]=useState(null),[pinning,setPinning]=useState(null),[bodies,setBodies]=useState({}),[bodyLoading,setBodyLoading]=useState(null),[now,setNow]=useState(()=>new Date());
 const plainBody=React.useMemo(()=>richPlainText(body),[body]);
 const version=useRef(0),formRef=useRef(null);
 const pages=Math.max(1,Math.ceil(total/BOARD_PAGE_SIZE));
 function message(e){return ui[e?.message]||e?.message||ui.retry;}
 async function load(){const ticket=++version.current;setBusy(true);setError('');try{
  const result=await loadBoardPage(supabase,{board,lang:lang,category,currentLanguageOnly,page});
  if(ticket!==version.current)return;
  const maxPage=Math.max(1,Math.ceil(result.total/BOARD_PAGE_SIZE));if(page>maxPage){setPage(maxPage);return;}
  setPosts(result.items);setPinned(result.pinned);setTotal(result.total);
 }catch(e){if(ticket===version.current)setError(message(e));}finally{if(ticket===version.current)setBusy(false);}}
 function clearForm(){setEditing(null);setWriting(false);setTitle('');setBody('');setPostCategory('general');setPostLanguage(lang);setLanguageOnly(false);}
 useEffect(()=>{clearForm();setSaved('');setPage(1);setCurrentLanguageOnly(board==='notices');},[lang,board]);
 useEffect(()=>{setExpanded(null);setBodyLoading(null);setBodies({});setPosts([]);setPinned([]);load();return()=>{version.current++;};},[lang,board,category,currentLanguageOnly,page]);
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer);},[]);
 function changeCategory(value){setPage(1);setCategory(value);}
 async function expand(post){if(expanded===post.id){setExpanded(null);return;}setExpanded(post.id);if(Object.hasOwn(bodies,post.id))return;const ticket=version.current;setBodyLoading(post.id);try{const text=await loadBoardBody(supabase,post.id);if(ticket===version.current)setBodies(old=>({...old,[post.id]:text.html?sanitizeRichHtml(text.html):plainToRich(text.text)}));}catch(e){if(ticket===version.current)setError(message(e));}finally{if(ticket===version.current)setBodyLoading(null);}}
 async function edit(post){const ticket=version.current;setError('');setBodyLoading(post.id);try{const fetched=Object.hasOwn(bodies,post.id)?null:await loadBoardBody(supabase,post.id);const text=Object.hasOwn(bodies,post.id)?bodies[post.id]:fetched.html?sanitizeRichHtml(fetched.html):plainToRich(fetched.text);if(ticket!==version.current)return;setEditing(post.id);setTitle(post.title);setBody(text);setPostLanguage(post.language);setPostCategory(post.category||'general');setLanguageOnly(Boolean(post.language_only));setWriting(true);requestAnimationFrame(()=>formRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));}catch(e){setError(message(e));}finally{setBodyLoading(null);}}
 async function save(e){e.preventDefault();if(saving||uploading||!user)return;setSaving(true);setError('');setSaved('');try{
  const html=sanitizeRichHtml(body);if(richImageCount(html)>5)throw Error('POST_IMAGE_LIMIT');
  const fields={body_html:html,language:postLanguage,language_only:board==='community'&&languageOnly,category:board==='notices'?'general':postCategory,title:title.trim(),body:richPlainText(html)};
  const result=await supabase.rpc('save_community_rich_post',{p_id:editing,p_board:board,p_title:fields.title,p_body:fields.body,p_html:fields.body_html,p_language:fields.language,p_category:fields.category,p_language_only:fields.language_only});
  if(result.error)throw result.error;clearForm();setBodies({});setSaved(`✓ ${ui.save}`);if(page!==1)setPage(1);else await load();
 }catch(e){setError(message(e));}finally{setSaving(false);}}
 async function togglePin(post){if(pinning!==null)return;setPinning(post.id);setError('');try{const {error}=await supabase.rpc('set_community_post_pinned',{p_id:post.id,p_pinned:!post.is_pinned});if(error)throw error;await load();}catch(e){setError(message(e));}finally{setPinning(null);}}
 async function remove(id){if(!window.confirm(ui.confirmDelete))return;setError('');const {error}=await supabase.from('community_posts').delete().eq('id',id);if(error)setError(message(error));else{if(editing===id)clearForm();await load();}}
 function card(post){return <article className={`community-post notice-post board-card${post.is_pinned?' community-post-pinned':''}`} key={post.id}>
  <div className="community-post-heading"><span className="board-post-number" aria-label={ui.postNumber}>#{post.post_number}</span><button className="community-post-title" aria-expanded={expanded===post.id} onClick={()=>expand(post)}>{post.is_pinned&&<span className="community-pin-badge">{ui.pinned}</span>}{post.title}</button><div className="community-post-meta"><span className="community-author">{post.author_nickname||'Member'} · {post.language}</span><time dateTime={post.created_at} title={new Date(post.created_at).toLocaleString(lang)}>{boardDate(post.created_at,lang,now)}</time></div></div>
  {expanded===post.id&&<div className="board-expanded">{bodyLoading===post.id?<p role="status">{ui.loading}</p>:<div className="board-post-body rich-content" dangerouslySetInnerHTML={{__html:sanitizeRichHtml(bodies[post.id]||'')}}/>}<div className="board-post-tools"><span className="board-category-label">{categories.find(([key])=>key===post.category)?.[1]||post.category}</span>{admin&&<button className="community-pin-action" disabled={pinning!==null} onClick={()=>togglePin(post)}>{pinning===post.id?'…':post.is_pinned?ui.unpin:ui.pin}</button>}{(admin||user?.id===post.author_id)&&<><button type="button" disabled={saving||uploading||bodyLoading!==null} onClick={()=>edit(post)}>{ui.edit}</button><button type="button" className="board-delete" disabled={saving||uploading} onClick={()=>remove(post.id)}>{ui.delete}</button></>}</div>{board==='community'&&<CommunityComments key={post.id} postId={post.id} user={user} admin={admin} lang={lang}/>}</div>}
 </article>;}
 return <main className="site-publishing community-board"><Seo lang={lang} slug={board} title={`${name} | OnePickGame`} description={`${name} · OnePickGame`} indexable={true}/>
  <header className="board-hero"><div className="board-hero-icon" aria-hidden="true">{board==='community'?'✦':'▤'}</div><div><span className="board-eyebrow">ONE PICK GAME · COMMUNITY</span><h1>{name}</h1></div></header>
  {board==='community'&&<div className="community-tabs" role="group" aria-label={ui.category}>{categories.map(([key,label])=><button key={key} aria-pressed={category===key} onClick={()=>changeCategory(key)}>{label}</button>)}</div>}
  <div className="board-toolbar">
   {board==='community'&&<label htmlFor={`board-language-filter-${board}`} className="community-language-only community-read-filter"><input id={`board-language-filter-${board}`} type="checkbox" checked={currentLanguageOnly} onChange={e=>{setPage(1);setCurrentLanguageOnly(e.target.checked);}}/><span>{ui.currentLanguageOnly} ({lang})</span></label>}
   {(board==='community'?Boolean(user):admin)&&<button className="board-write" disabled={saving||uploading} onClick={()=>{if(writing)clearForm();else{setEditing(null);setWriting(true);setSaved('');}}}>＋ {ui.write}</button>}
  </div>
  {writing&&<form ref={formRef} className="board-editor" onSubmit={save}><h2>{editing?ui.edit:ui.write}</h2><label>{ui.language}<select disabled={saving||uploading} value={postLanguage} onChange={e=>setPostLanguage(e.target.value)}>{SITE_LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></label>{board==='community'&&<><label className="community-language-only"><input type="checkbox" disabled={saving||uploading} checked={languageOnly} onChange={e=>setLanguageOnly(e.target.checked)}/><span>{ui.languageOnly} ({postLanguage})</span></label><label>{ui.category}<select disabled={saving||uploading} value={postCategory} onChange={e=>setPostCategory(e.target.value)}>{categories.filter(([key])=>key!=='all').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></>}
   <label>{ui.title}<input required disabled={saving} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/><small className="board-char-count">{title.length} / 120</small></label><label>{ui.content}</label><RichTextEditor key={editing||'new'} lang={postLanguage} value={body} onChange={setBody} disabled={saving} onBusy={setUploading} onError={setError}/><small className="board-char-count">{plainBody.length} / 10,000</small><p className="board-post-limit">{admin?ui.publisherHint:ui.postLimitHint}</p><div className="board-editor-actions"><button disabled={saving||uploading||!title.trim()||!plainBody||title.length>120||plainBody.length>10000}>{saving?'…':editing?ui.save:ui.publish}</button><button type="button" disabled={saving||uploading} onClick={clearForm}>{ui.cancel}</button></div>
  </form>}
  {saved&&<p className="board-success" role="status">{saved}</p>}{error&&<p className="board-error" role="alert">{error}</p>}
  <div className="board-list" aria-busy={busy}>{busy?<p className="board-status" role="status">{ui.loading}</p>:<>{pinned.map(card)}{posts.map(card)}{!pinned.length&&!posts.length&&<p className="board-status">{ui.noPosts}</p>}</>}</div>
  {!busy&&<nav className="board-pagination" aria-label={ui.pages}><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} aria-label={ui.previousPage}>‹</button>{boardPageNumbers(page,pages).map((n,i,nums)=><React.Fragment key={n}>{i>0&&n>nums[i-1]+1&&<span>…</span>}<button aria-current={page===n?'page':undefined} onClick={()=>setPage(n)}>{n}</button></React.Fragment>)}<button disabled={page>=pages} onClick={()=>setPage(p=>p+1)} aria-label={ui.nextPage}>›</button><span className="board-page-count">{page} / {pages}</span></nav>}
 </main>;
}




