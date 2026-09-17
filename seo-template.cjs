// Cache the built SPA shell, never the unbuilt public/index.html (no JS asset tags).
const fs = require('node:fs/promises');
const path = require('node:path');
const cache = new Map();
async function loadSeoTemplate(origin) {
  // Keep the existing public origin fallback: protected preview URLs cannot be
  // fetched anonymously. Local production builds use build/index.html above.
  const base = origin;
  const now = Date.now();
  const entry = cache.get(base);
  if (entry && entry.expires > now) return entry.promise;
  const promise = (async () => {
    try {
      const local = await fs.readFile(path.join(__dirname, 'build', 'index.html'), 'utf8');
      if (/<script[^>]+src=["'][^"']*\/static\/js\//i.test(local)) return local;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const response = await fetch(`${base}/`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`SPA template HTTP ${response.status}`);
    const html = await response.text();
    if (!/<div\b[^>]*\bid=["']?root(?:["'\s>])/i.test(html) || !/<script[^>]+src=/i.test(html)) throw new Error('SPA template missing root or application script');
    return html;
  })();
  cache.set(base, { expires: now + 60000, promise });
  try { return await promise; }
  catch (error) { cache.delete(base); throw error; }
}
module.exports = { loadSeoTemplate };
