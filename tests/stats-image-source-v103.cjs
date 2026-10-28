const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core');
function load(path,mocks={}){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(path,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(name=>mocks[name],m,m.exports);return m.exports;}
const recent=load('src/utils/recentLoadedImages.js');
const helper=load('src/utils/statsImageSource.js',{'./recentLoadedImages':recent});
const original='https://irfyuvuazhujtlgpkfci.supabase.co/storage/v1/object/public/candidates/test.jpg?v=2';
let source=helper.getStatsImageSource(original,{now:10000});assert.equal(source.transformed,true);let url=new URL(source.url);assert.ok(url.pathname.includes('/render/image/public/'));assert.equal(url.searchParams.get('width'),'96');assert.equal(url.searchParams.get('v'),'2');
recent.rememberLoadedImage(original,10000);assert.deepEqual(helper.getStatsImageSource(original,{now:11000}),{url:original,transformed:false});
assert.equal(helper.getStatsImageSource(original,{now:3610000}).transformed,true);
assert.equal(helper.getStatsImageSource(original,{now:3610000,enabled:false}).transformed,false);
const external='https://example.test/image.jpg';assert.deepEqual(helper.getStatsImageSource(external),{url:external,transformed:false});
const signed='https://irfyuvuazhujtlgpkfci.supabase.co/storage/v1/object/sign/private/image.jpg?token=TEST_ONLY';assert.equal(helper.getStatsImageSource(signed).url,signed);
assert.equal(helper.staticCandidateImage('https://youtu.be/dQw4w9WgXcQ'),'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg');assert.equal(helper.staticCandidateImage('https://example.test/a.mp4'),'');assert.equal(helper.staticCandidateImage('javascript:alert(1)'),'');
helper.pauseStatsImageTransforms(4000000);assert.equal(helper.getStatsImageSource(original,{now:4000001}).transformed,false);assert.equal(helper.getStatsImageSource(original,{now:4060001}).transformed,true);
for(let i=0;i<513;i++)recent.rememberLoadedImage('https://example.test/'+i+'.jpg',5000000);assert.equal(recent.wasImageRecentlyLoaded('https://example.test/0.jpg',5000001),false);assert.equal(recent.wasImageRecentlyLoaded('https://example.test/512.jpg',5000001),true);
console.log('PASS: recent original reuse, expired hint, fixed small transform, external/signed preservation, static video handling, failure pause, bounded memory-only hints');
