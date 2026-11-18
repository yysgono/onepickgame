const assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const id='91b47d8c-72ec-4f4d-94bf-b88537d7da02';
process.env.SUPABASE_URL=process.env.REACT_APP_SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.invalid';
process.env.SUPABASE_ANON_KEY=process.env.REACT_APP_SUPABASE_ANON_KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-key';
const shell='<html lang="en"><head><title>Old</title><meta name="description" content="old"><link rel="canonical" href="/old"></head><body style="background:#fff"><div class="shell" id="root"><div><p>Other loading markup</p></div></div><script src="/static/js/app.js"></script></body></html>';
require.cache[require.resolve('../seo-template.cjs')]={exports:{loadSeoTemplate:async()=>shell}};
const cup={id,title:'Cup <title>',title_translations:{ko:'축구 선수 월드컵',en:'Football Players'},description:'Saved description',category:'sports',data:Array.from({length:259},(_,i)=>({id:i+1,name:i===0?'<img src=x onerror=alert(1)>':'Player '+i,image:'https://example.com/image.jpg'}))};
const original=global.fetch;
global.fetch=async input=>{const u=new URL(String(input));assert.equal(u.hostname,'test.invalid');return new Response(JSON.stringify(u.pathname.endsWith('/worldcups')?[cup]:[]),{headers:{'content-type':'application/json'}})};
const app=require('../server.js'),langs=Object.keys(require('../src/seo/worldcupViewSeoCopy.json'));
const server=app.listen(0,'127.0.0.1',async()=>{try{
 const base='http://127.0.0.1:'+server.address().port;
 for(const lang of langs){
  const r=await original(`${base}/?seo=worldcup&lang=${lang}&id=${id}`),html=await r.text(),d=new JSDOM(html).window.document;
  assert.equal(r.status,200,html.slice(0,120));assert.equal(d.querySelectorAll('h1').length,1);assert.equal(d.querySelector('#seo-content').style.color,'rgb(32, 37, 52)');
  assert.equal(d.querySelector('.worldcup-entry-count').textContent,require('../src/seo/detailCopy.json')[lang][7].replace('{n}',new Intl.NumberFormat(lang).format(259)));
  const links=[...d.querySelectorAll('.worldcup-entry-links a')];assert.equal(links.length,2);assert.equal(links[0].href,`https://www.onepickgame.com/${lang}/result/${id}`);assert.equal(links[1].href,`https://www.onepickgame.com/${lang}/category/sports`);
  assert.equal(d.querySelector('link[rel=canonical]').href,`https://www.onepickgame.com/${lang}/select-round/${id}`);assert.equal(d.querySelectorAll('meta[name=robots]').length,1);assert(!d.querySelector('meta[name=robots]').content.includes('noindex'));assert(!html.includes('Other loading markup'));assert.equal(d.querySelector('script[src]').getAttribute('src'),'/static/js/app.js');assert.equal(d.querySelector('#seo-content img'),null);assert(html.includes('&lt;img'));
 }
 const {generateLanguageSitemap}=await import('../scripts/generate-sitemap.mjs');
 for(const lang of langs){const xml=generateLanguageSitemap(lang,[cup],[]);assert(xml.includes(`/${lang}/result/${id}`));assert(xml.includes(`/${lang}/select-round/${id}`));assert(!xml.includes(`/${lang}/stats/`));}
 const info=require('../src/seo/worldcupEntryInfo.cjs');assert(info.renderWorldcupEntryInfo({...cup,category:'anime_manga'},'ko','https://www.onepickgame.com').includes('/ko/category/anime-manga'));assert(!info.renderWorldcupEntryInfo({...cup,category:'javascript:alert(1)'},'ko','https://www.onepickgame.com').includes('href="javascript:'));
 console.log('PASS: 20-language server entry HTML, live candidate count, result/category links, readable text, canonical and scripts preserved, safe escaping, varied root loader and canonical sitemap entries.');
 }catch(error){console.error(error);process.exitCode=1;}finally{server.close();global.fetch=original;}});
