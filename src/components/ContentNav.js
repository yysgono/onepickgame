import {getCommunityUi} from './communityUi';
import homeCopy from '../seo/homeShellCopy.json';
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
export default function ContentNav({ active, user, authChecked = true }) {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];
  const ui=getCommunityUi(lang),modes=(homeCopy[lang]||homeCopy.en).modes;
  return <section className="content-hub">
    <h1>{ui.myContent}</h1>
    <p>{ui.manage}</p>
    <nav aria-label={ui.myContent}>
      <Link to={`/${lang}/my-worldcups`} aria-current={active === 'worldcup' ? 'page' : undefined}>{modes[0]}</Link>
      <Link to={`/${lang}/tier-list?mine=1`} aria-current={active === 'tier-list' ? 'page' : undefined}>{modes[1]}</Link>
      <Link to={`/${lang}/quiz?mine=1`} aria-current={active === 'quiz' ? 'page' : undefined}>{modes[2]}</Link>
    </nav>
    {authChecked && !user && <p className="content-login-hint">{ui.loginRequired} <Link to={`/${lang}/login`}>{ui.loginSignup}</Link></p>}
  </section>;
}
