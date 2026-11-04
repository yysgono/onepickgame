export function uniqueCandidates(pool) {
  const seen=new Set();return pool.filter(candidate=>candidate&&candidate.id!=null&&!seen.has(String(candidate.id))&&seen.add(String(candidate.id)));
}
export function sampleCandidates(pool,count='all',random=Math.random) {
  const shuffled=[...uniqueCandidates(pool)];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  const size=count==='all'?shuffled.length:Math.max(9,Number(count)||54);
  return shuffled.slice(0,size);
}
export function candidateCountOptions(total=2048) {
  const size=Math.max(0,Math.min(2048,Number(total)||0));
  return [...[9,18,27,36,45,54].filter(n=>n<=size),...Array.from({length:79},(_,i)=>75+i*25).filter(n=>n<=size)];
}
export function roundState(pool,participants=pool,locked=[],round=1) {
  const clean=uniqueCandidates(pool),size=clean.length<=54?9:25;
  const end=clean.length<=size?clean.length:Math.floor(clean.length/size)*size;
  return {status:'scan',pool:clean,participants,locked:uniqueCandidates(locked),round,size,end,byes:clean.slice(end),offset:0,winners:[],marked:[]};
}
export function createGame(pool,count='54',random=Math.random) {
  const participants=sampleCandidates(pool,count,random);
  return roundState(participants,participants);
}
export function currentBatch(game) {return game.pool.slice(game.offset,Math.min(game.offset+game.size,game.end));}
export function selectedCandidates(game) {
  if(game.status!=='scan')return game.chosen;
  const marked=new Set(game.marked.map(String));
  return uniqueCandidates([...game.locked,...game.winners,...currentBatch(game).filter(c=>marked.has(String(c.id)))]);
}
export function toggleGameCandidate(game,id) {
  if(game.status!=='scan'||!currentBatch(game).some(c=>String(c.id)===String(id)))return game;
  const key=String(id),marked=game.marked.map(String);
  return {...game,marked:marked.includes(key)?marked.filter(value=>value!==key):[...marked,key]};
}
export function advanceGame(game) {
  if(game.status!=='scan')return game;
  const chosen=selectedCandidates(game),offset=game.offset+game.size;
  if(offset<game.end)return {...game,offset,winners:chosen.filter(c=>!game.locked.some(locked=>String(locked.id)===String(c.id))),marked:[]};
  const survivors=uniqueCandidates([...chosen,...game.byes]);
  if(survivors.length===9)return {...game,status:'done',chosen:survivors};
  if(survivors.length>9)return {...roundState(survivors,game.participants,[],game.round+1),reduction:true};
  const ids=new Set(survivors.map(c=>String(c.id)));
  return {...game,status:'short',chosen:survivors,remaining:game.participants.filter(c=>!ids.has(String(c.id)))};
}
export function chooseMore(game) {
  if(game.status!=='short')return game;
  return roundState(game.remaining,game.participants,game.chosen,game.round+1);
}
export function fillRemaining(game,random=Math.random) {
  if(game.status!=='short')return game;
  const additions=sampleCandidates(game.remaining,'all',random).slice(0,9-game.chosen.length);
  const chosen=uniqueCandidates([...game.chosen,...additions]);
  return chosen.length===9?{...game,status:'done',chosen}:game;
}

// Touch browsers may report both taps as separate single clicks.
export function activatedPhoto(event, previous) {
  if (!event.detail) return true; // Keyboard or assistive technology.
  const target = event.currentTarget;
  const time = event.timeStamp;
  const paired = previous.current?.target === target && time - previous.current.time <= 450;
  previous.current = paired ? null : {target, time};
  return paired || event.detail === 2;
}
