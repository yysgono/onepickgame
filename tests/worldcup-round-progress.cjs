const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
function load(file,mocks={}){const m={exports:{}};new Function('require','module','exports',babel.transformSync(fs.readFileSync(file,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code)(key=>{if(key in mocks)return mocks[key];throw Error('Missing '+key)},m,m.exports);return m.exports;}
const {worldcupProgress}=load('src/utils/worldcupProgress.js');
// Walk full brackets including odd counts and automatic byes. Their total
// user choices must remain N-1 through every round, without counting byes.
for(let n=2;n<=65;n++){
 let players=Array.from({length:n},(_,i)=>({id:i})),history=[];
 while(players.length>1){
  const pairs=[];for(let i=0;i<players.length;i+=2)pairs.push([players[i],players[i+1]||null]);
  for(let index=0;index<pairs.length;index++){
   const p=worldcupProgress(pairs,index,[],history);assert.equal(p.total,n-1);assert.equal(p.completed,history.filter(x=>x.c1&&x.c2).length);assert(p.percent>=0&&p.percent<=100);
   history.push({c1:pairs[index][0],c2:pairs[index][1],winner:pairs[index][0]});
  }
  players=pairs.map(pair=>pair[0]);
 }
 assert.equal(worldcupProgress([],0,[],history).percent,100);
}
const a={id:'a'},b={id:'b'},c={id:'c'};assert.equal(worldcupProgress([[a,b]],0,[c],[]).total,2);
const h=[{c1:a,c2:b,winner:a}];assert.equal(worldcupProgress([[a,b]],1,[],h).completed,1);assert.equal(worldcupProgress([[a,b]],0,[],[]).completed,0);
const resumed=worldcupProgress([[a,b],[c,null]],0,[],h);assert.equal(resumed.total,3,'Newly reintroduced candidates extend remaining choices');
const dom=new JSDOM('<div id="root"></div>',{url:'https://example.com/ko/select-round/cup'});Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{Simulate}=require('react-dom/test-utils');const copy=require('../src/components/worldcup/worldcupFlowCopy.json');
const Selection=load('src/components/worldcup/RoundSelection.js',{react:React,'./worldcupFlowCopy.json':copy,'./worldcupFlow.css':{}}).default;
const Progress=load('src/components/worldcup/MatchProgress.js',{react:React,'../../utils/worldcupProgress':{worldcupProgress},'./worldcupFlowCopy.json':copy,'./worldcupFlow.css':{}}).default;
(async()=>{const root=createRoot(document.getElementById('root'));let chosen=16,started;
 function View({lang}){const [round,setRound]=React.useState(16);return React.createElement(Selection,{lang,rounds:[8,16,32],selected:round,onChange:value=>{chosen=value;setRound(value)},onStart:value=>started=value,roundLabel:value=>value+'강',candidateCount:32,recommended:32});}
 for(const lang of Object.keys(copy)){
  await act(async()=>root.render(React.createElement(View,{lang,key:lang})));
  assert.equal(document.querySelectorAll('[role=radio]').length,3);assert.equal(document.querySelector('select'),null);
  await act(async()=>Simulate.click(document.querySelectorAll('[role=radio]')[2]));assert.equal(chosen,32);
  await act(async()=>Simulate.click(document.querySelector('.worldcup-round-start')));assert.equal(started,32);
  await act(async()=>Simulate.keyDown(document.querySelectorAll('[role=radio]')[2],{key:'Home'}));assert.equal(chosen,8);
 }
 await act(async()=>root.render(React.createElement(Progress,{lang:'ko',bracket:[[a,b]],index:0,pendingWinners:[],history:h,stageLabel:'결승',tournamentLabel:'4강'})));
 assert.equal(document.querySelector('[role=progressbar]').getAttribute('aria-valuenow'),'1');assert.equal(document.querySelector('[role=progressbar]').getAttribute('aria-valuemax'),'2');
 await act(async()=>root.unmount());dom.window.close();console.log('PASS: 2–65 entrant bracket totals, byes, undo/extra candidates, 20-language round buttons, keyboard selection, start round and accessible progress.');
})().catch(error=>{console.error(error);process.exitCode=1});
