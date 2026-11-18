const assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),fixture=require('./platform-home-fixtures.cjs');
process.env.SUPABASE_URL=process.env.REACT_APP_SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.invalid';process.env.SUPABASE_ANON_KEY=process.env.REACT_APP_SUPABASE_ANON_KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-key';
const shell='<html lang="en"><head><title>Old</title><meta name="description" content="old"><link rel="canonical" href="/old"></head><body><div id="root"><div>Loading</div></div><script src="/static/js/app.js"></script></body></html>';
require.cache[require.resolve('../seo-template.cjs')]={exports:{loadSeoTemplate:async()=>shell}};const original=global.fetch,calls=[];
global.fetch=async(input,init)=>{const u=new URL(String(input));assert.equal(u.hostname,'test.invalid');const table=u.pathname.split('/').at(-1);calls.push({table,fields:u.searchParams.get('select'),method:init?.method||'GET'});let data=table==='get_worldcup_play_counts'?[{cup_id:fixture.id,play_count:99}]:fixture.tables[table]||[];return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}})};
const home=require('../src/seo/platformHome'),app=require('../server');const server=app.listen(0,'127.0.0.1',async()=>{try{
 const base='http://127.0.0.1:'+server.address().port;
 for(const lang of Object.keys(home.COPY)){
  for(const page of ['home','worldcup-home']){
   const r=await original(`${base}/?seo=${page}&lang=${lang}`),html=await r.text(),d=new JSDOM(html).window.document;
   assert.equal(r.status,200,html.slice(0,160));assert.equal(d.querySelectorAll('h1').length,1);assert(!d.querySelector('meta[name=robots]').content.includes('noindex'));assert.equal(d.querySelectorAll('title').length,1);assert.equal(d.querySelectorAll('link[rel=alternate][hreflang]').length,21);assert.equal(d.querySelector('script[src]').getAttribute('src'),'/static/js/app.js');
   if(page==='home'){
    assert.equal(d.querySelector('h1').textContent,'One Pick Game');assert.equal(d.querySelector('.platform-hero h1'),null);assert.equal(d.querySelectorAll('.platform-section').length,5);assert.equal(d.querySelector('link[rel=canonical]').href,'https://www.onepickgame.com'+(lang==='en'?'/':'/'+lang));assert.equal(d.querySelector('.platform-section-worldcup h2 a').getAttribute('href'),`/${lang}/ideal-type-world-cup`);assert.equal(JSON.parse(d.getElementById('platform-home-data').textContent).lang,lang);
   }else{
    assert.equal(d.querySelector('.home-shell-brand').getAttribute('href'),lang==='en'?'/':'/'+lang);
    assert.equal(d.querySelector('link[rel=canonical]').href,`https://www.onepickgame.com/${lang}/ideal-type-world-cup`);assert.equal(d.querySelector('link[hreflang=x-default]').href,'https://www.onepickgame.com/en/ideal-type-world-cup');assert(html.includes(`/${lang}/select-round/${fixture.id}`));assert(!d.querySelector('.platform-home'));assert.equal(d.querySelector('script#platform-home-data'),null);
   }
  }
 }
 const q=await original(`${base}/?seo=home&lang=ko&search=football&creator=admin&focus=search`,{redirect:'manual'});assert.equal(q.status,302);assert.equal(q.headers.get('location'),'https://www.onepickgame.com/ko/ideal-type-world-cup?search=football&creator=admin&focus=search');
 const api=await original(base+'/api/platform-home?lang=ko');assert.equal(api.status,200);assert.equal((await api.json()).groups.length,5);assert.equal((await original(base+'/api/platform-home?lang=invalid')).status,400);
 assert.equal((await original(base+'/api/platform-home?lang=ko&kind=wrong')).status,400);assert.equal((await original(base+'/api/platform-home?lang=ko&offset=-1')).status,400);assert.equal((await original(base+'/api/platform-home?lang=ko&limit=41')).status,400);
 const {generateLanguageSitemap}=await import('../scripts/generate-sitemap.mjs');for(const lang of Object.keys(home.COPY)){const xml=generateLanguageSitemap(lang,[fixture.cup],[{id:fixture.other,created_at:'2026-11-18'}],[{id:fixture.other,created_at:'2026-11-18',content_languages:[lang]}],[{id:fixture.other,created_at:'2026-11-18'}]);for(const part of ['/ideal-type-world-cup','/select-round/'+fixture.id,'/result/'+fixture.id,'/tier-list/'+fixture.other,'/quiz/'+fixture.other,'/mytop9/'+fixture.other])assert(xml.includes('/'+lang+part),lang+part);}
 assert(!calls.some(c=>!['GET','POST'].includes(c.method)));assert(calls.filter(c=>c.method==='POST').every(c=>c.table==='get_worldcup_play_counts'));
 console.log('PASS: server home/listing canonicals and hreflangs in 20 languages, five sections and source URLs, legacy query redirects, public API, existing detail sitemap URLs and read-only requests.');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();global.fetch=original;}});
