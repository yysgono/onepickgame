import { createContext, useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import latestCopy from '../seo/latestGamesCopy.json';
import detailCopy from '../seo/detailCopy.json';
import recentCopy from '../seo/recentWorldcupsCopy.json';

const UUID = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}';
const detailPath = new RegExp('^/([a-z]{2})/(select-round|quiz|tier-list|mytop9)/(' + UUID + ')/?$', 'i');
const listPath = /^\/([a-z]{2})\/(quiz|tier-list)\/?$/;
const kindFor = { 'select-round': 'worldcup', quiz: 'quiz', 'tier-list': 'tier', mytop9: 'nine' };
const makeKey = (pathname, search) => pathname + search;
function requestFor(pathname, search) {
  const detail = detailPath.exec(pathname);
  const route = detail || listPath.exec(pathname);
  if (!route || !Object.hasOwn(latestCopy, route[1])) return null;
  const params = new URLSearchParams(search);
  if (['mine','edit','clone','source','preset','tag','search','creator','exclude'].some(key => params.has(key))) return null;
  if (!detail && ((params.has('category') && params.get('category') !== 'all') || params.has('sort'))) return null;
  return { lang: route[1], kind: kindFor[route[2]], id: detail?.[3] || '' };
}
function validLinks(links) {
  return Array.isArray(links) ? links.filter(item => item && typeof item.label === 'string' && detailPath.test(item.href)).slice(0, 6) : [];
}
function recentWorldcupLinks(links) {
  return validLinks(links).filter(item => detailPath.exec(item.href)?.[2] === 'select-round').slice(0, 4);
}
function readLinks(selector) {
  return [...document.querySelectorAll(selector)].map(a => ({ href: a.getAttribute('href'), label: a.textContent }));
}
// Capture server-rendered links before React takes over. Direct visits need
// no API call, and in-app navigation fetches both sections together.
const initial = typeof document !== 'undefined' && document.defaultView ? {
  key: makeKey(document.location.pathname, document.location.search),
  links: validLinks(readLinks('[data-discovery="latest"] a[href], [data-discovery="related"] a[href]')),
  latestWorldcups: recentWorldcupLinks(readLinks('[data-discovery="latest-worldcups"] a[href]')),
} : null;
const DiscoveryContext = createContext(null);

export function ContentDiscoveryProvider({ children }) {
  const { pathname, search } = useLocation();
  const key = makeKey(pathname, search);
  const request = requestFor(pathname, search);
  const [response, setResponse] = useState(null);
  const data = initial?.key === key ? initial : response?.key === key ? response : null;
  useEffect(() => {
    const target = requestFor(pathname, search);
    if (!target || initial?.key === key) return undefined;
    const controller = new AbortController();
    const query = new URLSearchParams({ kind: target.kind, lang: target.lang });
    if (target.id) query.set('id', target.id);
    fetch('/api/content-discovery?' + query, { credentials: 'omit', signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(value => {
        if (!controller.signal.aborted) setResponse({
          key, links: validLinks(value?.links), latestWorldcups: recentWorldcupLinks(value?.latestWorldcups),
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [key, pathname, search]);
  return <DiscoveryContext.Provider value={{ request, data }}>{children}</DiscoveryContext.Provider>;
}

export function RecentWorldcupLinks() {
  const { request, data } = useContext(DiscoveryContext) || {};
  const links = data?.latestWorldcups;
  if (request?.kind !== 'worldcup' || !request.id || !links?.length) return null;
  return <section className="round-recent-worldcups round-detail-section" style={{
    maxWidth: 810, margin: '14px auto 18px', padding: '12px 16px', boxSizing: 'border-box',
    width: '100%', background: '#fffaf5', border: '1px solid #fdba74', borderRadius: 12, textAlign: 'start',
  }}>
    <h2 style={{margin: '0 0 8px', fontSize: 17, color: '#9a3412'}}>{recentCopy[request.lang]}</h2>
    <ul style={{margin: 0, paddingInlineStart: 20}}>
      {links.map(item => <li key={item.href} style={{marginBlock: 4, lineHeight: 1.45}}>
        <Link to={item.href} style={{color: '#9a3412', fontWeight: 700, overflowWrap: 'anywhere'}}>{item.label}</Link>
      </li>)}
    </ul>
  </section>;
}

export default function ContentDiscoveryLinks() {
  const { request, data } = useContext(DiscoveryContext) || {};
  const links = data?.links;
  if (!request || !links?.length) return null;
  const heading = request.id ? detailCopy[request.lang][0] : latestCopy[request.lang];
  return <section className="discovery-links" style={{maxWidth: 900, margin: '24px auto', padding: '0 16px'}}>
    <h2>{heading}</h2>
    <ul>{links.map(item => <li key={item.href}><Link to={item.href}>{item.label}</Link></li>)}</ul>
  </section>;
}
