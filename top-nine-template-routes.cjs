const {loadSeoTemplate}=require('./seo-template.cjs');
const {templatePageTitle,templatePageIntro,introCandidates}=require('./src/components/topNine/templateIntro.cjs');
const COPY=require('./src/components/topNine/copy.json');
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cleanTemplateShell(shell,lang){
 return shell.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi,'').replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi,'').replace(/<html\b[^>]*>/i,'<html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'">');
}
function renderTemplateHtml(shell,origin,lang,cup,kind='nine'){
 const route=kind==='tier'?'tier-list/create':'mytop9/templates';
 const title=templatePageTitle(cup,lang,kind),description=templatePageIntro(cup,lang,kind),url=origin+'/'+lang+'/'+route+'/'+cup.id;
 const clean=cleanTemplateShell(shell,lang);
 const alternates=Object.keys(COPY).map(l=>'<link data-rh="true" rel="alternate" hreflang="'+l+'" href="'+escape(origin+'/'+l+'/'+route+'/'+cup.id)+'">').join('');
 const head='<title data-rh="true">'+escape(title+' | One Pick Game')+'</title><meta data-rh="true" name="description" content="'+escape(description)+'"><meta data-rh="true" name="robots" content="index,follow"><link data-rh="true" rel="canonical" href="'+escape(url)+'">'+alternates+'<meta data-rh="true" property="og:title" content="'+escape(title)+'"><meta data-rh="true" property="og:description" content="'+escape(description)+'"><meta data-rh="true" property="og:url" content="'+escape(url)+'">';
 const body='<article><h1>'+escape(title)+'</h1><p>'+escape(description)+'</p><ul>'+introCandidates(cup).map(c=>'<li>'+escape(c.name)+'</li>').join('')+'</ul><a href="'+origin+'/'+lang+(kind==='tier'?'/tier-list':'/mytop9')+'">'+escape(kind==='tier'?title:COPY[lang].title)+'</a></article>';
 return clean.replace('</head>',()=>head+'</head>').replace(/<div\b[^>]*\bid=["']root["'][^>]*>/i,root=>root+body);
}
module.exports=function(app,supabase,origin){app.use(async(req,res,next)=>{
 const path=String(req.query?.path||req.path||'');
 const match=path.match(/^\/?([a-z]{2})\/(mytop9\/templates|tier-list\/create)\/([^/]+)\/?$/);
 const isTier=req.query?.seo==='tier-preset'||match?.[2]==='tier-list/create';
 if(!['top-nine-template','tier-preset'].includes(req.query?.seo)&&!match)return next();
 const lang=String(req.query.lang||match?.[1]||'en'),id=String(req.query.id||match?.[3]||'');
 res.setHeader('Cache-Control','no-store');
 if(!COPY[lang]||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return res.status(404).send('Not found');
 try{
  const [cup,settings,intro]=await Promise.all([
   supabase.from('worldcups').select(isTier?'id,title,title_translations,data,is_tier_preset,tier_preset_title_translations':'id,title,title_translations,data').eq('id',id).is('deleted_at',null).maybeSingle(),
   isTier?Promise.resolve({data:null}):supabase.from('top_nine_templates').select('title_translations,enabled').eq('source_worldcup_id',id).maybeSingle(),
   supabase.from(isTier?'tier_template_intros':'top_nine_template_intros').select('candidate_sources').eq('source_worldcup_id',id).maybeSingle()
  ]);
  if(cup.error||settings.error||(!isTier&&intro.error))throw Error('LOAD_FAILED');
  if(!cup.data)return res.status(404).send('Not found');
  if(isTier&&(!cup.data.is_tier_preset||req.query?.edit||req.query?.clone)){
   const shell=cleanTemplateShell(await loadSeoTemplate(origin),lang);
   return res.type('html').send(shell.replace('</head>','<meta data-rh="true" name="robots" content="noindex,follow"></head>'));
  }
  if(!isTier&&(!Array.isArray(cup.data.data)||!cup.data.data.some(c=>c?.image||c?.image_url||c?.url)))return res.status(404).send('Not found');
  const source={...cup.data,top_nine_title_translations:settings.data?.title_translations||{},intro_sources:intro.data?.candidate_sources||[]};
  return res.type('html').send(renderTemplateHtml(await loadSeoTemplate(origin),origin,lang,source,isTier?'tier':'nine'));
 }catch{return res.status(503).send('Please try again');}
 });};
module.exports.renderTemplateHtml=renderTemplateHtml;
