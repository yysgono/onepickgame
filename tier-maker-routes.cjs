const COPY=require('./src/seo/tierMakerSeoCopy.json');
const {loadSeoTemplate}=require('./seo-template.cjs');
const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function renderTierMakerHtml(shell,origin,lang,indexable=true){
 const copy=COPY[lang];if(!copy)return null;
 const canonical=origin+'/'+lang+'/tier-list/create';
 const html=shell.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'')
 .replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi,'')
 .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi,'')
 .replace(/<html\b[^>]*>/i,'<html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'">');
 const alternates=indexable?Object.keys(COPY).map(l=>'<link data-rh="true" rel="alternate" hreflang="'+l+'" href="'+escape(origin+'/'+l+'/tier-list/create')+'">').join(''):'';
 const head='<title data-rh="true">'+escape(copy.title)+'</title><meta data-rh="true" name="description" content="'+escape(copy.description)+'"><meta data-rh="true" name="robots" content="'+(indexable?'index,follow':'noindex,follow')+'"><link data-rh="true" rel="canonical" href="'+escape(canonical)+'">'+alternates+'<meta data-rh="true" property="og:title" content="'+escape(copy.title)+'"><meta data-rh="true" property="og:description" content="'+escape(copy.description)+'"><meta data-rh="true" property="og:url" content="'+escape(canonical)+'">';
 const body='<main style="max-width:1100px;margin:32px auto;padding:24px"><h1>'+escape(copy.title.split('|')[0].trim())+'</h1><p>'+escape(copy.description)+'</p><a href="'+escape(origin+'/'+lang+'/tier-list')+'">'+escape(copy.listLabel)+'</a></main>';
 const root=/<div\b[^>]*\bid=["']root["'][^>]*>/i;
 if(!root.test(html))throw Error('TIER_MAKER_ROOT_MISSING');
 return html.replace('</head>',()=>head+'</head>').replace(root,value=>value+body);
}
module.exports=function(app,origin){app.use(async(req,res,next)=>{
 const path=String(req.query?.path||req.path||'').replace(/^\//,'');
 const match=path.match(/^([a-z]{2})\/tier-list\/create\/?$/);
 if(req.query?.seo!=='tier-maker'&&!match)return next();
 const lang=String(req.query?.lang||match?.[1]||'en');
 if(!COPY[lang])return res.status(404).send('Not found');
 const indexable=!Object.hasOwn(req.query||{},'edit')&&!Object.hasOwn(req.query||{},'clone');
 try{
  const html=renderTierMakerHtml(await loadSeoTemplate(origin),origin,lang,indexable);
  res.setHeader('Cache-Control',indexable?'public,s-maxage=300,stale-while-revalidate=3600':'no-store');
  if(!indexable)res.setHeader('X-Robots-Tag','noindex,follow');
  return res.type('html').send(html);
 }catch{return res.status(503).send('Please try again');}
});};
module.exports.renderTierMakerHtml=renderTierMakerHtml;
