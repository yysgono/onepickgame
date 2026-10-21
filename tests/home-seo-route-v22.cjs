const assert=require('node:assert/strict');
process.env.SUPABASE_URL=process.env.REACT_APP_SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.invalid';
process.env.SUPABASE_ANON_KEY=process.env.REACT_APP_SUPABASE_ANON_KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-key';
const shell='<html><head><title>old</title><link rel="canonical" href="/old"></head><body><div class="shell" id="root"><div>Changed loading</div></div><script src="/static/js/test.js"></script></body></html>';
require.cache[require.resolve('../seo-template.cjs')]={exports:{loadSeoTemplate:async()=>shell}};
const original=global.fetch;
global.fetch=async(url,opts)=>String(url).startsWith('https://test.invalid')?new Response(JSON.stringify([{id:'009dd2c3-e4ef-429b-8b3d-8e71dc9d4449',title:'Sample',title_translations:{ko:'테스트 월드컵'}}]),{headers:{'content-type':'application/json'}}):original(url,opts);
const app=require('../server.js');
const server=app.listen(0,'127.0.0.1',async()=>{
 try {for(const lang of Object.keys(require('../src/seo/siteHomeCopy.json'))){const response=await original(`http://127.0.0.1:${server.address().port}/?seo=home&lang=${lang}`);const html=await response.text();assert.equal(response.status,200);assert.equal((html.match(/<title\b/g)||[]).length,1);assert(html.includes(`/${lang}/select-round/009dd2c3`));assert(!html.includes('Changed loading'));assert(!html.includes('width:1px'));assert(html.includes('/static/js/test.js'));}console.log('PASS: actual home middleware for all 16 languages');}
 catch(error){console.error(error);process.exitCode=1;}finally{server.close();global.fetch=original;}
});
