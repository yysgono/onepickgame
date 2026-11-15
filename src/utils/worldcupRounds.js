export function worldcupRounds(candidateCount){
 const count=Math.max(0,Math.floor(Number(candidateCount)||0));
 if(count<2)return [];
 if(count<8)return [count];
 const rounds=[];
 for(let round=8;round<=Math.min(count,10000);round*=2)rounds.push(round);
 if(count<=10000&&!rounds.includes(count))rounds.push(count);
 return rounds;
}
