// Initial home content only. No candidate data, statistics or image downloads.
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
function makeRecentLoader(client, now = Date.now) {
  let rows = [], expires = 0, pending;
  return async function load() {
    if (now() < expires) return rows;
    if (pending) return pending;
    pending = (async () => {
      try {
        const {data,error} = await client.from('worldcups').select('id,title,title_translations')
          .is('deleted_at',null).order('created_at',{ascending:false}).order('id',{ascending:false})
          .limit(6).abortSignal(AbortSignal.timeout(1500));
        if (error) throw error;
        rows = Array.isArray(data) ? data : [];
        expires = now() + 60000;
      } catch { expires = now() + 15000; }
      return rows;
    })();
    try { return await pending; } finally { pending = null; }
  };
}
function renderHomeBody(rows, lang, copy) {
  const links = rows.filter(row => /^[0-9a-f-]{36}$/i.test(row.id)).map(row => {
    let translations = row.title_translations;
    if (typeof translations === 'string') { try { translations = JSON.parse(translations); } catch { translations = {}; } }
    const title = translations?.[lang] || translations?.en || row.title;
    return title ? `<li><a href="/${lang}/select-round/${row.id}">${escape(title)}</a></li>` : '';
  }).join('');
  return `<main id="seo-content" style="max-width:1100px;margin:24px auto;padding:24px;color:#202534;font-family:Arial,sans-serif;line-height:1.7"><h1>${escape(copy.title.split('|')[0].trim())}</h1><p>${escape(copy.description)}</p><ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding-inline-start:24px">${links}</ul></main>`;
}
function verifyHome(html) {
  if (!/id="seo-content"/.test(html) || (html.match(/<title\b/gi)||[]).length !== 1 || !/<link\b[^>]*rel=["']canonical["']/i.test(html)) throw new Error('Home SEO output incomplete');
  return html;
}
module.exports = {insertRoot, makeRecentLoader, renderHomeBody, verifyHome};
