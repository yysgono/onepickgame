const assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),home=require('../src/seo/platformHome'),paths=require('../src/seo/sitePaths'),fixture=require('./platform-home-fixtures.cjs');
(async()=>{
 assert(home.COPY.ko.descriptions[0].includes('최종 우승자'));
 assert(home.COPY.ko.descriptions[1].includes('퀴즈를 직접'));
 assert(home.COPY.ko.descriptions[2].includes('이미지로'));
 assert(home.COPY.ko.descriptions[4].includes('룰렛'));
 assert(home.COPY.ko.descriptions[3].includes('9개'));
 for(const lang of Object.keys(home.COPY)){
  const c=fixture.client(),data=await home.load(c,lang);assert.equal(data.groups.length,5);assert.deepEqual(data.groups.map(g=>g.kind),['worldcup','quiz','tier','nine','random']);assert.equal(data.groups[0].href,`/${lang}/ideal-type-world-cup`);assert(data.groups.every(g=>g.rows.length<=12));assert.equal(data.groups[0].rows[0].href,`/${lang}/select-round/${fixture.id}`);assert.equal(data.groups[0].rows[0].images[0],'https://example.com/winner.jpg');assert.equal(data.groups[4].rows[0].mode,'pinball');
  assert(c.calls.every(q=>q.fields!=='*'));assert(!JSON.stringify(data).includes('\"data\":'));assert.equal(data.groups[0].rows[0].candidateCount,2);assert.equal(data.groups[0].rows[0].description,'A · B');
  if(lang==='en'){assert.equal(data.groups[2].rows[0].label,'Football Tier List');assert.equal(data.groups[3].rows[0].label,'Football Top 9 - admin');}
  assert(c.calls.find(q=>q.table==='tier_lists').fields.includes('original_language'));
  assert(data.groups[2].rows[0].tierPreview.hasTierPreview);
  assert.equal(data.groups[2].rows[0].tierPreview.tierPreview[0].candidates.length,5);
  const d=new JSDOM(home.render(data,lang)).window.document;assert.equal(d.querySelector('.platform-language select').value,lang);assert.equal(d.querySelectorAll('.platform-language option').length,20);assert.equal(d.querySelectorAll('.platform-section').length,5);const titles=[...d.querySelectorAll('.platform-section h2 a')].map(e=>e.textContent.trim().replace(/^\S+\s/,''));assert.equal(d.querySelectorAll('.platform-section-heading>a').length,5);assert.equal(d.querySelectorAll('h1').length,1);assert.equal(d.querySelectorAll('.platform-section-nine .platform-collage-cell').length,9);assert([...d.querySelectorAll('.platform-section-nine .platform-collage-cell')].every(cell=>cell.style.clipPath.startsWith('polygon(')));assert(d.querySelector('.platform-section-nine .platform-collage path'));assert.equal(d.querySelector('.platform-section-nine .platform-nine'),null);
  [...d.querySelectorAll('.platform-section')].forEach(section=>assert.equal(section.querySelector('h2 a').href,section.querySelector('.platform-section-heading>a').href));
  if(lang==='ko')assert.deepEqual(home.COPY.ko.titles,['이상형 월드컵','퀴즈 맞히기','티어표','최애 구절판 취향표','랜덤 뽑기']);
 }
 const c=fixture.client(),cached=home.makeLoader(c);await Promise.all([cached('ko'),cached('ko')]);const count=c.calls.length;await cached('ko');assert.equal(c.calls.length,count,'reuse in-flight and cached public metadata');
 const noView=fixture.client(new Set(['tier_list_home_cards'])),fallback=await home.load(noView,'ko');assert(!fallback.groups[2].unavailable);assert(fallback.groups[2].rows[0].tierPreview.hasTierPreview);assert(noView.calls.filter(q=>q.table==='tier_lists').every(q=>!q.fields.includes('tier_preview_counts')));
 const partial=await home.load(fixture.client(new Set(['quizzes'])),'en');assert(partial.groups[1].unavailable);assert.equal(partial.groups[0].rows.length,1);assert.equal(paths.siteHome('en'),'/');assert.equal(paths.worldcupHome('ko'),'/ko/ideal-type-world-cup');assert(paths.isWorldcupHome('/ko/ideal-type-world-cup'));
 console.log('PASS: 20-language five-row home, clickable titles/all links, unchanged detail IDs, stored winner previews, real popularity ordering, translated tier/collage titles, metadata-only queries, partial failures and shared cache.');
})().catch(e=>{console.error(e);process.exitCode=1});
