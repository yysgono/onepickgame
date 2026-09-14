import React from 'react';
import {useTranslation} from 'react-i18next';
export default function SiteIntroduction(){
 const {t}=useTranslation();
 return <div className="onepick-header-introduction">
  <strong>{t('gameModeNav.introLine1')}</strong>
  <span>{t('gameModeNav.introLine2')}</span>
 </div>;
}
