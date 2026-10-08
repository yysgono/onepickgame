import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Seo from '../seo/Seo';
import labels from '../seo/categoryLabels.json';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const language = pathname.split('/')[1];
  const lang = labels[language] ? language : 'en';
  const title = lang === 'ko' ? '페이지를 찾을 수 없습니다' : 'Page not found';
  return <>
    <Seo lang={lang} slug={pathname.replace(/^\/+/, '')} langPrefix={false} title={`${title} | OnePickGame`} description={title} indexable={false} />
    <main style={{ maxWidth: 800, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      <h1>404 · {title}</h1>
      <Link to={lang === 'en' ? '/' : `/${lang}`}>{lang === 'ko' ? '홈으로 돌아가기' : 'Back to home'}</Link>
    </main>
  </>;
}
