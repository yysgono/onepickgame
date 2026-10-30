import {uiContentLanguage} from "../utils/uiContentLanguage";
import {getCommunityUi} from './communityUi';
import React,{useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {supabase} from '../utils/supabaseClient';
import Seo from '../seo/Seo';
import {SITE_LANGUAGES,useSitePublisher} from './SitePublishing';
import RichTextEditor from './RichTextEditor';
import {sanitizeRichHtml,richPlainText} from '../utils/richText';
import './communityPublishing.css';
export default function BlogEditorPage(){
 const {lang='en',slug:routeSlug}=useParams(),allowed=useSitePublisher(),navigate=useNavigate(),ui=getCommunityUi(lang);
 const [language,setLanguage]=useState(uiContentLanguage(lang)),[slug,setSlug]=useState(routeSlug||''),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[body,setBody]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!routeSlug||!allowed)return;let active=true;setLoading(true);setError('');supabase.from('blog_posts').select('title,description,content').eq('slug',routeSlug).eq('language',language).maybeSingle().then(({data,error})=>{if(!active)return;if(error){setError(error.message);return;}setTitle(data?.title||'');setDescription(data?.description||'');setBody(data?.content||'');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[routeSlug,language,allowed]);
 async function save(e){e.preventDefault();if(busy||loading||uploading)return;setBusy(true);setError('');const finalSlug=slug.trim()||`post-${Date.now()}`;const html=sanitizeRichHtml(body);if(!title.trim()||!richPlainText(html)){setError(ui.requiredTitle);setBusy(false);return;}try{const {error}=await supabase.rpc('save_site_blog',{p_language:language,p_slug:finalSlug,p_title:title.trim(),p_description:description,p_content:html,p_allow_update:Boolean(routeSlug)});if(error)throw error;navigate(`/${language}/blog/${finalSlug}`);}catch(e){setError(e.message);}finally{setBusy(false);}}
 const locked=busy||loading||uploading;
 return <main className="site-publishing"><Seo lang={lang} slug="blog/write" title="Blog editor | OnePickGame" description="Blog editor" indexable={false}/><Link to={`/${lang}/blog`}>← {ui.blog}</Link><h1>{ui.article}</h1>{!allowed?<p role="status">{ui.publisherOnly}</p>:<form onSubmit={save}>
 <label>{ui.language}<select value={language} disabled={locked} onChange={e=>{if(body&&!window.confirm(ui.switchDraft))return;setLanguage(e.target.value);setTitle('');setDescription('');setBody('');}}>{SITE_LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></label>
 <label>{ui.urlName}<input value={slug} disabled={Boolean(routeSlug)||locked} pattern="[a-z0-9][a-z0-9_-]{0,159}" maxLength={160} onChange={e=>setSlug(e.target.value)}/></label>
 <label>{ui.title}<input required maxLength={200} value={title} disabled={locked} onChange={e=>setTitle(e.target.value)}/></label>
 <label>{ui.description}<textarea maxLength={1000} value={description} disabled={locked} onChange={e=>setDescription(e.target.value)}/></label>
 <label>{ui.article}</label><RichTextEditor key={`${language}:${routeSlug||'new'}`} lang={language} blog value={body} onChange={setBody} disabled={busy||loading} onBusy={setUploading} onError={setError}/>
 <button disabled={locked}>{busy?ui.loading:ui.save}</button>{error&&<p role="alert">{error}</p>}
 </form>}</main>;
}
