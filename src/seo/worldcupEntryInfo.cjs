const {candidatesOf}=require('./worldcupMetadata.js');
const {getDetailLinks}=require('./detailLinks.js');
const DETAIL=require('./detailCopy.json');
const VIEW=require('./worldcupViewSeoCopy.json');
const CATEGORIES=require('./categoryLabels.json');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderWorldcupEntryInfo(cup,language,origin){
 const lang=VIEW[language]?language:'en',words=VIEW[lang],copy=DETAIL[lang]||DETAIL.en;
 let titles=cup.title_translations;if(typeof titles==='string'){try{titles=JSON.parse(titles);}catch{titles={};}}
 const name=String(titles?.[lang]||titles?.en||cup.title||'').trim();
 const count=new Intl.NumberFormat(lang).format(candidatesOf(cup).length);
 const root=String(origin).replace(/\/$/,'');
 const category=getDetailLinks(lang,cup.category).links[0];
 const categoryName=(CATEGORIES[lang]||CATEGORIES.en)[String(cup.category||'').replace(/-/g,'_')];
 const label=categoryName?categoryName+' · '+copy[1]:copy[1];
 return '<p class="worldcup-entry-count">'+escape(copy[7].replace('{n}',count))+'</p>'+ '<nav class="worldcup-entry-links" aria-label="'+escape(copy[0])+'"><ul>'+ '<li><a href="'+escape(root+'/'+lang+'/result/'+encodeURIComponent(cup.id))+'">'+escape(name+' · '+words.result)+'</a></li>'+ '<li><a href="'+escape(root+category.href)+'">'+escape(label)+'</a></li></ul></nav>';
}
module.exports={renderWorldcupEntryInfo};
