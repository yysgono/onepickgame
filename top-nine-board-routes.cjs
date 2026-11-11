const {boardDescription}=require('./src/components/topNine/boardDescription.cjs');
const {localizedBoardTitle,loadBoardTitleSources}=require('./src/components/topNine/localizedTitle.cjs');
const COPY=require('./src/components/topNine/copy.json');
const {loadSeoTemplate}=require('./seo-template.cjs');
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function publicImage(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!/\/render\/image\/|\/sign\//i.test(url.pathname)&&![...url.searchParams.keys()].some(key=>/token|signature|credential|expires|key|auth/i.test(key))?url.href:'';}catch{return '';}
}
function renderBoardHtml(template,origin,lang,board){
 const title=board.title+' | One Pick Game',description=boardDescription(board,lang),url=origin+'/'+lang+'/mytop9/'+board.id;
 const slots=(Array.isArray(board.slots)?board.slots:[]).filter(candidate=>candidate&&candidate.id!=='tn-empty-cell');
 const image=slots.map(candidate=>publicImage(candidate.src)).find(Boolean);
 const html=template.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi,'').replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi,'').replace(/<html\b[^>]*>/i,'<html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'">');
 const alternates=Object.keys(COPY).map(language=>'<link data-rh="true" rel="alternate" hreflang="'+language+'" href="'+escape(origin+'/'+language+'/mytop9/'+board.id)+'">').join('');
 const head='<title data-rh="true">'+escape(title)+'</title><meta data-rh="true" name="description" content="'+escape(description)+'"><meta data-rh="true" name="robots" content="'+(board.unlisted?'noindex,follow':'index,follow')+'"><link data-rh="true" rel="canonical" href="'+escape(url)+'">'+alternates+'<meta data-rh="true" property="og:title" content="'+escape(title)+'"><meta data-rh="true" property="og:description" content="'+escape(description)+'"><meta data-rh="true" property="og:url" content="'+escape(url)+'"><meta data-rh="true" property="og:type" content="article">'+(image?'<meta data-rh="true" property="og:image" content="'+escape(image)+'">':'');
 const content='<article><h1>'+escape(board.title)+'</h1><p>'+escape(description).replace(/\n/g,'<br>')+'</p><ul>'+slots.map(candidate=>'<li>'+escape(candidate.name)+'</li>').join('')+'</ul><a href="'+origin+'/'+lang+'/mytop9">'+escape(COPY[lang].title)+'</a></article>';
 return html.replace('</head>',head+'</head>').replace(/(<div\b[^>]*\bid=["']root["'][^>]*>)/i,'$1'+content);
}
module.exports=function(app,supabase,origin){
 app.use(async(req,res,next)=>{
  const path=String(req.query?.path||req.path||'').replace(/^\//,''),match=path.match(/^([a-z]{2})\/mytop9\/([^/]+)\/?$/);
  if(req.query?.seo!=='top-nine-board'&&!((!req.query?.seo||req.query?.seo==='spa')&&match))return next();
  const lang=String(req.query.lang||match?.[1]||'en'),id=String(req.query.id||match?.[2]||'');
  res.setHeader('Cache-Control','no-store');
  if(!Object.hasOwn(COPY,lang)||!uuid.test(id))return res.status(404).send('Not found');
  try{
   const {data:publicData,error}=await supabase.from('top_nine_public_boards').select('id,title,slots,show_names,source_worldcup_ids,guest_nickname').eq('id',id).maybeSingle();
   if(error)throw error;
   let data=publicData;
   if(!data){
    const link=await supabase.rpc('get_top_nine_link',{p_id:id});if(link.error)throw link.error;
    if(link.data)data={id,title:link.data.title,slots:link.data.slots,show_names:link.data.names,unlisted:true};
   }
   if(!data)return res.status(404).send('Not found');
   if(data.unlisted)res.setHeader('X-Robots-Tag','noindex,follow');
   data.titleSources=data.unlisted?[]:await loadBoardTitleSources(supabase,[data]);
   data.title=localizedBoardTitle(data,data.titleSources,lang);
   return res.type('html').send(renderBoardHtml(await loadSeoTemplate(origin),origin,lang,data));
  }catch{return res.status(503).send('Please try again');}
 });
};
module.exports.renderBoardHtml=renderBoardHtml;
