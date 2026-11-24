// Cache the built SPA shell, never the unbuilt public/index.html (no JS asset tags).
const fs = require('node:fs/promises');
const path = require('node:path');
const cache = new Map();
async function loadSeoTemplate(origin) {
  // Fetch only the static built shell; never re-enter the home SEO handler.
  const base = origin;
  const now = Date.now();
  const entry = cache.get(base);
  if (entry && entry.expires > now) return entry.promise;
  const next = { expires: now + 60000, promise: null };
  const promise = (async () => {
    try {
      const local = await fs.readFile(path.join(__dirname, 'build', 'index.html'), 'utf8');
      if (/<script[^>]+src=["'][^"']*\/static\/js\//i.test(local)) return local;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    // Revalidate the previous remote shell without downloading its bytes again
    // when the static host confirms that its ETag is unchanged.
    const headers = entry?.etag && entry.html ? { 'If-None-Match': entry.etag } : {};
    const response = await fetch(`${base}/seo-shell.html`, { signal: AbortSignal.timeout(10000), headers });
    if (response.status === 304 && entry?.etag && entry.html) {
      next.etag = entry.etag;
      next.html = entry.html;
      return entry.html;
    }
    if (!response.ok) throw new Error(`SPA template HTTP ${response.status}`);
    const html = await response.text();
    if (!/<div\b[^>]*\bid=["']?root(?:["'\s>])/i.test(html) || !/<script[^>]+src=/i.test(html)) throw new Error('SPA template missing root or application script');
    next.etag = response.headers.get('etag');
    next.html = html;
    return html;
  })();
  next.promise = promise;
  cache.set(base, next);
  try { return await promise; }
  catch (error) { cache.delete(base); throw error; }
}
module.exports = { loadSeoTemplate };
