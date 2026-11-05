export function authoredTitle(title,nickname) {
 const author=Array.from(String(nickname||'').trim()||'OnePick').slice(0,30).join('');
 let base=String(title||'').trim().replace(/ · [A-F0-9]{10}$/,'')||'My Top 9';
 if(base.startsWith(author+' - '))base=base.slice(author.length+3);
 if(base.endsWith(' - '+author))base=base.slice(0,-author.length-3);
 const available=97-Array.from(author).length;
 return Array.from(base).slice(0,available).join('')+' - '+author;
}
export function isDuplicateTitle(error) {
  if(!error)return false;
  const info=[error.message,error.details,error.hint,error.constraint].filter(Boolean).join(' ');
  return /(title|제목).*(duplicate|unique|already|exists|taken|중복)|(duplicate|unique|중복).*(title|제목)/i.test(info);
}
export async function publishWithTitleRetry(supabase,args) {
  const base=String(args.p_title||'').trim()||'My Top 9';let title=base;
  for(let attempt=0;attempt<3;attempt++){
    const result=await supabase.rpc(args.p_board_id?'update_top_nine_board_v1':Object.hasOwn(args,'p_source_worldcup_ids')?'publish_top_nine_board_v3':'publish_top_nine_board_v2',{...args,p_title:title});
    if(!result.error)return {...result,title};
    if(!isDuplicateTitle(result.error)||attempt===2)throw result.error;
    const ending=' ('+(attempt+2)+')';
    title=Array.from(base).slice(0,100-ending.length).join('')+ending;
  }
}
