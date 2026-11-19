// Localize only the site-name suffix; never rewrite a creator's title.
function brandName(language, fallback='OnePickGame') {
 return String(language||'en').toLowerCase().split(/[-_]/)[0]==='ko'?'원픽게임':fallback;
}
function localizeTitle(value,language) {
 const title=String(value||'');
 if(brandName(language)!=='원픽게임')return title;
 if(/^one\s*pick\s*game$/i.test(title.trim()))return '원픽게임';
 return title.replace(/([|｜–—-]\s*)one\s*pick\s*game\s*$/i,'$1원픽게임');
}
module.exports={brandName,localizeTitle};
