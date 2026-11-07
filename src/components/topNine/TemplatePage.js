import React,{useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import TopNinePage from '../TopNinePage';
import Seo from '../../seo/Seo';
import {loadTemplatePage} from './api';
import copy from './copy.json';
export default function TemplatePage(){
 const {lang:routeLang,templateId}=useParams(),lang=copy[routeLang]?routeLang:'en',t=copy[lang],navigate=useNavigate();
 const [result,setResult]=useState(null),[retry,setRetry]=useState(0);
 useEffect(()=>{let live=true;setResult(null);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId)){setResult({missing:true});return;}loadTemplatePage(templateId).then(cup=>{if(live)setResult({cup});}).catch(error=>{if(live)setResult(error.message==='NOT_FOUND'?{missing:true}:{error:true});});return()=>{live=false;};},[templateId,retry]);
 if(result?.cup)return <TopNinePage key={templateId} templateSource={result.cup} onHome={()=>navigate('/'+lang+'/mytop9')}/>;
 return <main className="top-nine"><Seo title={t.title+' | One Pick Game'} lang={lang} slug={'mytop9/templates/'+templateId} indexable={false}/><p role="status">{!result?t.loading:result.error?t.error:t.empty}</p>{result?.error&&<button onClick={()=>setRetry(n=>n+1)}>{t.retry}</button>}<Link to={'/'+lang+'/mytop9'}>{t.back}</Link></main>;
}
