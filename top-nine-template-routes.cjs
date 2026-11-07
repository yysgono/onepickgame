const {loadSeoTemplate}=require('./seo-template.cjs');
const {templatePageTitle,templatePageIntro,introCandidates}=require('./src/components/topNine/templateIntro.cjs');
const COPY=require('./src/components/topNine/copy.json');
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderTemplateHtml(shell,origin,lang,cup){
 const title=templatePageTitle(cup,lang),description=templatePageIntro(cup,lang),url=origin+'/'+lang+'/mytop9/templates/'+cup.id;
 const clean=shell.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi,'').replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi,'').replace(/<html\b[^>]*>/i,'<html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'">');
 const alternates=Object.keys(COPY).map(l=>'<link data-rh="true" rel="alternate" hreflang="'+l+'" href="'+escape(origin+'/'+l+'/mytop9/templates/'+cup.id)+'">').join('');
 const head='<title data-rh="true">'+escape(title+' | One Pick Game')+'</title><meta data-rh="true" name="description" content="'+escape(description)+'"><meta data-rh="true" name="robots" content="index,follow"><link data-rh="true" rel="canonical" href="'+escape(url)+'">'+alternates+'<meta data-rh="true" property="og:title" content="'+escape(title)+'"><meta data-rh="true" property="og:description" content="'+escape(description)+'"><meta data-rh="true" property="og:url" content="'+escape(url)+'">';
 const body='<article><h1>'+escape(title)+'</h1><p>'+escape(description)+'</p><ul>'+introCandidates(cup).map(c=>'<li>'+escape(c.name)+'</li>').join('')+'</ul><a href="'+origin+'/'+lang+'/mytop9">'+escape(COPY[lang].title)+'</a></article>';
 return clean.replace('</head>',head+'</head>').replace(/(<div\b[^>]*\bid=["']root["'][^>]*>)/i,'$1'+body);
}
module.exports=function(app,supabase,origin){app.use(async(req,res,next)=>{
 const match=String(req.query?.path||req.path||'').match(/^\/?([a-z]{2})\/mytop9\/templates\/([^/]+)\/?$/);
 if(req.query?.seo!=='top-nine-template'&&!match)return next();
 const lang=String(req.query.lang||match?.[1]||'en'),id=String(req.query.id||match?.[2]||'');
 res.setHeader('Cache-Control','no-store');
 if(!COPY[lang]||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return res.status(404).send('Not found');
 try{
  const [cup,settings,intro]=await Promise.all([
   supabase.from('worldcups').select('id,title,title_translations,data').eq('id',id).is('deleted_at',null).maybeSingle(),
   supabase.from('top_nine_templates').select('title_translations,enabled').eq('source_worldcup_id',id).maybeSingle(),
   supabase.from('top_nine_template_intros').select('candidate_sources').eq('source_worldcup_id',id).maybeSingle()
  ]);
  if(cup.error||settings.error||intro.error)throw Error('LOAD_FAILED');
  if(!cup.data||!Array.isArray(cup.data.data)||!cup.data.data.some(c=>c?.image||c?.image_url||c?.url))return res.status(404).send('Not found');
  const source={...cup.data,top_nine_title_translations:settings.data?.title_translations||{},intro_sources:intro.data?.candidate_sources||[]};
  return res.type('html').send(renderTemplateHtml(await loadSeoTemplate(origin),origin,lang,source));
 }catch{return res.status(503).send('Please try again');}
 });};
module.exports.renderTemplateHtml=renderTemplateHtml;
