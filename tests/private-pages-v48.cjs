const assert=require('assert/strict'),fs=require('fs'),express=require('express'),{JSDOM}=require('jsdom');
const template='<html><head><title>Old</title><meta name="description" content="old"><meta name="robots" content="index,follow"><script defer src="/static/js/main.js"></script></head><body><div id="root"><div class="loading-screen">Loading...</div></div></body></html>';
require.cache[require.resolve('../seo-template.cjs')]={exports:{loadSeoTemplate:async()=>template}};
const db={from(){throw Error('Private routes must not query content data');}};const origin='https://www.onepickgame.com',app=express();require('../quiz-seo.cjs')(app,db,origin,{loadTemplate:async()=>template});require('../category-routes.cjs')(app,db,origin);app.use((req,res)=>res.status(404).send('Not found'));
const server=app.listen(0,'127.0.0.1',async()=>{try{
 const base=`http://127.0.0.1:${server.address().port}`;const langs=Object.keys(require('../src/seo/categoryLabels.json'));
 for(const lang of langs)for(const page of ['my-worldcups','worldcup-maker','quiz/create']){
  const url=page==='quiz/create'?`/server.js?seo=quiz-create&lang=${lang}`:`/server.js?seo=spa&path=${encodeURIComponent(lang+'/'+page)}`;
  const r=await fetch(base+url);assert.equal(r.status,200,lang+'/'+page);assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.match(r.headers.get('cache-control'),/no-store/);const d=new JSDOM(await r.text()).window.document;
  assert.equal(d.querySelectorAll('meta[name=robots]').length,1);assert.match(d.querySelector('meta[name=robots]').content,/noindex/);assert(d.querySelector('meta[name=description]').content);assert.equal(d.querySelector('link[rel=canonical]').href,`${origin}/${lang}/${page}`);assert(d.querySelector('script[src="/static/js/main.js"]'),'React app assets preserved');
 }
 const config=require('../vercel.json');for(const path of ['/en/my-worldcups','/ko/worldcup-maker']){const route=config.routes.find(r=>r.src&&new RegExp('^'+r.src+'$').test(path));assert(route?.dest.includes('seo=spa'),path+' must use SPA middleware');}
 const source=fs.readFileSync('src/App.js','utf8');assert.match(source.slice(source.indexOf('slug="worldcup-maker"'),source.indexOf('<WorldcupMaker\n')),/indexable=\{false\}/);
 console.log('PASS: all 48 private language URLs return noindex HTML/header, description and canonical, no-store, intact SPA assets, no content DB queries; Vercel routing and client maker policy');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();}});
