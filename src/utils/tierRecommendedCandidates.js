export function worldcupTitle(cup,lang){
 let titles=cup?.title_translations;
 if(typeof titles==='string'){try{titles=JSON.parse(titles);}catch{titles={};}}
 return String(titles?.[lang]||titles?.en||cup?.title||'').trim();
}
export function recommendedCandidates(cup,lang){
 return (Array.isArray(cup?.data)?cup.data:[]).flatMap((candidate,index)=>{
  const image=candidate?.image||candidate?.image_url||candidate?.url;
  if(typeof image!=='string'||!/^https?:\/\//i.test(image))return [];
  let names=candidate.name_translations;
  if(typeof names==='string'){try{names=JSON.parse(names);}catch{names={};}}
  const key=`recommended-${cup.id}-${candidate.id??index}`;
  return [{...candidate,id:key,name:String(names?.[lang]||names?.en||candidate.name||candidate.title||''),image,_source:'imported',_tierKey:key,_sourceWorldcupId:cup.id}];
 });
}
export function additionsFromWorldcup(existing,incoming,max=1024){
 const seen=new Set(existing.map(item=>item.image).filter(Boolean));
 const keys=new Set(existing.map(item=>item._tierKey));
 const added=[];
 for(const item of incoming){
  if(existing.length+added.length>=max)break;
  if(seen.has(item.image)||keys.has(item._tierKey))continue;
  seen.add(item.image);keys.add(item._tierKey);added.push(item);
 }
 return added;
}
