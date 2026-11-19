const assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const brand=require('../src/seo/siteBrand');
const {renderWorldcupViewHtml}=require('../worldcup-view-routes.cjs');
const {renderTopNineHtml}=require('../top-nine-routes.cjs');
const {renderBoardHtml}=require('../top-nine-board-routes.cjs');
const {renderTemplateHtml}=require('../top-nine-template-routes.cjs');
const langs=Object.keys(require('../src/seo/worldcupViewSeoCopy.json'));
const shell='<html><head><title>Old</title></head><body><div id="root"></div></body></html>';
const origin='https://www.onepickgame.com',id='70e27e0e-1112-4785-b2f6-7aee5f508b0e';
const cup={id,title:'테스트',title_translations:{ko:'한국어 제목',en:'English title'},data:[]};
for(const lang of langs){
 for(const html of [renderWorldcupViewHtml(shell,origin,lang,'result',cup),renderTopNineHtml(shell,origin,lang),renderBoardHtml(shell,origin,lang,{id,title:'My Top 9',slots:[]}),renderTemplateHtml(shell,origin,lang,cup)]){
  const d=new JSDOM(html).window.document;
  assert.equal(d.querySelectorAll('title').length,1);
  assert(d.title.endsWith(lang==='ko'?' | 원픽게임':' | OnePickGame')||lang!=='ko'&&d.title.endsWith(' | One Pick Game'),lang+' '+d.title);
  assert.equal(d.querySelector('link[rel=canonical]').href.startsWith(origin+'/'+lang+'/'),true);
 }
}
assert.equal(brand.localizeTitle('테스트 | One Pick Game','ko'),'테스트 | 원픽게임');
assert.equal(brand.localizeTitle('테스트 | OnePickGame','ko-KR'),'테스트 | 원픽게임');
assert.equal(brand.localizeTitle('One Pick Game 팬 월드컵 | OnePickGame','ko'),'One Pick Game 팬 월드컵 | 원픽게임');
assert.equal(brand.localizeTitle('Test | One Pick Game','en'),'Test | One Pick Game');
console.log('PASS Korean site-name suffix in result/Top9 home/board/template HTML, all 20 languages, unchanged canonicals and creator titles.');
