// Shared geometry for the editor, public thumbnails and PNG export.
// Coordinates use a 100 × 100 board; slot order and saved data stay unchanged.
const low=26,high=74,cut=low+(high-low)/(2+Math.SQRT2),far=100-cut;
const polygons=[
 [[0,0],[30,0],[cut,low],[low,cut],[0,30]],
 [[30,0],[70,0],[far,low],[cut,low]],
 [[70,0],[100,0],[100,30],[high,cut],[far,low]],
 [[0,30],[low,cut],[low,far],[0,70]],
 [[cut,low],[far,low],[high,cut],[high,far],[far,high],[cut,high],[low,far],[low,cut]],
 [[high,cut],[100,30],[100,70],[high,far]],
 [[0,70],[low,far],[cut,high],[30,100],[0,100]],
 [[cut,high],[far,high],[70,100],[30,100]],
 [[high,far],[100,70],[100,100],[70,100],[far,high]]
];
const captions=[[15,28],[50,15],[85,28],[10,57],[50,68],[90,57],[15,90],[50,92],[85,90]];
const ranks=[[4,5],[44,4],[81,5],[3,44],[42,27],[89,44],[4,82],[46,82],[81,82]];
const layouts=polygons.map((points,index)=>{
 const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1]));
 const width=Math.max(...points.map(p=>p[0]))-x,height=Math.max(...points.map(p=>p[1]))-y;
 const local=([px,py])=>[(px-x)/width*100,(py-y)/height*100];
 const caption=local(captions[index]),rank=local(ranks[index]);
 return {points,x,y,width,height,caption:captions[index],rank:ranks[index],style:{
  left:x+'%',top:y+'%',width:width+'%',height:height+'%',
  clipPath:'polygon('+points.map(p=>local(p).map(n=>n+'%').join(' ')).join(',')+')',
  '--tn-name-x':caption[0]+'%','--tn-name-y':caption[1]+'%',
  '--tn-rank-x':rank[0]+'%','--tn-rank-y':rank[1]+'%'
 }};
});
// Draw each shared edge once so adjacent tiles have the same line weight.
const uniqueEdges=new Map();
polygons.forEach(points=>points.forEach((from,index)=>{
 const to=points[(index+1)%points.length];
 const key=[from.join(','),to.join(',')].sort().join('|');
 if(!uniqueEdges.has(key))uniqueEdges.set(key,[from,to]);
}));
const edges=[...uniqueEdges.values()];
const boundaryPath=edges.map(([from,to])=>'M'+from.join(' ')+'L'+to.join(' ')).join(' ');
const boundaryColor='#9878bd';
function cropForSlot(w,h,index,zoom=1,x=50,y=50){
 const {width,height}=layouts[index],ratio=width/height;
 const z=Number.isFinite(Number(zoom))?Math.max(0,Math.min(3,Number(zoom))):1;
 const cover=Math.min(w/ratio,h),contain=Math.max(w/ratio,h);
 const ch=z<1?contain+(cover-contain)*z:cover/z,cw=ch*ratio;
 const fraction=value=>Math.max(0,Math.min(100,Number(value)||0))/100;
 return [(w-cw)*fraction(x),(h-ch)*fraction(y),cw,ch];
}
export {layouts,cropForSlot,edges,boundaryPath,boundaryColor};
export default {layouts,cropForSlot,edges,boundaryPath,boundaryColor};
