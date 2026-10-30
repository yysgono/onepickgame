const sanitizeRichHtml=require('./rich-text-server.cjs');
const {loadSeoTemplate}=require('./seo-template.cjs');
const {insertRoot}=require('./home-seo-support.cjs');
const labels=require('./src/components/headerCommunityCopy.json');
const copy=require('./src/components/communityUiCopy.json');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(html,{lang,title,description,canonical,indexable,body}){
 html=html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi,'').replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi,'').replace(/<html\b[^>]*>/i,`<html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}">`);
 const robots=indexable?'index, follow, max-image-preview:large':'noindex, follow';
 const head=`<title data-rh="true">${escape(title)}</title><meta data-rh="true" name="description" content="${escape(description)}"><meta data-rh="true" name="robots" content="${robots}"><link data-rh="true" rel="canonical" href="${escape(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}">`;
 return insertRoot(html.replace('</head>',head+'</head>'),body);
}
function privateInfo(req){
 const type=String(req.query?.seo||''),path='/'+String(req.query?.path||'').replace(/^\/+/,''),parts=path.split('/').filter(Boolean);
 if(type==='private-page')return {lang:req.query.lang,page:req.query.page||'my-worldcups'};
 if(['quiz-list','tier-list-list'].includes(type)&&String(req.query.mine)==='1')return {lang:req.query.lang,page:type==='quiz-list'?'quiz?mine=1':'tier-list?mine=1'};
 if(type==='spa'&&['my-worldcups','suggestions','suggestions-board','admin-suggestions'].includes(parts[1]))return {lang:parts[0],page:parts[1]};
 return null;
}
module.exports=(app,client,origin)=>{
 const cache=new Map(),pending=new Map();
 async function boardRows(lang,board){const key=`${board}:${lang}`,now=Date.now();if(cache.get(key)?.until>now)return cache.get(key).rows;if(pending.has(key))return pending.get(key);const p=(async()=>{let q=client.from('community_posts').select('id,title,body,body_html,author_nickname,language,created_at,is_pinned').eq('board',board);if(board==='notices')q=q.eq('language',lang);else q=q.or(`language_only.eq.false,language.eq.${lang}`);const {data,error}=await q.order('is_pinned',{ascending:false}).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(12);if(error)throw error;const rows=data||[];cache.set(key,{until:Date.now()+30000,rows});return rows;})().finally(()=>pending.delete(key));pending.set(key,p);return p;}
 app.use(async(req,res,next)=>{
  const info=privateInfo(req),publicPage=req.query?.seo==='community-list';if(!info&&!publicPage)return next();
  const lang=Object.hasOwn(labels,info?.lang||req.query.lang)?(info?.lang||req.query.lang):'en',ui=copy[lang]||copy.en;
  try{
   if(info){const title=/suggestions/.test(info.page)?labels[lang][4]:/blog/.test(info.page)?ui.article:ui.myContent;res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, follow');return res.send(render(await loadSeoTemplate(origin),{lang,title:`${title} | OnePickGame`,description:title,canonical:`${origin}/${lang}/${info.page}`,indexable:false,body:`<main class="site-publishing"><h1>${escape(title)}</h1><p role="status">${escape(ui.loading)}</p></main>`}));}
   const board=req.query.board;if(!['notices','community'].includes(board))return next();const rows=await boardRows(lang,board),name=labels[lang][board==='notices'?0:1],canonical=`${origin}/${lang}/${board}`;
   const articles=rows.map(p=>`<article class="community-post"><details><summary><strong>${p.is_pinned?escape(ui.pinned)+' · ':''}${escape(p.title)}</strong> · ${escape(p.author_nickname||'Member')}</summary>${p.body_html?`<div>${sanitizeRichHtml(p.body_html)}</div>`:`<p style="white-space:pre-wrap">${escape(p.body)}</p>`}</details><time datetime="${escape(p.created_at)}">${escape(String(p.created_at).slice(0,10))}</time></article>`).join('');
   res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=60');
   res.setHeader('X-Robots-Tag','index, follow');return res.send(render(await loadSeoTemplate(origin),{lang,title:`${name} | OnePickGame`,description:`${name} · OnePickGame`,canonical,indexable:true,body:`<main class="site-publishing"><a href="${lang==='en'?'/':`/${lang}`}">One Pick Game</a><h1>${escape(name)}</h1>${articles||`<p>${escape(ui.noPosts)}</p>`}</main>`}));
  }catch(e){console.error('Community HTML unavailable:',e.message);res.setHeader('Cache-Control','no-store');return res.status(503).send('Temporarily unavailable');}
 });
};
module.exports.render=render;module.exports.privateInfo=privateInfo;
