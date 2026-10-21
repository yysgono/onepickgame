import AdGuard from '../ads/AdGuard';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { worldcupRouteData } from '../utils/worldcupRouteData';

export default function WorldcupRouteDataLoader({ children, worldcupList, allLoaded, loadAll, loadOne }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const request = worldcupRouteData(location.pathname);
  const key = request.kind === 'one' ? `one:${request.id}` : request.kind;
  const ready = request.kind === 'none' || (request.kind === 'all' ? allLoaded : worldcupList.some(cup => String(cup.id) === request.id && cup._homeCardOnly !== true));
  const [failure, setFailure] = useState(null);
  const [retryTick, setRetryTick] = useState(0);
  useEffect(() => {
    if (ready) return undefined;
    let mounted = true;
    setFailure(null);
    const job = key === 'all' ? loadAll() : loadOne(key.slice(4));
    Promise.resolve(job).catch(error => { if (mounted) setFailure({ key, error }); });
    return () => { mounted = false; };
  }, [key, ready, loadAll, loadOne, retryTick]);
  if (ready) return children;
  const ko = i18n.language?.startsWith('ko');
  if (failure?.key === key) return <div role="alert" style={{ textAlign: 'center', padding: 48 }}>
    <p>{ko ? '게임을 불러오지 못했습니다. 주소를 확인하거나 다시 시도해 주세요.' : 'Could not load this game. Check the address or try again.'}</p>
    <button type="button" onClick={() => setRetryTick(value => value + 1)}>{t('retry', { defaultValue: ko ? '다시 시도' : 'Retry' })}</button>
  </div>;
  return <><AdGuard isAdmin={true}/><div role="status" style={{width:'100%',minWidth:0,minHeight:'60vh',display:'grid',placeItems:'center',boxSizing:'border-box',padding:48}}>{t('loading', {defaultValue:'Loading...'})}</div></>;
}
