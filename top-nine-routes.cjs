const COPY=require('./src/components/topNine/copy.json');
const {loadSeoTemplate}=require('./seo-template.cjs');
const {templatePageTitle}=require('./src/components/topNine/templateIntro.cjs');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderTopNineHtml(template,origin,lang,{templates=[],boards=[]}={}){
 if(!Object.prototype.hasOwnProperty.call(COPY,lang))return null;const copy=COPY[lang];const url=`${origin}/${lang}/mytop9`,title=`${copy.title} | One Pick Game`;
 const html=template.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi,'').replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi,'').replace(/<html\b[^>]*>/i,`<html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}">`);
 const alternates=Object.keys(COPY).map(l=>`<link data-rh="true" rel="alternate" hreflang="${l}" href="${origin}/${l}/mytop9">`).join('');
 const presets=templates.filter(row=>UUID.test(String(row.id))).slice(0,12);
 const publicBoards=boards.filter(row=>UUID.test(String(row.id))).slice(0,12);
 const body='<main style="max-width:1100px;margin:32px auto;padding:24px"><h1>'+escape(copy.title)+'</h1><p>'+escape(copy.subtitle)+'</p>'+
 (presets.length?'<section><h2>'+escape(copy.templates)+'</h2><ul>'+presets.map(row=>'<li><a href="'+escape(origin+'/'+lang+'/mytop9/templates/'+row.id)+'">'+escape(templatePageTitle(row,lang))+'</a></li>').join('')+'</ul></section>':'')+
 (publicBoards.length?'<section><h2>'+(lang==='ko'?'다른 사람들이 만든 구절판 취향표':'Community Top 9')+'</h2><ul>'+publicBoards.map(row=>'<li><a href="'+escape(origin+'/'+lang+'/mytop9/'+row.id)+'">'+escape(row.title)+'</a></li>').join('')+'</ul></section>':'')+'</main>';
 return html.replace('</head>',`<title data-rh="true">${escape(title)}</title><meta data-rh="true" name="description" content="${escape(copy.subtitle)}"><meta data-rh="true" name="robots" content="index,follow"><link data-rh="true" rel="canonical" href="${url}">${alternates}<link data-rh="true" rel="alternate" hreflang="x-default" href="${origin}/en/mytop9"><meta data-rh="true" property="og:title" content="${escape(title)}"><meta data-rh="true" property="og:description" content="${escape(copy.subtitle)}"><meta data-rh="true" property="og:url" content="${url}"></head>`).replace(/(<div\b[^>]*\bid=["']root["'][^>]*>)/i,root=>root+body);
}
async function loadHomeLinks(supabase){
 if(!supabase)return {templates:[],boards:[],partial:false};
 const request=query=>typeof query.abortSignal==='function'?query.abortSignal(AbortSignal.timeout(4000)):query;
 const results=await Promise.allSettled([
  Promise.resolve().then(()=>request(supabase.rpc('search_top_nine_sources',{p_query:'',p_offset:0,p_recommended:true}))),
  Promise.resolve().then(()=>request(supabase.from('top_nine_public_boards').select('id,title').order('created_at',{ascending:false}).order('id').limit(12)))
 ]);
 const rows=result=>result.status==='fulfilled'&&!result.value.error&&Array.isArray(result.value.data)?result.value.data:[];
 return {templates:rows(results[0]),boards:rows(results[1]),partial:results.some(result=>result.status==='rejected'||result.value?.error)};
}
module.exports=function(app,origin,supabase){app.use(async(req,res,next)=>{const path=String(req.query?.path||req.path||'').replace(/^\//,'');const match=path.match(/^([a-z]{2})\/(mytop9|top-nine)\/?$/);if(req.query?.seo!=='top-nine'&&!((!req.query?.seo||req.query?.seo==='spa')&&match))return next();const lang=String(req.query.lang||match?.[1]||'en');if(!Object.prototype.hasOwnProperty.call(COPY,lang))return res.status(404).send('Not found');if(match?.[2]==='top-nine'||req.query?.legacy==='1'){const query=new URLSearchParams();for(const [key,value]of Object.entries(req.query||{})){if(['seo','lang','path','legacy'].includes(key))continue;for(const item of Array.isArray(value)?value:[value])query.append(key,String(item));}const search=query.toString();return res.redirect(301,`/${lang}/mytop9${search?'?'+search:''}`);}if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(req.query.template||'')))return res.redirect(301,`/${lang}/mytop9/templates/${req.query.template}`);try{const [shell,links]=await Promise.all([loadSeoTemplate(origin),loadHomeLinks(supabase)]);res.setHeader('Cache-Control',links.partial?'no-store':'public,s-maxage=300,stale-while-revalidate=3600');res.type('html').send(renderTopNineHtml(shell,origin,lang,links));}catch{res.status(503).send('Please try again');}});};
module.exports.renderTopNineHtml=renderTopNineHtml;

module.exports.loadHomeLinks=loadHomeLinks;
