const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{File}=require('node:buffer'),vm=require('vm');
const parser=require('@babel/parser');
function load(file,mocks={}){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(file,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(name=>{if(!(name in mocks))throw Error(name);return mocks[name];},m,m.exports);return m.exports;}
function walk(n,f){if(!n||typeof n!=='object')return;f(n);for(const x of Object.values(n))if(Array.isArray(x))x.forEach(a=>walk(a,f));else if(x&&typeof x==='object')walk(x,f);}
function declarations(file,names){const s=fs.readFileSync(file,'utf8'),tree=parser.parse(s,{sourceType:'module',plugins:['jsx']}),found={};walk(tree,n=>{if(n.type==='FunctionDeclaration'&&names.includes(n.id?.name))found[n.id.name]=s.slice(n.start,n.end);if(n.type==='VariableDeclarator'&&names.includes(n.id?.name))found[n.id.name]='const '+s.slice(n.start,n.end)+';';});for(const name of names)assert.ok(found[name],name);return names.map(n=>found[n]).join('\n');}
const bytes=fs.readFileSync('tests/fixtures/mp4-h264.mp4');
const origCreate=URL.createObjectURL,origRevoke=URL.revokeObjectURL;let allocated=0,revoked=0,mode='success';
URL.createObjectURL=()=>{allocated++;return 'blob:test'};URL.revokeObjectURL=()=>{revoked++};
global.document={createElement:()=>({videoWidth:96,videoHeight:64,pause(){},removeAttribute(){},load(){if(this.onloadeddata)queueMicrotask(()=>mode==='success'?this.onloadeddata?.():this.onerror?.());}})};
const mp4=load('src/utils/mp4Upload.js'),gif=load('src/utils/gifUpload.js');
(async()=>{
 const input=new File([bytes],'video.MP4',{type:''});const out=await mp4.prepareMp4File(input);
 assert.equal(out.type,'video/mp4');assert.equal(out.name,'video.mp4');assert.deepEqual(Buffer.from(await out.arrayBuffer()),bytes);assert.equal(allocated,revoked);
 assert.equal(await mp4.prepareMp4File(out),out);
 const exact=new File([bytes,Buffer.alloc(mp4.MP4_MAX_BYTES-bytes.length)],'exact.mp4');assert.equal((await mp4.prepareMp4File(exact)).size,mp4.MP4_MAX_BYTES);
 await assert.rejects(()=>mp4.prepareMp4File(new File([exact,Buffer.alloc(1)],'large.mp4')),/8MB/);
 await assert.rejects(()=>mp4.prepareMp4File(new File(['not-video'],'renamed.mp4')),/Invalid MP4/);
 await assert.rejects(()=>mp4.prepareMp4File(new File([bytes],'fake.mp4',{type:'video/webm'})),/Invalid MP4/);
 mode='error';await assert.rejects(()=>mp4.prepareMp4File(new File([bytes],'bad-codec.mp4')),/could not be played/);mode='success';assert.equal(allocated,revoked);
 const shared={...mp4,...gif,File,Date,console,Error,URL,t:key=>key};
 const edit=declarations('src/components/EditWorldcupPage.js',['processSelectedFile','MAX_IMAGE_INPUT_BYTES','MAX_VIDEO_BYTES','isImageFile','isVideoFile','IMAGE_MIME_TYPES','VIDEO_MIME_TYPES','IMAGE_EXTENSION_RE','VIDEO_EXTENSION_RE']);
 const runtime=vm.runInNewContext(edit+'\n;processSelectedFile',{...shared,compressImageToWebp:()=>{throw Error('MP4 must not go through image compression')}});
 assert.equal((await runtime(input)).type,'video/mp4');await assert.rejects(()=>runtime(new File([exact,Buffer.alloc(1)],'large.mp4')),/8MB/);
 // Exercise the actual worldcup bulk handler and its final save callback.
 const makerNames=['handleFiles','isImageFile','IMAGE_EXTENSIONS','IMAGE_MIME_TYPES','IMAGE_MAX_INPUT_BYTES'];
 const makerBase=declarations('src/components/WorldcupMaker.js',makerNames);
 let candidates=[],alerts=[];
 const makerContext={...shared,MAX_UPLOAD:3000,MAX_CANDIDATES:3000,candidates,uuidv4:()=> 'candidate',cleanCandidateName:n=>n.replace(/\.[^.]+$/,''),revokeBlobUrl:()=>{},normalizeImageFile:()=>{throw Error('MP4 must bypass image compression')},alert:m=>alerts.push(m),setCandidates:fn=>{candidates=fn(candidates)}};
 const bulk=vm.runInNewContext(makerBase+'\n;handleFiles',makerContext);
 await bulk([input,new File([exact,Buffer.alloc(1)],'large.mp4'),new File(['bad'],'fake.mp4')]);
 assert.equal(candidates.length,1);assert.equal(candidates[0].file.type,'video/mp4');assert.ok(alerts[0].includes('8MB'));assert.ok(alerts[0].includes('Invalid MP4'));
 const makerSource=fs.readFileSync('src/components/WorldcupMaker.js','utf8');const makerTree=parser.parse(makerSource,{sourceType:'module',plugins:['jsx']});let saveCallback;
 walk(makerTree,n=>{if(n.type==='ArrowFunctionExpression'&&n.async&&n.params[0]?.name==='candidate'&&makerSource.slice(n.start,n.end).includes('const fileIsImage'))saveCallback=makerSource.slice(n.start,n.end)});
 assert.ok(saveCallback);const makerUploads=[];
 const makerSave=vm.runInNewContext('('+saveCallback+')',{...shared,isImageFile:()=>false,IMAGE_MAX_INPUT_BYTES:6*1024*1024,IMAGE_MAX_OUTPUT_BYTES:1024*1024,normalizeImageFile:()=>{throw Error('MP4 must bypass image compression')},nickname:'',currentUser:{id:'test'},DEFAULT_THUMB_URL:'/fallback.png',uploadCandidateImage:async file=>{makerUploads.push(file);return 'https://example.test/saved.mp4'}});
 assert.equal((await makerSave({id:'test',name:'Video',file:input})).image,'https://example.test/saved.mp4');assert.equal(makerUploads[0].type,'video/mp4');
 await assert.rejects(()=>makerSave({file:new File([exact,Buffer.alloc(1)],'over.mp4')}),/8MB/);assert.equal(makerUploads.length,1);
 let changed;const single=vm.runInNewContext(declarations('src/components/CandidateInput.js',['handleFileChange'])+'\n;handleFileChange',{...shared,value:{name:'name'},onChange:next=>{changed=next},alert:m=>alerts.push(m)});
 await single({target:{files:[input],value:'video.MP4'}});assert.equal(changed.file.type,'video/mp4');
 changed=undefined;await single({target:{files:[new File([exact,Buffer.alloc(1)],'over.mp4')],value:'over'}});assert.equal(changed,undefined);
 
 // Extract actual useCallback body; keep Storage calls stubbed, not validation.
 const uploads=[];const tierContext={...shared,normalizeImageFile:async f=>mp4.prepareMp4File(f),useCallback:f=>f,crypto:{randomUUID:()=> 'video-id'},supabase:{storage:{from:bucket=>({upload:async(path,file,options)=>{uploads.push({bucket,path,file,options});return {error:null}},getPublicUrl:path=>({data:{publicUrl:'https://example.test/'+path}})})}},Math};
 const tierUploadCode=declarations('src/components/TierListMaker.js',['uploadLocalCandidate']);
 // useCallback dependencies are read when evaluating the real declaration.
 Object.assign(tierContext,{supabase:tierContext.supabase});
 const tierUpload=vm.runInNewContext(tierUploadCode+'\n;uploadLocalCandidate',tierContext);
 await tierUpload({_source:'local',file:input},'tier');assert.equal(uploads[0].path,'tier/video-id.mp4');assert.equal(uploads[0].options.contentType,'video/mp4');assert.deepEqual(Buffer.from(await uploads[0].file.arrayBuffer()),bytes);
 const saveCode=declarations('src/components/EditWorldcupPage.js',['uploadPendingCandidateImage','MAX_IMAGE_OUTPUT_BYTES','MAX_VIDEO_BYTES','getFileExtension','sanitizeFileBaseName']);const editUploads=[];
 const save=vm.runInNewContext(saveCode+'\n;uploadPendingCandidateImage',{...shared,fetch,nickname:'',user:{id:'test'},uploadCandidateImage:async f=>{editUploads.push(f);return 'https://example.test/'+f.name}});
 const saved=await save({name:'Video',image:'data:video/mp4;base64,'+bytes.toString('base64'),pendingFileName:'video.MP4'});assert.ok(saved.endsWith('.mp4'));assert.equal(editUploads[0].type,'video/mp4');assert.deepEqual(Buffer.from(await editUploads[0].arrayBuffer()),bytes);
 URL.createObjectURL=origCreate;URL.revokeObjectURL=origRevoke;
 // Real React rendering/effects with media playback mocked (JSDOM has no codecs).
 const {JSDOM}=require('jsdom');const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test/'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const observers=[];global.IntersectionObserver=class{constructor(cb){this.cb=cb;observers.push(this)}observe(){}disconnect(){}};
 let plays=0,pauses=0;window.HTMLMediaElement.prototype.play=function(){plays++;return Promise.resolve()};window.HTMLMediaElement.prototype.pause=function(){pauses++};
 const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');const Mp4Media=load('src/components/Mp4Media.jsx',{react:React});
 const recent=load('src/utils/recentLoadedImages.js'),original=load('src/utils/originalStorageImageUrl.js');const Renderer=load('src/components/MediaRenderer.jsx',{react:React,'./Mp4Media':Mp4Media,'react-i18next':{useTranslation:()=>({t:key=>key})},'../utils/recentLoadedImages':recent,'../utils/originalStorageImageUrl':original}).default;
 const root=createRoot(document.getElementById('root'));const render=props=>act(async()=>root.render(React.createElement(Renderer,props)));
 await render({url:'https://example.test/a.mp4',playable:true,active:true});assert.equal(document.querySelector('video').getAttribute('src'),null);
 await act(async()=>observers.at(-1).cb([{isIntersecting:true}]));let video=document.querySelector('video');assert.equal(video.getAttribute('src'),'https://example.test/a.mp4');assert.equal(video.muted,true);assert.equal(video.loop,true);assert.equal(video.playsInline,true);assert.ok(plays>0);
 const before=plays;await render({url:'https://example.test/a.mp4',playable:true,active:false});assert.equal(video.autoplay,false);assert.equal(plays,before);assert.ok(pauses>0);
 await render({url:'blob:test',mediaType:'video/mp4'});video=document.querySelector('video');assert.equal(video.getAttribute('src'),'blob:test');assert.equal(video.autoplay,false);assert.equal(video.preload,'metadata');
 await render({url:'https://example.test/signed.mp4?token=KEEP%2B',autoPlayVideo:true});assert.equal(document.querySelector('video').getAttribute('src'),'https://example.test/signed.mp4?token=KEEP%2B');
 await act(async()=>{document.querySelector('video').dispatchEvent(new window.Event('error'))});assert.equal(document.querySelector('video'),null);assert.ok(document.querySelector('.media-name-fallback'));
 await act(async()=>root.unmount());dom.window.close();console.log('PASS MP4: 8MiB boundaries, content validation, decode-error cleanup, worldcup bulk/individual/final save, edit prepare/save, tier Storage MIME/extension, preview visibility, active pause, muted inline looping, signed query, failure fallback. Codec decoding requires a real browser.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{URL.createObjectURL=origCreate;URL.revokeObjectURL=origRevoke});
