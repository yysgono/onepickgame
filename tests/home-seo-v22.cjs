const assert=require('node:assert/strict');
const {insertRoot,makeRecentLoader,renderHomeBody,verifyHome}=require('../home-seo-support.cjs');
const copies=require('../src/seo/siteHomeCopy.json');
(async()=>{
 const samples=['<div id="root"><div class="loading-screen">Loading...</div></div>','<div class="app" id="root"></div>',"<div id='root'><div><div>Loading changed</div></div></div>",'<div id=root><!-- <div> --></div>'];
 for(const shell of samples){const out=insertRoot('<head></head>'+shell+'<script src="/static/js/app.js"></script>','<main id="seo-content">Game</main>');assert(out.includes('Game</main></div><script'));assert(!out.includes('Loading'));}
 assert.throws(()=>insertRoot('<div id="other"></div>','x'));
 assert.throws(()=>insertRoot('<div id="root">','x'));
 for(const [lang,copy] of Object.entries(copies)){
  const body=renderHomeBody([{id:'009dd2c3-e4ef-429b-8b3d-8e71dc9d4449',title:'<script>bad</script>',title_translations:{[lang]:'Game & title'}}],lang,copy);
  assert(body.includes(`/${lang}/select-round/`));assert(body.includes('Game &amp; title'));assert(!body.includes('width:1px'));
  verifyHome('<title>test</title><link rel="canonical" href="/">'+body);
 }
 assert.throws(()=>verifyHome('<title>a</title><title>b</title>'));
 let calls=0,time=0,fail=false;
 const q={select(fields){assert.equal(fields,'id,title,title_translations');return this},is(){return this},order(){return this},limit(n){assert.equal(n,6);return this},async abortSignal(){calls++;return fail?{error:new Error('offline')}:{data:[{id:'saved'}]}}};
 const load=makeRecentLoader({from(){return q}},()=>time);
 const pair=await Promise.all([load(),load()]);assert.equal(calls,1);assert.deepEqual(pair[0],pair[1]);await load();assert.equal(calls,1);
 time=61000;fail=true;assert.deepEqual(await load(),[{id:'saved'}]);assert.equal(calls,2);
 console.log('PASS: root variations/failure detection, 16 languages, escaped links, bounded query, concurrent cache, failure fallback');
})();
