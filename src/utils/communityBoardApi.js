const FIELDS='id,post_number,title,author_id,author_nickname,category,language,language_only,created_at,updated_at,is_pinned';
export const BOARD_PAGE_SIZE=12;
function visible(query,board,lang,currentLanguageOnly){
 query=query.eq('board',board);
 if(board==='notices')return query.eq('language',lang);
 query=query.or(`language_only.eq.false,language.eq.${lang}`);
 return currentLanguageOnly?query.eq('language',lang):query;
}
export async function loadBoardPage(client,{board,lang,category='all',currentLanguageOnly=false,page=1}){
 const offset=(Math.max(1,page)-1)*BOARD_PAGE_SIZE;
 let normal=visible(client.from('community_posts').select(FIELDS,{count:'exact'}),board,lang,currentLanguageOnly).eq('is_pinned',false);
 if(board==='community'&&category!=='all')normal=normal.eq('category',category);
 // Pinned posts deliberately ignore the category filter, but keep language visibility.
 const pinned=visible(client.from('community_posts').select(FIELDS),board,lang,currentLanguageOnly).eq('is_pinned',true);
 const [pinResult,result]=await Promise.all([pinned.order('created_at',{ascending:false}).order('id',{ascending:false}),normal.order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+BOARD_PAGE_SIZE-1)]);
 if(pinResult.error)throw pinResult.error;if(result.error)throw result.error;
 return {pinned:pinResult.data||[],items:result.data||[],total:result.count||0};
}
export async function loadBoardBody(client,id){
 const {data,error}=await client.from('community_posts').select('body,body_html').eq('id',id).single();
 if(error)throw error;return {text:data?.body||'',html:data?.body_html||null};
}
export function boardDate(value,lang,now=new Date()){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 if(date.toDateString()!==now.toDateString())return date.toLocaleDateString(lang);
 const elapsed=Math.max(0,Math.floor((now-date)/60000));
 const relative=new Intl.RelativeTimeFormat(lang,{numeric:'auto'});
 return elapsed<1?relative.format(0,'second'):elapsed<60?relative.format(-elapsed,'minute'):relative.format(-Math.floor(elapsed/60),'hour');
}
export function boardPageNumbers(page,total){return Array.from(new Set([1,...Array.from({length:5},(_,i)=>page+i-2).filter(n=>n>=1&&n<=total),total])).sort((a,b)=>a-b);}
