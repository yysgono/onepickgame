// Count choices, not automatic byes. Recompute from live state so undo and
// resurrection use the same bracket/history that the game already owns.
export function worldcupProgress(bracket,index,pendingWinners,history){
 const pairs=Array.isArray(bracket)?bracket:[];
 const position=Math.max(0,Math.min(pairs.length,Number(index)||0));
 const completed=(history||[]).filter(match=>match?.c1&&match?.c2&&match?.winner).length;
 const currentRemaining=pairs.slice(position).filter(pair=>pair?.[0]&&pair?.[1]).length;
 const advancing=pairs.filter(pair=>pair?.[0]||pair?.[1]).length+(pendingWinners||[]).filter(Boolean).length;
 const remaining=currentRemaining+Math.max(0,advancing-1);
 const total=completed+remaining;
 return {completed,total,percent:total?Math.min(100,Math.max(0,completed/total*100)):0};
}
