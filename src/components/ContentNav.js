import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
export default function ContentNav({ active, user, authChecked = true }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];
  return <section className="content-hub">
    <h1>{t('lightUi.myContent', 'My content')}</h1>
    <p>{t('lightUi.manageContent', 'Find and manage your creations in one place.')}</p>
    <nav aria-label={t('lightUi.myContent', 'My content')}>
      <Link to={`/${lang}/my-worldcups`} aria-current={active === 'worldcup' ? 'page' : undefined}>{t('presetNavigation.myBrackets')}</Link>
      <Link to={`/${lang}/tier-list?mine=1`} aria-current={active === 'tier-list' ? 'page' : undefined}>{t('presetNavigation.myTierLists')}</Link>
    </nav>
    {authChecked && !user && <p className="content-login-hint">{t('lightUi.loginToView', 'Sign in to see your creations.')} <Link to={`/${lang}/login`}>{t('auth.loginSignup')}</Link></p>}
  </section>;
}
