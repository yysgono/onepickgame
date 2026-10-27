const assert=require('assert'),fs=require('fs'),vm=require('vm'),babel=require('@babel/core');
const code=babel.transformSync(fs.readFileSync(__dirname+'/../src/hooks/useClickTargetDebug.js','utf8'),{plugins:['@babel/plugin-transform-modules-commonjs'],babelrc:false,configFile:false}).code;
let effects=[];const moduleExports={};vm.runInNewContext(code,{exports:moduleExports,require:()=>({useEffect:f=>effects.push(f)}),URLSearchParams,window:{location:{search:''}},document:{},console});
moduleExports.default();assert.equal(effects.length,1);assert.equal(effects[0](),undefined);
const r={x:10,y:10,width:100,height:40,left:10,right:110,top:10,bottom:50};const link={tagName:'A',id:'',className:'home-activity-link',getBoundingClientRect:()=>r,contains:e=>e===link};const cover={tagName:'DIV',id:'cover',className:'overlay',getBoundingClientRect:()=>r};let top=link;
const doc={defaultView:{innerWidth:1000,innerHeight:800,getComputedStyle:e=>({position:e===cover?'absolute':'relative',zIndex:'1',pointerEvents:'auto',cursor:'pointer',opacity:'1'})},querySelectorAll:()=>[link],elementFromPoint:()=>top,elementsFromPoint:()=>[top,link]};
assert.equal(moduleExports.inspectClickTargets(doc)[0].blocked.length,0);top=cover;const found=moduleExports.inspectClickTargets(doc)[0];assert.equal(found.blocked.length,1);assert.equal(found.blocked[0].covering[0].id,'cover');top={...cover,tagName:'IFRAME'};assert.equal(moduleExports.inspectClickTargets(doc)[0].blocked[0].covering[0].tag,'IFRAME');
console.log('PASS: default inactive, normal links, overlay detection, iframe detection');
