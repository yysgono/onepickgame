const {getLegalPolicy,LANGUAGES}=require('./src/legal/legalPolicy.js');
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderLegalPolicy(language,page,origin){
 const meta=getLegalPolicy(language,page),canonical=`${origin}/${meta.lang}/${page}`;
 const head=`<title data-rh="true">${escape(meta.title)} | OnePickGame</title><meta data-rh="true" name="description" content="${escape(meta.sections[0][1])}"><meta data-rh="true" name="robots" content="index, follow"><link data-rh="true" rel="canonical" href="${escape(canonical)}">`
 +LANGUAGES.map(lang=>`<link data-rh="true" rel="alternate" hreflang="${lang}" href="${origin}/${lang}/${page}">`).join('')
 +`<link data-rh="true" rel="alternate" hreflang="x-default" href="${origin}/en/${page}">`;
 const body=`<main lang="${meta.lang}" dir="${meta.dir}" style="max-width:900px;margin:40px auto;padding:24px clamp(16px,4vw,32px);background:#fff;border-radius:13px;color:#202534;font-size:16px;line-height:1.8;overflow-wrap:anywhere;box-sizing:border-box">`
 +`<h1 style="font-size:clamp(25px,5vw,34px);line-height:1.4">${escape(meta.title)}</h1><p>${escape(meta.operatorLabel)}: <b>${escape(meta.operator)}</b> · ${escape(meta.country)}<br>${escape(meta.contactLabel)}: <a href="mailto:${escape(meta.email)}">${escape(meta.email)}</a><br>${escape(meta.updatedLabel)}: <time datetime="${meta.version}">${meta.version}</time></p>`
 +`<nav aria-label="Language" style="display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 28px">${LANGUAGES.map(lang=>`<a href="/${lang}/${page}" lang="${lang}" hreflang="${lang}"${lang===meta.lang?' aria-current="page"':''} style="padding:4px 9px;border:1px solid #cbd5e1;border-radius:6px;color:${lang===meta.lang?'white':'#5542b8'};background:${lang===meta.lang?'#5542b8':'#fff'};font-size:14px">${lang.toUpperCase()}</a>`).join('')}</nav>`
 +meta.sections.map(([h,t])=>`<section style="margin:24px 0"><h2 style="font-size:20px;line-height:1.5;margin-bottom:8px">${escape(h)}</h2><p style="margin:0;white-space:pre-line">${escape(t)}</p></section>`).join('')
 +`<p><a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">Google · myaccount.google.com/connections</a></p><p><a href="https://nid.naver.com/" target="_blank" rel="noopener noreferrer">NAVER</a></p><p><a href="/${meta.lang}/${meta.otherPage}">${escape(meta.otherTitle)}</a></p></main>`;
 return {head,body,lang:meta.lang};
}
module.exports={renderLegalPolicy};

