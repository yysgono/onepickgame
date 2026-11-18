const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const fixture = require('./platform-home-fixtures.cjs');
const home = require('../src/seo/platformHome');
const listingCopy = require('../src/seo/worldcupHomeCopy.json');
const build = path.resolve(process.argv[2] || '../platform-home-verified-build');

class Local extends ResourceLoader {
  fetch(url) {
    const pathname = new URL(url).pathname;
    if (!pathname.startsWith('/static/')) return null;
    const result = Promise.resolve(fs.readFileSync(path.join(build, pathname)));
    result.abort = () => {};
    return result;
  }
}

function browser(route, options = {}) {
  const errors = [], calls = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => { if (error.type !== 'not implemented') errors.push(error.message); });
  let release, deferred = false, failed = false, homeRequests = 0;
  let html = fs.readFileSync(path.join(build, 'index.html'), 'utf8');
  if (options.bootstrap) html = html.replace('</body>', () => '<script id="platform-home-data" type="application/json">' + JSON.stringify(options.bootstrap) + '</script></body>');
  const dom = new JSDOM(html, {
    url: 'https://www.onepickgame.com' + route,
    runScripts: 'dangerously', resources: new Local(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      Object.defineProperty(w, 'crypto', { value: require('node:crypto').webcrypto });
      w.localStorage.setItem('onepickgame_lang', options.savedLang || 'ko');
      w.innerWidth = options.width || 1500;
      if(options.layout){
        Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return this.classList?.contains('platform-cards')?Math.min(w.innerWidth,1800)-80:0;}});
        Object.defineProperty(w.HTMLElement.prototype,'scrollWidth',{get(){if(!this.classList?.contains('platform-cards'))return 0;const kind=this.closest('.platform-section')?.className||'',size=kind.includes('-worldcup')?504:kind.includes('-quiz')?440:kind.includes('-tier')?420:kind.includes('-nine')?350:340;return Math.max(this.clientWidth,this.querySelectorAll('.platform-card').length*(size+13));}});
        w.HTMLElement.prototype.scrollBy=function(options){this.scrollLeft=Math.max(0,Math.min(this.scrollWidth-this.clientWidth,this.scrollLeft+options.left));this.dispatchEvent(new w.Event('scroll'));};
      }
      w.fetch = async (input, init) => {
        const u = new URL(String(input), 'https://www.onepickgame.com');
        calls.push({ path: u.pathname, query: u.searchParams, body: init?.body });
        let value = [];
        if (u.pathname === '/api/platform-home') {
          homeRequests++;
          if (options.apiMissing) return new Response('{"error":"Not Found"}', { status: 404 });
          if (options.failOnce && !failed) { failed = true; return new Response('{}', { status: 503 }); }
          if (options.deferFirst && !deferred) {
            deferred = true;
            await new Promise(resolve => { release = resolve; });
          }
          value = await home.load(fixture.client(new Set(),options.dataset||{}), u.searchParams.get('lang'), {kind:u.searchParams.get('kind')||'',offset:Number(u.searchParams.get('offset')||0),limit:Number(u.searchParams.get('limit')||home.LIMIT)});
        } else if (options.failOnce && failed && homeRequests === 1 && u.pathname.startsWith('/rest/v1/')) {
          return new Response('{"code":"TEST_UNAVAILABLE","message":"Temporary failure"}', { status: 503, headers: { 'content-type': 'application/json' } });
        } else if (u.pathname.endsWith('/rpc/get_worldcup_home_rows')) {
          const body = JSON.parse(init.body), rows = {};
          for (const r of body.p_requests) rows[r.key] = { offset: r.offset, total: r.key === 'featured' ? 1 : 0, items: r.key === 'featured' && r.offset === 0 ? [fixture.cup] : [] };
          value = { rows, totals: { featured: 1 }, activity: { created: [], played: [] } };
        } else if (u.pathname.endsWith('/rpc/get_worldcup_play_counts')) value = [{ cup_id: fixture.id, play_count: 99 }];
        else if (u.pathname.endsWith('/worldcup_card_previews')) value = fixture.tables.worldcup_card_previews;
        else if (u.pathname.endsWith('/worldcups')) value = u.searchParams.get('id')?.startsWith('eq.') ? fixture.cup : [fixture.cup];
        else if (options.apiMissing) value = fixture.tables[u.pathname.split('/').at(-1)] || [];
        return new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
      };
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
      w.structuredClone = structuredClone; w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
      w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      w.IntersectionObserver = class {
        constructor(cb) { this.cb = cb; }
        observe(target) { queueMicrotask(() => this.cb([{ isIntersecting: true, target }])); }
        unobserve() {} disconnect() {}
      };
    }
  });
  const w = dom.window, d = w.document;
  const wait = async predicate => {
    for (let i = 0; i < 350; i++) {
      if (predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    throw Error('Timeout ' + w.location.pathname + ': ' + errors.join(' / ') + ' ' + d.body.textContent.slice(-350));
  };
  const click = node => node.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  const changeLanguage = lang => {
    const select = d.querySelector('.header-language-control select');
    assert(select); select.value = lang; select.dispatchEvent(new w.Event('change', { bubbles: true }));
  };
  return { w, d, calls, wait, click, changeLanguage, release: () => release?.(), close() { dom.window.close(); }, assertErrors() { assert.deepEqual(errors, []); } };
}

async function directListing(lang) {
  const b = browser('/' + lang + '/ideal-type-world-cup', { savedLang: lang === 'ko' ? 'en' : 'ko' });
  try {
    await b.wait(() => b.d.querySelector('.worldcup-card') && b.d.querySelector('h1')?.textContent.includes(listingCopy[lang].heading));
    assert.equal(b.w.location.pathname, '/' + lang + '/ideal-type-world-cup');
    assert.equal(b.d.querySelector('.header-language-control select').value, lang);
    assert.equal(b.d.querySelectorAll('h1').length, 1);
    assert(b.d.querySelector('.onepick-header-mode.mode-worldcup.is-active'));
    assert.equal(b.d.querySelector('.platform-home'), null);
    await b.wait(() => b.d.querySelector('link[rel=canonical]')?.href === 'https://www.onepickgame.com/' + lang + '/ideal-type-world-cup');
    assert(![...b.d.querySelectorAll('meta[name=robots]')].some(node => node.content.includes('noindex')));
    assert.equal(b.calls.filter(call => call.path === '/api/platform-home').length, 0);
    b.assertErrors();
  } finally { b.close(); }
}

async function retryHome() {
  const b = browser('/ko', { failOnce: true });
  try {
    await b.wait(() => b.d.querySelector('.platform-retry'));
    assert(b.d.querySelector('.platform-section-worldcup').textContent.includes(home.COPY.ko.failed));
    assert.equal(b.d.querySelectorAll('.platform-section').length, 5);
    assert.equal(b.d.querySelector('.platform-section-worldcup h2 a').getAttribute('href'), '/ko/ideal-type-world-cup');
    b.click(b.d.querySelector('.platform-retry'));
    await b.wait(() => b.d.querySelector('.platform-section-nine .platform-card'));
    assert.equal(b.calls.filter(call => call.path === '/api/platform-home').length, 2);
    assert.equal(b.d.querySelectorAll('.platform-retry').length, 0);
    b.assertErrors();
  } finally { b.close(); }
}

async function missingApiHome(useBootstrap) {
  const data = await home.load(fixture.client(), 'ko');
  if (useBootstrap) data.groups.forEach(group => { group.rows = []; group.unavailable = true; });
  const b = browser('/ko', { apiMissing: true, bootstrap: useBootstrap ? data : null });
  try {
    await b.wait(() => b.d.querySelectorAll('.platform-section .platform-card').length >= 8);
    for (const kind of ['worldcup', 'tier', 'quiz', 'nine', 'random']) assert(b.d.querySelector('.platform-section-' + kind + ' .platform-card'));
    assert.equal(b.d.querySelectorAll('.platform-retry').length, 0);
    assert.equal(b.d.querySelector('.platform-section-worldcup .platform-card-link').getAttribute('href'), '/ko/select-round/' + fixture.id);
    assert.equal(b.calls.filter(call => call.path === '/api/platform-home').length, useBootstrap ? 0 : 1);
    assert(b.calls.some(call => call.path.endsWith('/tier_lists')));
    b.assertErrors();
  } finally { b.close(); }
}

async function switchDuringRequest() {
  const b = browser('/', { deferFirst: true, savedLang: 'ko' });
  try {
    await b.wait(() => b.calls.some(call => call.path === '/api/platform-home'));
    b.changeLanguage('ko');
    await b.wait(() => b.w.location.pathname === '/ko' && b.d.querySelector('.platform-section-nine .platform-card'));
    b.release(); await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(b.d.querySelector('h1').textContent.trim(), 'One Pick Game');
    assert.equal(b.d.querySelector('.platform-section-worldcup .platform-card-link').getAttribute('href'), '/ko/select-round/' + fixture.id);
    b.changeLanguage('en');
    await b.wait(() => b.d.querySelector('.platform-section-worldcup .platform-card-link')?.getAttribute('href') === '/en/select-round/' + fixture.id);
    b.click(b.d.querySelector('.platform-section-worldcup .platform-section-heading > a'));
    await b.wait(() => b.w.location.pathname === '/en/ideal-type-world-cup' && b.d.querySelector('.worldcup-card'));
    b.click(b.d.querySelector('.onepick-header-brand'));
    await b.wait(() => b.w.location.pathname === '/' && b.d.querySelector('.platform-section-nine .platform-card'));
    await b.wait(() => b.d.querySelector('link[rel=canonical]')?.href === 'https://www.onepickgame.com/');
    assert.equal(b.d.querySelector('h1').textContent.trim(), 'One Pick Game');
    assert.equal(b.d.querySelector('.onepick-header-mode.mode-worldcup.is-active'), null);
    b.assertErrors();
  } finally { b.release(); b.close(); }
}

async function languageBelowModes() {
  const data=await home.load(fixture.client(),'ko'),b=browser('/ko',{bootstrap:data});
  try {
    await b.wait(()=>b.d.querySelector('.platform-language select'));
    assert.equal(b.d.querySelectorAll('.platform-language option').length,20);
    const select=b.d.querySelector('.platform-language select');select.value='en';select.dispatchEvent(new b.w.Event('change',{bubbles:true}));
    await b.wait(()=>b.w.location.pathname==='/en'&&b.d.querySelector('.platform-section-tier .platform-card>strong')?.textContent==='Football Tier List');
    assert.equal(b.d.querySelector('.header-language-control select').value,'en');
    const links=[...b.d.querySelectorAll('.platform-modes>a')].map(node=>node.getAttribute('href'));
    assert.deepEqual(links,['/en/ideal-type-world-cup','/en/quiz','/en/tier-list','/en/mytop9','/en/random-pick']);
    b.click(b.d.querySelector('.platform-section-worldcup h2 a'));
    await b.wait(()=>b.d.querySelector('.onepick-header-modes'));
    assert.deepEqual([...b.d.querySelectorAll('.onepick-header-mode-main')].map(node=>node.getAttribute('href')),links);
    b.assertErrors();
  } finally { b.close(); }
}

module.exports={browser};
if(require.main===module)(async () => {
  for (const lang of Object.keys(home.COPY)) await directListing(lang);
  console.log('PASS: direct listing visits in all 20 languages override stale saved language, keep canonical/robots and do not request platform-home data.');
  await retryHome();
  console.log('PASS: home API failure keeps navigation available and retry restores all five groups.');
  await missingApiHome(false); await missingApiHome(true);
  console.log('PASS: API 404 and failed empty SSR bootstrap both recover every group through public database queries, matching development and server-key failure cases.');
  await languageBelowModes();
  console.log('PASS: language selector below game buttons changes the page and header language; home buttons, sections and game header use worldcup/quiz/tier/Top9/random order.');
  await switchDuringRequest();
  console.log('PASS: changing language during a pending request ignores stale data; view-all → listing → logo returns to the English platform home.');
})().catch(error => { console.error(error); process.exitCode = 1; });
