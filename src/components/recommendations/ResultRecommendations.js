import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from '../../utils/supabaseClient';
import {loadResultRecommendations} from '../../utils/resultRecommendations';
import {getWorldcupTitle} from '../../utils/localization';
import {localizedBoardTitle,loadBoardTitleSources} from '../topNine/localizedTitle';
import tierDetailSeo from '../../seo/tierDetailSeo';
import MediaRenderer from '../MediaRenderer';
import labels from './copy.json';
import './recommendations.css';
export default function ResultRecommendations({kind,id,lang='en',category='',sourceId='',sourceIds=[],presetName=''}){
 const [state,setState]=useState({key:'',rows:[],sources:[]});
 const sourceKey=JSON.stringify(sourceIds),key=JSON.stringify([kind,id,lang,category,sourceId,sourceKey,presetName]);
 useEffect(()=>{
  let alive=true;
  loadResultRecommendations(supabase,{kind,id,category,sourceId,sourceIds:JSON.parse(sourceKey),presetName}).then(async rows=>{
   const sources=kind==='nine'?await loadBoardTitleSources(supabase,rows):[];
   if(alive)setState({key,rows,sources});
  }).catch(()=>{if(alive)setState({key,rows:[],sources:[]});});
  return()=>{alive=false;};
 },[key,kind,id,lang,category,sourceId,sourceKey,presetName]);
 if(state.key!==key||!state.rows.length)return null;
 const c=labels[lang]||labels.en;
 return <section className="result-recommendations" aria-label={c[kind]} dir={lang==='ar'?'rtl':undefined}>
  <h2>{c[kind]}</h2><div className="result-recommendation-grid">{state.rows.map(row=>{
   const title=kind==='nine'?localizedBoardTitle(row,state.sources,lang):kind==='tier'?tierDetailSeo.getTierListTitle(row,lang):getWorldcupTitle(row,lang);
   const path=kind==='nine'?'mytop9':kind==='tier'?'tier-list':'select-round';
   return <Link className="result-recommendation-card" key={row.id} to={`/${lang}/${path}/${row.id}`}>
    <div className="result-recommendation-image">{kind==='nine'?<div className="result-recommendation-nine">{(row.slots||[]).slice(0,9).map((slot,index)=><div key={index}>{slot?.src&&<MediaRenderer url={slot.src} alt="" playable={false} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}</div>)}</div>:row.thumbnail_url?<MediaRenderer url={row.thumbnail_url} alt="" playable={false} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span aria-hidden="true">{kind==='worldcup'?'🏆':'📊'}</span>}</div>
    <div className="result-recommendation-text"><strong title={title}>{title}</strong>{kind!=='worldcup'&&<small>{c.views} {new Intl.NumberFormat(lang).format(Number(row.view_count)||0)}</small>}</div>
   </Link>;
  })}</div>
 </section>;
}
