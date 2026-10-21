// One short-lived, bounded snapshot per tab. Never writes to browser storage.
export function createImportCache({ttl=30*60*1000,maxBytes=200000,now=()=>Date.now()}={}) {
 let entry=null;
 const clone=result=>({...result,rows:result.rows.map(row=>({...row}))});
 return {
  get(id){
   if(entry&&now()-entry.savedAt>=ttl)entry=null;
   return entry?.id===id?clone(entry.result):null;
  },
  set(id,result){
   // Replace even when an unusually large response cannot be cached.
   entry=null;
   if(JSON.stringify(result).length*2>maxBytes)return;
   entry={id,savedAt:now(),result:clone(result)};
  },
  clear(){entry=null;}
 };
}
export const importedCupCache=createImportCache();
