const assert=require('node:assert/strict'),fixture=require('./platform-home-fixtures.cjs'),home=require('../src/seo/platformHome');
const {browser}=require('./platform-home-navigation-production.cjs');
const id=i=>'80000000-0000-4000-8000-'+String(i).padStart(12,'0'),dataset={};
for(const [table,original]of [['quizzes',fixture.tables.quizzes[0]],['tier_list_home_cards',fixture.tables.tier_lists[0]],['tier_lists',fixture.tables.tier_lists[0]],['top_nine_public_boards',fixture.tables.top_nine_public_boards[0]]])dataset[table]=Array.from({length:35},(_,i)=>Object.assign({},original,{id:id(i),play_count:100-i,view_count:100-i}));
(async()=>{
 const data=await home.load(fixture.client(new Set(),dataset),'ko');
 const b=browser('/ko',{bootstrap:data,dataset,layout:true,width:6500});
 try{
  for(const kind of ['quiz','tier','nine'])await b.wait(()=>b.d.querySelectorAll('.platform-section-'+kind+' .platform-card').length===12);
  assert.equal(b.d.querySelector('.platform-hero h1'),null);assert.equal(b.d.querySelector('h1').textContent.trim(),'One Pick Game');
  assert.equal(b.d.querySelector('.platform-section-tier .platform-card-meta'),null);
  assert.equal(b.d.querySelector('.platform-section-tier .platform-card>strong').textContent,fixture.cup.tier_preset_title_translations.ko);
  assert.equal(b.d.querySelector('.platform-section-quiz .quiz-category-play').textContent,'지금 풀기 →');
  assert.equal(b.calls.filter(call=>call.path==='/api/platform-home').length,0,'a bounded desktop row should not fetch cards beyond the initial page until requested');
  for(const kind of ['quiz','tier','nine']){
   for(const count of [24,35]){
    const track=b.d.querySelector('.platform-section-'+kind+' .platform-cards');track.scrollLeft=track.scrollWidth-track.clientWidth;
    b.click(b.d.querySelector('.platform-section-'+kind+' .platform-rail-arrow:last-child'));
    try{await b.wait(()=>b.d.querySelectorAll('.platform-section-'+kind+' .platform-card').length===count);}
    catch(error){throw Error(kind+' expected '+count+' cards, found '+b.d.querySelectorAll('.platform-section-'+kind+' .platform-card').length+'; page calls '+b.calls.filter(call=>call.path==='/api/platform-home').map(call=>call.query.toString()).join(' / ')+'; '+error.message);}
   }
  }
  b.w.innerWidth=15000;b.w.dispatchEvent(new b.w.Event('resize'));
  for(const kind of ['quiz','tier','nine'])assert.equal(b.d.querySelectorAll('.platform-section-'+kind+' .platform-card').length,35);
  const calls=b.calls.filter(call=>call.path==='/api/platform-home');
  for(const kind of ['quiz','tier','nine'])assert.deepEqual(calls.filter(call=>call.query.get('kind')===kind).map(call=>Number(call.query.get('offset'))),[12,24]);
  for(const width of [450,15000,7000]){b.w.innerWidth=width;b.w.dispatchEvent(new b.w.Event('resize'));}
  await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(b.calls.filter(call=>call.path==='/api/platform-home').length,6,'resize must stop fetching when all public rows are loaded');
  for(const kind of ['quiz','tier','nine']){const cards=[...b.d.querySelectorAll('.platform-section-'+kind+' .platform-card')];assert.equal(new Set(cards.map(card=>card.getAttribute('href'))).size,35);}
  b.assertErrors();
  console.log('PASS: built bounded home keeps the initial cards on wide screens, next arrows page through 35 quizzes/tier lists/collages, repeated shrink/expand settles, no duplicate calls/cards, exact preset titles and no tier counters.');
 }finally{b.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
