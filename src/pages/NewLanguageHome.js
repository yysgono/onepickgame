import React, {useEffect} from 'react';
import {Helmet} from 'react-helmet-async';
import {useTranslation} from 'react-i18next';
import Home from '../components/Home';
import copy from '../seo/siteHomeCopy.json';
export default function NewLanguageHome({language,...props}) {
 const {i18n}=useTranslation();
 useEffect(()=>{if(i18n.language!==language)i18n.changeLanguage(language);},[language,i18n]);
 const text=copy[language]||copy.en;
 return <><Helmet htmlAttributes={{lang:language}}><title>{text.title}</title><meta name="description" content={text.description}/><link rel="canonical" href={'https://www.onepickgame.com/'+language}/></Helmet><Home {...props}/></>;
}
