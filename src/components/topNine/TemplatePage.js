import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TopNinePage from '../TopNinePage';
import Seo from '../../seo/Seo';
import { loadTemplatePage } from './api';
import copy from './copy.json';
import { readTemplateBootstrap } from './templateBootstrap';

const TEMPLATE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function TemplatePage() {
  const { lang: routeLang, templateId } = useParams();
  const lang = copy[routeLang] ? routeLang : 'en';
  const t = copy[lang];
  const navigate = useNavigate();
  const [settled, setSettled] = useState(() => {
    const cup = readTemplateBootstrap(templateId);
    return cup ? { templateId, retry: 0, status: 'found', cup } : null;
  });
  const [retry, setRetry] = useState(0);
  const validId = TEMPLATE_ID_PATTERN.test(templateId);
  const result = settled?.templateId === templateId && settled?.retry === retry ? settled : null;
  const missing = !validId || result?.status === 'missing';

  useEffect(() => {
    if (!validId) return undefined;

    // Direct page loads already have validated public data from the server.
    const initial = retry === 0 ? readTemplateBootstrap(templateId) : null;
    if (initial) {
      setSettled({ templateId, retry, status: 'found', cup: initial });
      return undefined;
    }
    let live = true;
    loadTemplatePage(templateId)
      .then(cup => {
        if (live) setSettled({ templateId, retry, status: 'found', cup });
      })
      .catch(error => {
        if (live) setSettled({ templateId, retry, status: error?.message === 'NOT_FOUND' ? 'missing' : 'error' });
      });
    return () => { live = false; };
  }, [templateId, retry, validId]);

  if (result?.status === 'found') {
    return <TopNinePage key={templateId} templateSource={result.cup} onHome={() => navigate('/' + lang + '/mytop9')} />;
  }

  return (
    <main className="top-nine">
      {/* Keep the server's SEO tags while the client fetch is pending or retryable. */}
      {missing && <Seo title={t.title + ' | One Pick Game'} lang={lang} slug={'mytop9/templates/' + templateId} indexable={false} />}
      <p role="status">{missing ? t.empty : result?.status === 'error' ? t.error : t.loading}</p>
      {result?.status === 'error' && <button onClick={() => setRetry(n => n + 1)}>{t.retry}</button>}
      <Link to={'/' + lang + '/mytop9'}>{t.back}</Link>
    </main>
  );
}
