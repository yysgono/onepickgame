const cardPreview=require('../utils/worldcupCardPreview.js');
const {localizedBoardTitle}=require('../components/topNine/localizedBoardTitleCore.js');
// Shared public, read-only card metadata for the first HTML and React UI.
const COPY=require('./templateDiscoveryCopy.json');
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const map=v=>{if(typeof v==='string'){try{return JSON.parse(v)||{};}catch{return {};}}return v||{};};
const media=v=>typeof v==='string'&&/^https?:\/\//i.test(v)?v:'';
const image=c=>media(c?.image||c?.image_url||c?.url);
function title(row,kind,lang){const own=map(kind==='tier'?row.tier_preset_title_translations:row.top_nine_title_translations),base=map(row.title_translations);return String(own[lang]||own.en||base[lang]||row.title||base.en||'').trim();}
function homeLinks(rows,kind,lang){return (rows||[]).filter(r=>UUID.test(String(r.id))).slice(0,48).map(r=>({href:`/${lang}/${kind==='tier'?'tier-list/create':'mytop9/templates'}/${r.id}`,label:title(r,kind,lang),image:media(r.tier_preset_thumbnail_url||r.thumbnail)})).filter(r=>r.label);}
async function load(client,cup,kind,lang){
 const c=COPY[lang]||COPY.en,id=String(cup?.id||'');if(!UUID.test(id))return null;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
 const read=async query=>{try{if(query.abortSignal)query=query.abortSignal(controller.signal);const {data,error}=await query;return !error&&Array.isArray(data)?data:[];}catch{return [];}};
 const worksFields=kind==='tier'?'id,title,title_translations,thumbnail_url,view_count':'id,title,slots,view_count,source_worldcup_ids';
 const worksBase=()=>{let q=client.from(kind==='tier'?'tier_lists':'top_nine_public_boards').select(worksFields);return kind==='tier'?q.is('deleted_at',null):q;};
 const popular=q=>q.order('view_count',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}).limit(12);
 try{
  const templatesQuery=kind==='tier'?client.from('worldcup_tier_preset_cards').select('id,title,title_translations,tier_preset_title_translations,tier_preset_thumbnail_url,category').neq('id',id).order('tier_preset_order',{ascending:true,nullsFirst:false}).order('id').limit(30):client.rpc('search_top_nine_sources',{p_query:'',p_offset:0,p_recommended:true});
  let [works,templates,winnerRows]=await Promise.all([read(popular(kind==='tier'?worksBase().eq('source_worldcup_id',id):worksBase().contains('source_worldcup_ids',[id]))),read(templatesQuery),read(client.from('winner_stats').select('candidate_id,win_count,match_wins').eq('cup_id',id))]);
  if(kind==='nine'&&!works.length&&!controller.signal.aborted)works=await read(popular(worksBase().contains('source_worldcup_ids',JSON.stringify([id]))));
  const related=templates.filter(r=>String(r.id)!==id&&UUID.test(String(r.id))).sort((a,b)=>Number(b.category===cup.category)-Number(a.category===cup.category)).slice(0,12);
  const ids=[id,...related.map(r=>r.id)];
  const [previews,thumbs,topicWorks]=await Promise.all([
   read(client.from('worldcups').select('id,title,title_translations,preview:data->0,second:data->1').is('deleted_at',null).in('id',ids)),
   related.length?read(client.from(kind==='tier'?'tier_preset_thumbnails':'top_nine_thumbnails').select('source_worldcup_id,image_url').in('source_worldcup_id',related.map(r=>r.id))):Promise.resolve([]),
   works.length<12&&cup.category?read(popular(worksBase().eq('category',kind==='tier'?({anime_manga:'animation',person:'entertainment',korea:'entertainment',music:'entertainment',etc:'other'}[cup.category]||cup.category):cup.category))):Promise.resolve([])
  ]);
  const byId=new Map(previews.map(r=>[String(r.id),r])),custom=new Map(thumbs.map(r=>[String(r.source_worldcup_id),media(r.image_url)]));
  works=[...new Map([...works,...topicWorks].filter(r=>UUID.test(String(r.id))).map(r=>[String(r.id),r])).values()].slice(0,12);
  const titleSources=new Map();
  if(kind==='nine'){
   previews.concat(related,[cup]).forEach(row=>titleSources.set(String(row.id),Object.assign({},titleSources.get(String(row.id)),row)));
   const sourceIds=Array.from(new Set(works.flatMap(row=>Array.isArray(row.source_worldcup_ids)?row.source_worldcup_ids:[]))).filter(value=>UUID.test(String(value)));
   const missing=sourceIds.filter(value=>!Object.keys(map(titleSources.get(String(value))?.top_nine_title_translations)).length);
   if(missing.length&&!controller.signal.aborted){
    const [sources,settings]=await Promise.all([
     read(client.from('worldcups').select('id,title,title_translations').is('deleted_at',null).in('id',missing)),
     read(client.from('top_nine_templates').select('source_worldcup_id,title_translations').in('source_worldcup_id',missing))
    ]);
    sources.forEach(row=>titleSources.set(String(row.id),Object.assign({},titleSources.get(String(row.id)),row)));
    settings.forEach(row=>{const source=titleSources.get(String(row.source_worldcup_id));if(source)source.top_nine_title_translations=row.title_translations;});
   }
  }
  const source=byId.get(id)||cup;
  const sourceCandidates=Array.isArray(cup.data)&&cup.data.length?cup.data:[source.preview,source.second].filter(Boolean);
  const sourceImages=cardPreview.getTop2Winners(cardPreview.aggregatePreviewStats(winnerRows),sourceCandidates).map(image).filter(Boolean);
  return {
   source:{href:`/${lang}/select-round/${id}`,label:String(map(source.title_translations)[lang]||source.title||c.source),action:c.source,images:sourceImages},
   works:works.map(r=>({href:`/${lang}/${kind==='tier'?'tier-list':'mytop9'}/${r.id}`,label:kind==='nine'?localizedBoardTitle(r,Array.from(titleSources.values()),lang):String(map(r.title_translations)[lang]||r.title||''),image:media(r.thumbnail_url),views:Number(r.view_count)||0,slots:kind==='nine'?(Array.isArray(r.slots)?r.slots:[]).slice(0,9).map(s=>s?.id==='tn-empty-cell'||!media(s?.src)?null:{src:media(s.src),zoom:s.zoom,x:s.x,y:s.y}):undefined})),
   templates:homeLinks(related.map(r=>Object.assign({},r,{thumbnail:custom.get(String(r.id))||r.thumbnail||image(byId.get(String(r.id))?.preview),tier_preset_thumbnail_url:custom.get(String(r.id))||r.tier_preset_thumbnail_url})),kind,lang)
  };
 }finally{clearTimeout(timer);}
}
function render(groups,kind,lang,origin=''){
 if(!groups)return '';const c=COPY[lang]||COPY.en;
 const e=v=>String(v||'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const img=src=>media(src)?'<img src="'+e(src)+'" alt="" loading="lazy" width="240" height="180">':'';
 const card=(r,source=false)=>'<a class="td-card'+(source?' td-source-card':'')+'" href="'+e(origin+r.href)+'"><div class="td-card-media'+(r.slots?.some(Boolean)?' td-card-media--collage':'')+'">'+(source&&r.images?.length?'<div class="td-source-images">'+r.images.map(img).join('')+'</div>':r.slots?.some(Boolean)?'<div class="td-collage-ssr">'+r.slots.map(s=>'<div>'+img(s?.src)+'</div>').join('')+'</div>':img(r.image)||'<span aria-hidden="true">'+(source?'🏆':kind==='tier'?'📊':'▦')+'</span>')+'</div><div class="td-card-caption"><strong>'+e(r.label)+'</strong>'+'</div></a>';
 const list=(heading,rows)=>rows?.length?'<div class="td-group"><h2>'+e(heading)+'</h2><div class="td-rail-frame"><ul class="td-card-rail">'+rows.slice(0,5).map(r=>'<li>'+card(r)+'</li>').join('')+'</ul></div></div>':'';
 return '<section class="template-discovery" aria-label="'+e(c.title)+'">'+(groups.source?'<div class="td-group td-source-group"><h2>'+e(c.source)+'</h2>'+card(groups.source,true)+'</div>':'')+list(c[kind+'Works'],groups.works)+list(c.related,groups.templates)+'</section>';
}
module.exports={load,render,title,homeLinks,COPY};
