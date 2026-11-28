import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import latestCopy from '../seo/latestGamesCopy.json';
import detailCopy from '../seo/detailCopy.json';

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
// Acquire only the visible links from the original server HTML before React
// replaces it. Direct visits reuse that response without another API request.
const initial = typeof document !== 'undefined' && document.defaultView ? {
  key: makeKey(document.location.pathname, document.location.search),
  links: validLinks([...document.querySelectorAll('[data-discovery] a[href]')].map(a => ({
    href: a.getAttribute('href'), label: a.textContent,
  }))),
} : null;

export default function ContentDiscoveryLinks() {
  const { pathname, search } = useLocation();
  const request = requestFor(pathname, search);
  const key = makeKey(pathname, search);
  const [response, setResponse] = useState(null);
  const initialLinks = initial?.key === key ? initial.links : null;
  const links = initialLinks || (response?.key === key ? response.links : []);
  useEffect(() => {
    const target = requestFor(pathname, search);
    if (!target || initial?.key === key) return undefined;
    const controller = new AbortController();
    const query = new URLSearchParams({ kind: target.kind, lang: target.lang });
    if (target.id) query.set('id', target.id);
    fetch('/api/content-discovery?' + query, { credentials: 'omit', signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(value => { if (!controller.signal.aborted) setResponse({ key, links: validLinks(value?.links) }); })
      .catch(() => {});
    return () => controller.abort();
  }, [key, pathname, search]);
  if (!request || !links.length) return null;
  const heading = request.id ? detailCopy[request.lang][0] : latestCopy[request.lang];
  return <section className="discovery-links" style={{maxWidth: 900, margin: '24px auto', padding: '0 16px'}}>
    <h2>{heading}</h2>
    <ul>{links.map(item => <li key={item.href}><Link to={item.href}>{item.label}</Link></li>)}</ul>
  </section>;
}
