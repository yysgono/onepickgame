export function authoredTitle(title,nickname) {
 const author=Array.from(String(nickname||'').trim()||'OnePick').slice(0,30).join('');
 const base=String(title||'').trim()||'My Top 9';
 return Array.from(author+' - '+base).slice(0,100).join('');
}
export function titleSuffix() {
  if(globalThis.crypto?.getRandomValues){const bytes=new Uint8Array(5);globalThis.crypto.getRandomValues(bytes);return [...bytes].map(value=>value.toString(16).padStart(2,'0')).join('').toUpperCase();}
  return Math.random().toString(16).slice(2,12).padEnd(10,'0').toUpperCase();
}
export function decoratedTitle(title,suffix=titleSuffix()) {
  const ending=' · '+suffix,base=String(title||'').trim()||'My Top 9';
  return Array.from(base).slice(0,100-Array.from(ending).length).join('')+ending;
}
export function isDuplicateTitle(error) {
  if(!error)return false;
  const info=[error.message,error.details,error.hint,error.constraint].filter(Boolean).join(' ');
  return /(title|제목).*(duplicate|unique|already|exists|taken|중복)|(duplicate|unique|중복).*(title|제목)/i.test(info);
}
export async function publishWithTitleRetry(supabase,args,autoTitle=false) {
  const base=String(args.p_title||'').trim()||'My Top 9';let title=autoTitle?decoratedTitle(base):base;
  for(let attempt=0;attempt<3;attempt++){
    const result=await supabase.rpc('publish_top_nine_board_v2',{...args,p_title:title});
    if(!result.error)return {...result,title};
    if(!isDuplicateTitle(result.error)||attempt===2)throw result.error;
    title=decoratedTitle(base);
  }
}
