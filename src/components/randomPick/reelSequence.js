// Visual sequence only: keep neighbours distinct and the selected winner at the stop.
export function reelSequence(pool,winner,target,length){
 if(!pool.length)return [];
 const index=Math.max(0,pool.findIndex(row=>row.id===winner?.id)),n=pool.length;
 return Array.from({length},(_,i)=>pool[((i-target+index)%n+n)%n]);
}
