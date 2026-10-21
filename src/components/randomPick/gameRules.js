import {randomInt,shuffle} from '../../utils/randomPickCore';
export const TAU=Math.PI*2;
export function probabilities(rows,locked={}){
 const active=rows.filter(r=>r.enabled!==false&&r.name.trim());
 const fixed=active.filter(r=>Object.prototype.hasOwnProperty.call(locked,r.id));
 const sum=fixed.reduce((s,r)=>s+Number(locked[r.id]),0),free=active.length-fixed.length;
 if(fixed.some(r=>!Number.isFinite(Number(locked[r.id]))||Number(locked[r.id])<0)||sum>100+1e-8||(!free&&Math.abs(sum-100)>1e-8))return {valid:false,values:[],sum};
 return {valid:active.length>0,values:active.map(r=>({row:r,percent:Object.prototype.hasOwnProperty.call(locked,r.id)?Number(locked[r.id]):(100-sum)/free})),sum:100};
}
export function wheelWinner(values,angle){
 const point=(((-Math.PI/2-angle)%TAU)+TAU)%TAU;let edge=0;
 for(const value of values){edge+=value.percent/100*TAU;if(value.percent>0&&point<edge)return value.row;}
 return values.find(v=>v.percent>0)?.row;
}
export function numericCandidates(from,to){
 const a=Number(from),b=Number(to);if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a>b||b-a+1>200)throw new Error('range');
 return Array.from({length:b-a+1},(_,i)=>({id:`number:${a+i}`,name:String(a+i),image:'',enabled:true}));
}
export function pickMany(rows,count){const n=Number(count);if(!Number.isInteger(n)||n<1||n>rows.length)throw new Error('count');return shuffle(rows).slice(0,n);}
export function makeLadder(n){
 const rungs=[];for(let y=1;y<=Math.min(50,Math.max(18,n*3));y++)rungs.push({left:randomInt(n-1),y});
 return rungs;
}
export function ladderPath(n,rungs,start,gap=110){
 const x=i=>5+gap/2+i*gap,height=780,spacing=660/(rungs.length+1);let col=start;const points=[[x(col),60]];
 for(const r of rungs){const y=60+r.y*spacing;points.push([x(col),y]);if(col===r.left)col++;else if(col===r.left+1)col--;points.push([x(col),y]);}
 points.push([x(col),height]);return {points,end:col};
}
export function pathAtDistance(points,distance){
 const result=[points[0]];let remaining=distance;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<=remaining){result.push(b);remaining-=length;}else{const t=length?remaining/length:0;result.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);break;}}
 return result;
}
export function pathLength(points){return points.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);}

export function makeBoxDeck(rows,count){
 const total=Number(count);if(!Number.isInteger(total)||total<rows.length||total<1||total>200)throw new Error('box count');
 return shuffle([...rows,...Array.from({length:total-rows.length},(_,i)=>({id:`blank:${i}`,blank:true,name:'',image:''}))]);
}
