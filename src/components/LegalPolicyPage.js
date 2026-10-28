import React from 'react';
import {Link,useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import Seo from '../seo/Seo';
import legal from '../legal/legalPolicy';
import {rememberHeaderLanguage} from '../utils/useHeaderLanguage';
export default function LegalPolicyPage({page}) {
 const {lang:routeLang}=useParams();const {i18n}=useTranslation();
 const meta=legal.getLegalPolicy(routeLang||i18n.language,page);
 return <>
  <Seo lang={meta.lang} slug={page} title={`${meta.title} | OnePickGame`} description={meta.sections[0][1]} hreflangLangs={legal.LANGUAGES} />
  <main lang={meta.lang} dir={meta.dir} style={{maxWidth:900,margin:'40px auto',padding:'24px clamp(16px,4vw,32px)',background:'#fff',borderRadius:13,color:'#202534',fontSize:16,lineHeight:1.8,overflowWrap:'anywhere',boxSizing:'border-box'}}>
   <h1 style={{fontSize:'clamp(25px,5vw,34px)',lineHeight:1.4}}>{meta.title}</h1>
   <p>{meta.operatorLabel}: <b>{meta.operator}</b> · {meta.country}<br />{meta.contactLabel}: <a href={`mailto:${meta.email}`}>{meta.email}</a><br />{meta.updatedLabel}: <time dateTime={meta.version}>{meta.version}</time></p>
   <nav aria-label="Language" style={{display:'flex',gap:8,flexWrap:'wrap',margin:'20px 0 28px'}}>
    {legal.LANGUAGES.map(lang=><Link key={lang} to={`/${lang}/${page}`} onClick={event=>{if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey)rememberHeaderLanguage(lang);}} lang={lang} hrefLang={lang} aria-current={lang===meta.lang?'page':undefined} style={{padding:'4px 9px',border:'1px solid #cbd5e1',borderRadius:6,color:lang===meta.lang?'white':'#5542b8',background:lang===meta.lang?'#5542b8':'#fff',fontSize:14}}>{lang.toUpperCase()}</Link>)}
   </nav>
   {meta.sections.map(([heading,text],i)=><section key={i} style={{margin:'24px 0'}}><h2 style={{fontSize:20,lineHeight:1.5,marginBottom:8}}>{heading}</h2><p style={{margin:0,whiteSpace:'pre-line'}}>{text}</p></section>)}
   <p><a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">Google · myaccount.google.com/connections</a></p>
   <p><a href="https://nid.naver.com/" target="_blank" rel="noopener noreferrer">NAVER</a></p>
   <p><Link to={`/${meta.lang}/${meta.otherPage}`}>{meta.otherTitle}</Link></p>
  </main>
 </>;
}

