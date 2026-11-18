const assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const home=require('../src/seo/platformHome'),fixture=require('./platform-home-fixtures.cjs'),content=require('../src/seo/worldcupCardContent');
const id=i=>'80000000-0000-4000-8000-'+String(i).padStart(12,'0');
const overrides={};
for(const [table,original]of [['quizzes',fixture.tables.quizzes[0]],['tier_list_home_cards',fixture.tables.tier_lists[0]],['tier_lists',fixture.tables.tier_lists[0]],['top_nine_public_boards',fixture.tables.top_nine_public_boards[0]]])overrides[table]=Array.from({length:35},(_,i)=>Object.assign({},original,{id:id(i),play_count:100-i,view_count:100-i}));
(async()=>{
 for(const [kind,table]of [['quiz','quizzes'],['tier','tier_list_home_cards'],['nine','top_nine_public_boards']]){
  const client=fixture.client(new Set(),overrides),seen=[];
  for(const offset of [0,12,24]){
   const data=await home.load(client,'ko',{kind,offset,limit:12}),group=data.groups.find(group=>group.kind===kind);
   assert.equal(group.rows.length,offset===24?11:12);assert.equal(group.hasMore,offset!==24);assert.equal(group.nextOffset,Math.min(offset+12,35));
   seen.push(...group.rows.map(row=>row.href));
  }
  assert.equal(new Set(seen).size,35);assert.equal(client.calls.filter(q=>q.table===table).length,3);
  assert(!client.calls.some(q=>q.table==='get_worldcup_play_counts'||kind!=='quiz'&&q.table==='quizzes'));
 }
 const configured=fixture.cup.tier_preset_title_translations.ko;
 const legacy=Object.assign({},fixture.tables.tier_lists[0],{title:'축구 선수 티어표 만들기 – 축구 선수 순위',tier_labels:{_customPublicTitle:'축구 선수 티어표 만들기 – 축구 선수 순위'}});
 assert.equal(home.homeTierTitle(legacy,[fixture.cup],'ko'),configured);
 const data=await home.load(fixture.client(),'ko'),worldcup=data.groups[0].rows[0];
 assert.equal(worldcup.description,content.candidateLine(fixture.cup,[],'ko'));assert.equal(worldcup.candidateCount,fixture.cup.data.length);
 assert(!data.groups[2].rows[0].meta);
 const d=new JSDOM(home.render(data,'ko')).window.document;
 assert.equal(d.querySelector('.platform-hero h1'),null);assert.equal(d.querySelectorAll('h1').length,1);assert.equal(d.querySelector('h1').textContent,'One Pick Game');
 assert.equal(d.querySelector('.platform-section-quiz .quiz-category-play').textContent,'지금 풀기 →');
 for(const copy of Object.values(home.COPY))for(let i=0;i<5;i++)assert(copy.summaries[i].length<copy.descriptions[i].length);
 assert.throws(()=>home.optionsFor({kind:'invalid'}));assert.throws(()=>home.optionsFor({offset:-1}));assert.throws(()=>home.optionsFor({limit:41}));
 const cached=home.makeLoader(fixture.client(new Set(),overrides));const first=await cached('ko',{kind:'quiz',offset:0}),second=await cached('ko',{kind:'quiz',offset:12});assert.notEqual(first.groups[1].rows[0].href,second.groups[1].rows[0].href);
 console.log('PASS: 35 registered quizzes/tier lists/collages paginate without gaps or duplicates; per-kind requests, correct cursors/cache keys, configured tier titles, original worldcup content, short summaries, quiz CTA and brand-only H1.');
})().catch(error=>{console.error(error);process.exitCode=1});
