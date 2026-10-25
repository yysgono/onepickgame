import {getCommunityUi} from './communityUi';
import React,{useEffect,useRef,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {supabase} from '../utils/supabaseClient';
import Seo from '../seo/Seo';
import {SITE_LANGUAGES,useSitePublisher} from './SitePublishing';
import './communityPublishing.css';
export default function BlogEditorPage(){
 const {lang='en',slug:routeSlug}=useParams(),ko=lang==='ko',allowed=useSitePublisher(),navigate=useNavigate();
 const ui=getCommunityUi(lang);
 const editor=useRef(null);
 const [language,setLanguage]=useState(lang),[slug,setSlug]=useState(routeSlug||''),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[body,setBody]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!routeSlug||!allowed)return;let active=true;setLoading(true);setError('');supabase.from('blog_posts').select('title,description,content').eq('slug',routeSlug).eq('language',language).maybeSingle().then(({data,error})=>{if(!active)return;if(error){setError(error.message);return;}setTitle(data?.title||'');setDescription(data?.description||'');setBody(data?.content||'');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[routeSlug,language,allowed]);
 useEffect(()=>{if(editor.current&&!loading)editor.current.innerHTML=body;},[allowed,loading,language]);
 function command(name,value){editor.current?.focus();document.execCommand(name,false,value);setBody(editor.current?.innerHTML||'');}
 function addLink(image=false){const value=window.prompt(ui.enterUrl);if(!value)return;try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol))throw Error();command(image?'insertImage':'createLink',url.href);}catch{setError(ui.invalidUrl);}}
 async function save(e){e.preventDefault();if(busy||loading)return;setBusy(true);setError('');const finalSlug=slug.trim()||`post-${Date.now()}`;if(!title.trim()||!(editor.current?.textContent||'').trim()){setError(ui.requiredTitle);setBusy(false);return;}try{const {error}=await supabase.rpc('save_site_blog',{p_language:language,p_slug:finalSlug,p_title:title.trim(),p_description:description,p_content:editor.current?.innerHTML||body,p_allow_update:Boolean(routeSlug)});if(error)throw error;navigate(`/${language}/blog/${finalSlug}`);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <main className="site-publishing"><Seo lang={lang} slug="blog/write" title="Blog editor | OnePickGame" description="Blog editor" indexable={false}/><Link to={`/${lang}/blog`}>← {ui.blog}</Link><h1>{ui.article}</h1>{!allowed?<p role="status">{ui.publisherOnly}</p>:<form onSubmit={save}>
 <label>{ui.language}<select value={language} disabled={busy||loading} onChange={e=>{if(body&&!window.confirm(ui.switchDraft))return;setLanguage(e.target.value);setTitle('');setDescription('');setBody('');}}>{SITE_LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></label>
 <label>{ui.urlName}<input value={slug} disabled={Boolean(routeSlug)||busy} pattern="[a-z0-9][a-z0-9_-]{0,159}" maxLength={160} onChange={e=>setSlug(e.target.value)}/></label>
 <label>{ui.title}<input required maxLength={200} value={title} disabled={loading||busy} onChange={e=>setTitle(e.target.value)}/></label>
 <label>{ui.description}<textarea maxLength={1000} value={description} disabled={loading||busy} onChange={e=>setDescription(e.target.value)}/></label>
 <label id="blog-body-label">{ui.article}</label>
 <div className="blog-editor-tools" role="toolbar" aria-label={ui.edit}>
 <button type="button" onClick={()=>command('bold')}>{ui.bold}</button>
 <button type="button" onClick={()=>command('italic')}>{ui.italic}</button>
 <button type="button" onClick={()=>command('formatBlock','h2')}>{ui.heading}</button>
 <button type="button" onClick={()=>command('formatBlock','p')}>{ui.paragraph}</button>
 <button type="button" onClick={()=>addLink(false)}>{ui.link}</button>
 <button type="button" onClick={()=>addLink(true)}>{ui.imageUrl}</button>
 </div>
 <div ref={editor} role="textbox" aria-multiline="true" aria-labelledby="blog-body-label" className="blog-rich-editor" contentEditable={!busy&&!loading} suppressContentEditableWarning onInput={()=>setBody(editor.current?.innerHTML||'')} onPaste={e=>{e.preventDefault();command('insertText',e.clipboardData.getData('text/plain'));}} />
 <button disabled={busy||loading}>{busy?(ui.loading):(ui.save)}</button>{error&&<p role="alert">{error}</p>}
 </form>}</main>;
}
