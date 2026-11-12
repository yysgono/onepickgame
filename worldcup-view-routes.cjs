const COPY=require('./src/seo/worldcupViewSeoCopy.json');
const {loadSeoTemplate}=require('./seo-template.cjs');
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function localize(value,lang,fallback){if(typeof value==='string'){try{value=JSON.parse(value);}catch{value=null;}}return value?.[lang]||value?.en||fallback||'';}
function renderWorldcupViewHtml(shell,origin,lang,kind,cup,round=''){
 const words=COPY[lang],name=localize(cup.title_translations,lang,cup.title);
 const heading=name+' · '+(kind==='match'?words.start:words[kind]);
 const description=localize(cup.description_translations,lang,cup.description)||name;
 const indexable=kind!=='match';
 const canonical=origin+'/'+lang+'/'+kind+'/'+cup.id+(kind==='match'?'/'+round:'');
 const candidates=(Array.isArray(cup.data)?cup.data:[]).map(c=>c?.name||c?.title).filter(v=>typeof v==='string'&&v.trim()).slice(0,24);
 const html=shell.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi,'').replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi,'').replace(/<html\b[^>]*>/i,'<html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'">');
 const head='<title data-rh="true">'+escape(heading)+' | OnePickGame</title><meta data-rh="true" name="description" content="'+escape(description)+'"><meta data-rh="true" name="robots" content="'+(indexable?'index,follow':'noindex,follow')+'"><link data-rh="true" rel="canonical" href="'+escape(canonical)+'"><meta data-rh="true" property="og:title" content="'+escape(heading)+'"><meta data-rh="true" property="og:description" content="'+escape(description)+'"><meta data-rh="true" property="og:url" content="'+escape(canonical)+'">';
 const body='<main style="max-width:1100px;margin:32px auto;padding:24px"><h1>'+escape(heading)+'</h1><p>'+escape(description)+'</p><nav><a href="'+escape(origin+'/'+lang+'/select-round/'+cup.id)+'">'+escape(words.start)+' · '+escape(name)+'</a> · <a href="'+escape(origin+'/'+lang+'/stats/'+cup.id)+'">'+escape(words.stats)+'</a></nav>'+(candidates.length?'<section><h2>'+escape(words.candidates)+'</h2><ul>'+candidates.map(name=>'<li>'+escape(name)+'</li>').join('')+'</ul></section>':'')+'</main>';
 const root=/<div\b[^>]*\bid=["']root["'][^>]*>/i;if(!root.test(html))throw Error('ROOT_MISSING');
 return html.replace('</head>',()=>head+'</head>').replace(root,value=>value+body);
}
module.exports=function(app,supabase,origin){app.use(async(req,res,next)=>{
 const path=String(req.query?.path||req.path||'').replace(/^\//,'');
 const match=path.match(/^([a-z]{2})\/(stats|result|match)\/([^/]+)(?:\/([0-9]+))?\/?$/);
 if(req.query?.seo!=='worldcup-view'&&!match)return next();
 const lang=String(req.query?.lang||match?.[1]||'en'),kind=String(req.query?.view||match?.[2]||''),id=String(req.query?.id||match?.[3]||''),round=String(req.query?.round||match?.[4]||'');
 if(!COPY[lang]||!['stats','result','match'].includes(kind)||!UUID.test(id)||kind==='match'&&!/^[0-9]+$/.test(round)||kind==='stats'&&round)return res.status(404).send('Not found');
 try{
  const {data,error}=await supabase.from('worldcups').select('id,title,title_translations,description,description_translations,data').eq('id',id).is('deleted_at',null).maybeSingle();
  if(error)throw error;if(!data)return res.status(404).send('Not found');
  const html=renderWorldcupViewHtml(await loadSeoTemplate(origin),origin,lang,kind,data,round);
  res.setHeader('Cache-Control',kind==='match'?'no-store':'public,s-maxage=300,stale-while-revalidate=3600');
  if(kind==='match')res.setHeader('X-Robots-Tag','noindex,follow');
  return res.type('html').send(html);
 }catch{return res.status(503).send('Please try again');}
});};
module.exports.renderWorldcupViewHtml=renderWorldcupViewHtml;
