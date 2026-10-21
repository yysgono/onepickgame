const {loadSeoTemplate}=require('./seo-template.cjs');
const COPY=require('./src/components/randomPick/randomPickCopy.json');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports=(app,origin)=>app.use(async(req,res,next)=>{
 const match=req.path.match(/^\/([a-z]{2})\/random-pick(?:\/([^/]+))?\/?$/);
 if(req.query.seo!=='random-pick'&&!match)return next();
 const lang=match?.[1]||String(req.query.lang||''),mode=match?.[2]||String(req.query.mode||'');
 if(mode==='slots')return res.redirect(301,`${origin}/${lang}/random-pick/cards`);
 if(mode==='pirate')return res.redirect(301,`${origin}/${lang}/random-pick/dice`);
 const copy=Object.prototype.hasOwnProperty.call(COPY,lang)?COPY[lang]:null;
 if(!copy||(mode&&!Object.prototype.hasOwnProperty.call(copy.modes,mode))){res.setHeader('X-Robots-Tag','noindex');return res.status(404).send('Not Found');}
 try {
  let html=await loadSeoTemplate(origin);const base=`${origin}/${lang}/random-pick`,canonical=base+(mode?`/${mode}`:'');
  const heading=mode?`${copy.modes[mode]} · ${copy.heading}`:copy.heading;
  const title=`${heading} | ${lang==='ko'?'원픽게임':'OnePickGame'}`;
  const description=`${heading}. ${copy.intro} ${copy.import}.`;
  const alternates=Object.keys(COPY).map(l=>`<link data-rh="true" rel="alternate" hreflang="${l}" href="${origin}/${l}/random-pick${mode?'/'+mode:''}">`).join('');
  const head=`<title data-rh="true">${escape(title)}</title><meta data-rh="true" name="description" content="${escape(description)}"><meta data-rh="true" name="robots" content="index, follow, max-image-preview:large"><link data-rh="true" rel="canonical" href="${canonical}">${alternates}<link data-rh="true" rel="alternate" hreflang="x-default" href="${origin}/en/random-pick${mode?'/'+mode:''}"><meta data-rh="true" property="og:title" content="${escape(title)}"><meta data-rh="true" property="og:description" content="${escape(description)}"><meta data-rh="true" property="og:url" content="${canonical}"><meta data-rh="true" property="og:type" content="website"><meta data-rh="true" property="og:image" content="${origin}/ogimg.png"><meta data-rh="true" name="twitter:card" content="summary_large_image"><meta data-rh="true" name="twitter:title" content="${escape(title)}"><meta data-rh="true" name="twitter:description" content="${escape(description)}">`;
  html=html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi,'').replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi,'').replace(/<html\b[^>]*>/i,`<html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}">`).replace('</head>',()=>head+'</head>');
  const body=`<main style="max-width:1000px;margin:40px auto;padding:24px;font-family:system-ui"><h1>${escape(heading)}</h1><p>${escape(copy.intro)}</p><p>${escape(copy.import)}</p><nav>${Object.entries(copy.modes).map(([id,name])=>`<p><a href="${base}/${id}">${escape(name)}</a></p>`).join('')}</nav><p>${escape(copy.fair)}</p></main>`;
  const root=/<div\s+id=["']root["']>\s*(?:<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*)?<\/div>/i;
  if(!root.test(html))throw new Error('Missing root');html=html.replace(root,()=>`<div id="root">${body}</div>`);
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300, stale-while-revalidate=600');return res.status(200).type('html').send(html);
 }catch(error){console.error('Random Pick HTML:',error.message);res.setHeader('Cache-Control','no-store');return res.status(503).send('Please try again.');}
});
