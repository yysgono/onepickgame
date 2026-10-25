// Initial home content only. No candidate data or image downloads; reuse the existing play-count RPC.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function insertRoot(html, body) {
  const opening = /<div\b[^>]*\bid\s*=\s*(?:"root"|'root'|root(?=[\s>]))[^>]*>/i.exec(html);
  if (!opening) throw new Error('SEO shell root missing');
  const tags = /<!--[\s\S]*?-->|<\/?div\b[^>]*>/gi;
  tags.lastIndex = opening.index + opening[0].length;
  let depth = 1, tag;
  while ((tag = tags.exec(html))) {
    if (tag[0].startsWith('<!--')) continue;
    depth += /^<\//.test(tag[0]) ? -1 : 1;
    if (!depth) return html.slice(0, opening.index + opening[0].length) + body + html.slice(tag.index);
  }
  throw new Error('SEO shell root closing tag missing');
}
function makePopularLoader(client, now = Date.now) {
  let rows = [], expires = 0, pending;
  return async function load() {
    if (now() < expires) return rows;
    if (pending) return pending;
    pending = (async () => {
      try {
        const signal = AbortSignal.timeout(1500);
        const {data:counts,error:countError} = await client.rpc('get_worldcup_play_counts')
          .order('play_count',{ascending:false}).order('cup_id',{ascending:true}).limit(24).abortSignal(signal);
        if (countError) throw countError;
        const ids = [...new Set((counts || []).map(row=>String(row.cup_id || '')).filter(id=>/^[0-9a-f-]{36}$/i.test(id)))];
        if (!ids.length) { rows=[];expires=now()+300000;return rows; }
        const {data,error} = await client.from('worldcups').select('id,title,title_translations')
          .is('deleted_at',null).in('id',ids).limit(24).abortSignal(signal);
        if (error) throw error;
        const byId = new Map((data || []).map(row=>[String(row.id),row]));
        rows = ids.map(id=>byId.get(id)).filter(Boolean).slice(0,6);
        expires = now() + 300000;
      } catch { expires = now() + 15000; }
      return rows;
    })();
    try { return await pending; } finally { pending = null; }
  };
}
const HOME_SHELL_COPY = require('./src/seo/homeShellCopy.json');
function renderHomeBody(rows, lang, copy) {
  const ui = HOME_SHELL_COPY[lang] || HOME_SHELL_COPY.en;
  const paths = [lang === 'en' ? '/' : `/${lang}`, `/${lang}/quiz`, `/${lang}/tier-list`, `/${lang}/random-pick`];
  const icons = ['🏆', '?', '▥', '⚄'];
  const links = rows.filter(row => /^[0-9a-f-]{36}$/i.test(row.id)).map(row => {
    let translations = row.title_translations;
    if (typeof translations === 'string') { try { translations = JSON.parse(translations); } catch { translations = {}; } }
    const title = translations?.[lang] || translations?.en || row.title;
    return title ? `<li><a href="/${lang}/select-round/${row.id}"><span class="home-shell-card-preview" aria-hidden="true">🏆</span><strong>${escape(title)}</strong></a></li>` : '';
  }).join('');
  return `<div id="seo-content" class="home-shell" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<style>
.home-shell{background:#fff;color:#202534;font-family:"Noto Sans",Arial,sans-serif;min-height:100vh;line-height:1.65}
.home-shell *{box-sizing:border-box}.home-shell a{color:inherit;text-decoration:none}.home-shell a:focus-visible{outline:3px solid #5542b8;outline-offset:4px}
.home-shell-header{display:flex;align-items:stretch;border-bottom:2px solid #dce1e9;padding:0 32px;min-height:134px}
.home-shell-brand{display:flex;align-items:center;gap:12px;flex:1;font-size:30px;font-weight:800;font-style:italic}.home-shell-brand img{width:72px;height:72px;border-radius:50%;object-fit:contain}
.home-shell-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));width:60%}.home-shell-nav a{display:flex;flex-direction:column;justify-content:center;align-items:center;padding:18px 10px;text-align:center;font-size:24px;font-weight:700;border-inline-start:1px solid #edf0f4;line-height:1.4}.home-shell-nav a:first-child{background:#f97316;color:white}.home-shell-nav span{font-size:35px;margin-bottom:10px}
.home-shell-summary{max-width:1060px;margin:0 auto 18px;padding:0 24px;text-align:center;font-size:15px;font-weight:750;color:#475569}
.home-shell-main{max-width:1100px;margin:auto;padding:20px 24px 48px}.home-shell-intro{text-align:center;margin:0 auto 24px}.home-shell-intro h1{font-size:38px;line-height:1.35;margin:0 0 18px;font-weight:800}.home-shell-create{display:inline-flex;align-items:center;justify-content:center;background:#f97316;color:white!important;width:360px;max-width:100%;min-height:56px;padding:12px 20px;border-radius:10px;font-size:20px;font-weight:750}
.home-shell-list-title{font-size:24px;margin:32px 0 18px}.home-shell-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;list-style:none;padding:0;margin:0}.home-shell-list li{min-width:0}.home-shell-list a{display:block;border:1px solid #e0e4eb;border-radius:14px;overflow:hidden;background:#fff}.home-shell-card-preview{height:180px;display:flex;align-items:center;justify-content:center;background:#f4f5f8;color:#9aa3b2;font-size:48px}.home-shell-list strong{display:block;padding:16px;font-size:17px;line-height:1.5;overflow-wrap:anywhere}
@media(max-width:1100px){.home-shell-header{flex-direction:column;padding:0 24px}.home-shell-brand{padding:16px 0}.home-shell-brand img{width:56px;height:56px}.home-shell-nav{width:100%}.home-shell-nav a{font-size:19px;min-height:100px}}
@media(max-width:600px){.home-shell-header{padding:0 12px}.home-shell-brand{justify-content:center;font-size:24px}.home-shell-brand img{width:40px;height:40px}.home-shell-nav a{font-size:15px;padding:12px 5px;min-height:90px}.home-shell-nav span{font-size:27px}.home-shell-summary{padding:0 6px;font-size:14px;margin:0 auto 18px}.home-shell-main{padding:26px 12px 36px}.home-shell-intro h1{font-size:30px}.home-shell-create{font-size:18px;min-height:52px}.home-shell-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.home-shell-card-preview{height:130px}.home-shell-list strong{font-size:14px;padding:12px}}
</style>
<header class="home-shell-header"><a class="home-shell-brand" href="${paths[0]}"><img src="/onepick2.png" alt="OnePickGame" width="72" height="72">One Pick Game</a><nav class="home-shell-nav">${[ui.modes[0],ui.modes[2],ui.modes[1],ui.modes[3]].map((name,i)=>`<a href="${paths[i]}"${i===0?' aria-current="page"':''}><span aria-hidden="true">${icons[i]}</span>${escape(name)}</a>`).join('')}</nav></header>
<main class="home-shell-main"><section class="home-shell-intro"><h1>🏆 ${escape(copy.heading || ui.modes[0])}</h1><p class="home-shell-summary">${escape(copy.description)}</p><a class="home-shell-create" href="/${lang}/worldcup-maker">＋ ${escape(ui.create)}</a></section>${links?`<h2 class="home-shell-list-title">${escape(ui.popular)}</h2><ul class="home-shell-list">${links}</ul>`:''}</main></div>`;
}
function verifyHome(html) {
  if (!/id="seo-content"/.test(html) || (html.match(/<title\b/gi)||[]).length !== 1 || !/<link\b[^>]*rel=["']canonical["']/i.test(html)) throw new Error('Home SEO output incomplete');
  return html;
}
module.exports = {insertRoot, makePopularLoader, renderHomeBody, verifyHome};
