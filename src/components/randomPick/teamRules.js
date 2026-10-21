import {shuffle} from '../../utils/randomPickCore';
// Balanced teams with hard same-team / separate-team constraints. No partial results.
export function constrainedTeams(rows,count,rules,next){
 const n=rows.length,k=Math.max(2,Math.min(n,20,Math.trunc(Number(count))||2));
 const parent=new Map(rows.map(r=>[r.id,r.id]));
 const find=id=>{while(parent.get(id)!==id){parent.set(id,parent.get(parent.get(id)));id=parent.get(id);}return id;};
 const valid=rules.filter(r=>parent.has(r.a)&&parent.has(r.b));
 valid.filter(r=>r.type==='together').forEach(r=>parent.set(find(r.a),find(r.b)));
 const blocks=new Map();rows.forEach(r=>{const id=find(r.id);if(!blocks.has(id))blocks.set(id,{id,rows:[],apart:new Set()});blocks.get(id).rows.push(r);});
 for(const r of valid.filter(r=>r.type==='apart')){const a=find(r.a),b=find(r.b);if(a===b)throw new Error('TEAM_CONFLICT');blocks.get(a).apart.add(b);blocks.get(b).apart.add(a);}
 const caps=Array.from({length:k},(_,i)=>Math.floor(n/k)+(i<n%k?1:0));
 const units=shuffle([...blocks.values()],next).sort((a,b)=>b.rows.length-a.rows.length||b.apart.size-a.apart.size);
 if(units.some(g=>g.rows.length>Math.ceil(n/k)))throw new Error('TEAM_CONFLICT');
 const groups=Array.from({length:k},()=>[]),assigned=new Map();let visits=0;
 function place(i){if(++visits>100000)throw new Error('TEAM_LIMIT');if(i===units.length)return true;
  const unit=units[i],empty=new Set();
  for(const team of shuffle(Array.from({length:k},(_,j)=>j),next)){
   if(groups[team].length+unit.rows.length>caps[team]||[...unit.apart].some(id=>assigned.get(id)===team))continue;
   if(!groups[team].length){if(empty.has(caps[team]))continue;empty.add(caps[team]);}
   groups[team].push(...unit.rows);assigned.set(unit.id,team);
   if(place(i+1))return true;
   groups[team].splice(groups[team].length-unit.rows.length);assigned.delete(unit.id);
  }return false;
 }
 if(!place(0))throw new Error('TEAM_CONFLICT');
 return groups.map(group=>shuffle(group,next));
}
