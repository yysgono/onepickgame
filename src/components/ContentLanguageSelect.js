import React from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {TEMPLATE_LANGUAGES} from '../utils/templateTitles';
import {rememberHeaderLanguage} from '../utils/useHeaderLanguage';
import {getCommunityUi} from './communityUi';
export default function ContentLanguageSelect(){
 const location=useLocation(),navigate=useNavigate(),{i18n}=useTranslation();
 const parts=location.pathname.split('/').filter(Boolean),supported=code=>TEMPLATE_LANGUAGES.some(([key])=>key===code);
 const language=location.pathname==='/'?'en':supported(parts[0])?parts[0]:(i18n.language||'en').split('-')[0];
 function change(language){rememberHeaderLanguage(language);try{localStorage.setItem('onepickgame_lang',language);}catch{}
 const next=[...parts];if(supported(next[0]))next[0]=language;else next.unshift(language);
 navigate('/'+next.join('/')+location.search+location.hash);i18n.changeLanguage(language);
 }
 return <div className="content-language-select"><label><span className="content-language-label">🌐 {getCommunityUi(language).language}</span><select aria-label={getCommunityUi(language).language} value={language} onChange={e=>change(e.target.value)}>{TEMPLATE_LANGUAGES.map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label></div>;
}
