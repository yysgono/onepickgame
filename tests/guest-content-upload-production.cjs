const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../guest-content-upload-build');
const jpeg=Buffer.alloc(160);jpeg[0]=255;jpeg[1]=216;jpeg[2]=255;jpeg[3]=192;jpeg.writeUInt16BE(17,4);jpeg[6]=8;jpeg.writeUInt16BE(100,7);jpeg.writeUInt16BE(100,9);jpeg[158]=255;jpeg[159]=217;
class Local extends ResourceLoader{fetch(url){const p=new URL(url).pathname;if(p.startsWith('/static/'))return Promise.resolve(fs.readFileSync(path.join(build,p)));return null;}}
async function run(kind,lang,failFirst=false){
 const created='a1111111-1111-4111-8111-111111111111',errors=[],alerts=[],events=[],vc=new VirtualConsole();let payload,jobCount=0,nonce=0,shouldFail=failFirst;
 vc.on('jsdomError',error=>{if(error.type!=='not implemented')errors.push(error.message)});
 const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:`https://www.onepickgame.com/${lang}/${kind==='tier'?'tier-list':'mytop9'}`,runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.AbortSignal.timeout=()=>new w.AbortController().signal;Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto,configurable:true});w.fetch=async(input,init)=>{const u=new URL(String(input),'https://www.onepickgame.com');let data=[];
   if(u.pathname==='/api/guest-content-upload'){
    const body=JSON.parse(init.body);events.push(body.action);
    if(body.action==='begin'){jobCount++;assert.equal(body.kind,kind);assert.equal(body.files.length,kind==='tier'?(failFirst?1:50):9);return new Response(JSON.stringify({id:'b2222222-2222-4222-8222-222222222222',token:'c'.repeat(64)}),{headers:{'content-type':'application/json'}});}
    if(body.action==='upload')return new Response(JSON.stringify({url:'https://example.supabase.co/storage/v1/object/public/guest-content-images/b2222222-2222-4222-8222-222222222222/'+String(body.index).padStart(8,'0')+'-0000-4000-8000-000000000000.jpg'}),{headers:{'content-type':'application/json'}});
    return new Response('{"ok":true}',{headers:{'content-type':'application/json'}});
   }
   if(u.pathname.endsWith('/rpc/create_guest_tier_list')||u.pathname.endsWith('/rpc/publish_top_nine_board_v5')){payload=JSON.parse(init.body);events.push('publish');if(shouldFail){shouldFail=false;return new Response('{"message":"Temporary failure","code":"TEST"}',{status:400,headers:{'content-type':'application/json'}});}data=created;}
   else if(u.pathname.endsWith('/top_nine_public_boards')&&u.searchParams.has('id'))data={id:created,title:payload?.p_title||'Guest board',slots:payload?.p_slots||[],source_worldcup_ids:[],guest_nickname:'Guest',author_id:null,category:'etc',show_names:false};
   else if(u.pathname.endsWith('/tier_lists')&&u.searchParams.has('id'))data={id:created,title:payload?.p_title||'Guest tier',guest_nickname:'Guest',tier_labels:payload?.p_tier_labels||{},tiers:payload?.p_tiers||{},candidates:payload?.p_candidates||[],created_at:'2026-11-16T00:00:00Z'};
   return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
  };
  w.alert=message=>alerts.push(String(message));w.confirm=()=>true;w.URL.createObjectURL=()=>`blob:photo-${++nonce}`;w.URL.revokeObjectURL=()=>{};
  w.Image=class{constructor(){this.naturalWidth=100;this.naturalHeight=100;this.tagName='IMG';}set src(value){this._src=value;queueMicrotask(()=>this.onload?.());}get src(){return this._src;}};
  w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},drawImage(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},save(){},restore(){},stroke(){},fillText(){},measureText(text){return{width:String(text).length*10}}});
  w.HTMLCanvasElement.prototype.toBlob=function(callback,type){callback(new w.Blob([jpeg],{type:type||'image/jpeg'}))};w.HTMLCanvasElement.prototype.toDataURL=()=>{const bytes=Buffer.from(jpeg);bytes[70]=++nonce%255;return'data:image/jpeg;base64,'+bytes.toString('base64')};
  w.Blob.prototype.arrayBuffer=function(){return new Promise((resolve,reject)=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsArrayBuffer(this)})};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
  w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
 }});
 const w=dom.window,d=w.document,wait=async fn=>{for(let i=0;i<400;i++){if(fn())return;await new Promise(r=>setTimeout(r,30));}throw Error(kind+'/'+lang+' timeout '+d.body.textContent.slice(-1800)+' '+errors.join('\n'))};
 const value=(input,text)=>{Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(input,text);input.dispatchEvent(new w.Event('input',{bubbles:true}));};
 try{
  if(kind==='tier'){
   await wait(()=>d.querySelector('.tier-editor-publish:not(:disabled)'));value(d.querySelector('#tier-original-title'),'Guest tier');
   const input=d.querySelector('input[type=file]'),file=new w.File([jpeg],'animation.gif',{type:'image/gif'});Object.defineProperty(input,'files',{value:[file],configurable:true});input.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(()=>alerts.length>0);assert.equal(events.length,0);
   const files=Array.from({length:failFirst?1:50},(_,i)=>new w.File([jpeg],'Photo '+i+'.jpg',{type:'image/jpeg'}));const drop=new w.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(drop,'dataTransfer',{value:{files,types:['Files']}});d.querySelector('.tier-editor-row').dispatchEvent(drop);await wait(()=>d.querySelectorAll('.tier-editor-row [draggable=true]').length===files.length);
   if(!failFirst){const before=alerts.length;Object.defineProperty(input,'files',{value:[new w.File([jpeg],'Extra.jpg',{type:'image/jpeg'})],configurable:true});input.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(()=>alerts.length>before);assert(alerts.at(-1).includes('50'));}
   assert.equal(events.length,0,'Editing must not upload');d.querySelector('.tier-editor-publish').click();await wait(()=>d.querySelector('dialog[open]'));const dialog=d.querySelector('dialog[open]');value(dialog.querySelector('input[type=text]'),'Guest');value(dialog.querySelector('input[type=password]'),'password123');dialog.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
   if(failFirst){await wait(()=>events.includes('cancel'));assert(w.location.pathname.endsWith('/tier-list'));assert(d.querySelector('.tier-editor-row [draggable=true]'));dialog.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
   await wait(()=>w.location.pathname.endsWith('/tier-list/'+created));assert.equal(payload.p_candidates.length,files.length);assert(payload.p_candidates.every(c=>c.image.includes('/guest-content-images/')));
  }else{
   await wait(()=>d.querySelector('input[type=file]'));const files=Array.from({length:9},(_,i)=>new w.File([jpeg],'Photo '+i+'.jpg',{type:'image/jpeg'}));const input=d.querySelector('input[type=file]');Object.defineProperty(input,'files',{value:files,configurable:true});input.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(()=>d.querySelector('.tn-board-complete .tn-publish-button:not(:disabled)'));assert.equal(events.length,0);d.querySelector('.tn-board-complete .tn-publish-button').click();await wait(()=>d.querySelector('.tn-publish-dialog form'));const form=d.querySelector('.tn-publish-dialog form'),fields=form.querySelectorAll('input');value(fields[0],'Guest');value(fields[1],'password123');value(fields[2],'password123');form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>w.location.pathname.endsWith('/mytop9/'+created));assert.equal(payload.p_slots.length,9);assert(payload.p_slots.every(c=>c.src.includes('/guest-content-images/')));assert(payload.p_salt&&payload.p_proof);
  }
  assert(events.includes('complete'));assert(events.indexOf('publish')>events.indexOf('upload'));assert.equal(jobCount,failFirst?2:1);assert.equal(w.localStorage.getItem('sb-irfyuvuazhujtlgpkfci-auth-token'),null,'Guest upload must not change the main auth session');console.log('PASS: built '+kind+'/'+lang+(failFirst?' failed-save cleanup queue, preserved images and retry':' guest static-photo publish')+', no early upload, quota and normal auth preserved.');
 }finally{dom.window.close();}
}
(async()=>{await run('tier','en');await run('tier','ko',true);await run('nine','en');})().catch(error=>{console.error(error);process.exitCode=1});
