const assert=require('assert/strict'),fs=require('fs'),{renderTopNineHtml}=require('../top-nine-routes.cjs'),legal=require('../src/legal/legalPolicy');
const copy=JSON.parse(fs.readFileSync('src/components/topNine/copy.json')),routes=JSON.parse(fs.readFileSync('vercel.json')).routes,paths=JSON.parse(fs.readFileSync('spa-paths.json'));
assert(paths.includes('/:lang/mytop9'));assert(routes.some(r=>r.dest==='/server.js?seo=top-nine&lang=$1'));
const shell='<html><head><title>old</title><meta name="robots" content="noindex"><link rel="canonical" href="old"></head><body><div id="root"></div><script src="/static/js/main.js"></script></body></html>';
for(const lang of Object.keys(copy)){
 const xml=fs.readFileSync(`public/sitemaps/sitemap-${lang}-v2.xml`,'utf8');assert.equal(xml.split(`<loc>https://www.onepickgame.com/${lang}/mytop9</loc>`).length-1,1,lang);
 const html=renderTopNineHtml(shell,'https://www.onepickgame.com',lang);assert(html.includes('content="index,follow"'));assert(!html.includes('noindex'));assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert(html.includes(`href="https://www.onepickgame.com/${lang}/mytop9"`));assert.equal((html.match(/hreflang=/g)||[]).length,21);assert(html.includes('/static/js/main.js'));
 for(const page of ['terms-of-service','privacy-policy']){const policy=legal.getLegalPolicy(lang,page);assert(policy.sections.some(([heading])=>heading.replace(/[-\s]/g,'').includes('MyTop9')));assert.equal(policy.version,'2026-11-04');}
}
assert.equal(copy.en.title,'Create My Top 9');assert.equal(copy.en.nav,'My Top 9');
assert(fs.readFileSync('src/components/topNine/media.js','utf8').includes("fillText('OnePickGame.com'"));
console.log('20 sitemap entries, canonical/hreflang/indexable server HTML, routing, localized policy sections, English naming and export credit passed');
