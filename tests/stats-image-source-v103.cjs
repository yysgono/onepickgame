const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core');
function load(path,mocks={}){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(path,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(name=>{if(!(name in mocks))throw Error(name);return mocks[name];},m,m.exports);return m.exports;}
const normalize=load('src/utils/originalStorageImageUrl.js');
const helper=load('src/utils/statsImageSource.js',{'./originalStorageImageUrl':normalize});
const base='https://irfyuvuazhujtlgpkfci.supabase.co/storage/v1/';
const original=base+'object/public/candidates/test.jpg?v=2';
const transformed=base+'render/image/public/candidates/test.jpg?width=96&width=48&height=96&resize=contain&quality=70&format=webp&v=2&download=test#preview';
const expected=base+'object/public/candidates/test.jpg?v=2&download=test#preview';
assert.equal(normalize.originalStorageImageUrl(transformed),expected);
assert.equal(normalize.originalStorageImageUrl(expected),expected);
for(const value of [original,transformed])for(const options of [{},{enabled:true},{enabled:false},{now:0}])assert.deepEqual(helper.getStatsImageSource(value,options),{url:value===transformed?expected:original,transformed:false});
for(const path of ['object/sign/private/a.jpg','render/image/sign/private/a.jpg']){
 const signed=base+path+'?token=TEST_ONLY%2B%2F&width=96&quality=70';
 assert.equal(normalize.originalStorageImageUrl(signed),signed);
 assert.deepEqual(helper.getStatsImageSource(signed),{url:signed,transformed:false});
}
for(const value of ['https://example.test/image.jpg','https://example.test/storage/v1/render/image/public/b/a.jpg?width=96','/images/local.jpg','data:image/png;base64,AA==','blob:https://example.test/id'])assert.equal(helper.getStatsImageSource(value).url,value);
for(const value of ['',null,undefined,123,'http://[','javascript:alert(1)','file:///tmp/a.jpg','https://example.test/a.mp4'])assert.deepEqual(helper.getStatsImageSource(value),{url:'',transformed:false});
assert.equal(helper.staticCandidateImage('https://youtu.be/dQw4w9WgXcQ'),'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
const previous=process.env.REACT_APP_SUPABASE_URL;
try{
 process.env.REACT_APP_SUPABASE_URL='https://custom.test';
 assert.equal(normalize.originalStorageImageUrl('https://custom.test/storage/v1/render/image/public/b/a.jpg?width=96&v=1'),'https://custom.test/storage/v1/object/public/b/a.jpg?v=1');
 process.env.REACT_APP_SUPABASE_URL='invalid';assert.equal(normalize.originalStorageImageUrl(transformed),expected);
}finally{if(previous===undefined)delete process.env.REACT_APP_SUPABASE_URL;else process.env.REACT_APP_SUPABASE_URL=previous;}
helper.pauseStatsImageTransforms();assert.deepEqual(helper.getStatsImageSource(original),{url:original,transformed:false});
console.log('PASS: public originals, query removal, signed preservation, custom origin, malformed input and disabled transformations');
