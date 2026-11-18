const assert=require('node:assert/strict');
const Module=require('node:module'),original=Module._resolveFilename;
let missing=0;
Module._resolveFilename=function(request,...args){
 if(/(?:PlatformHome|TierCardPreview|QuizCategorySections)\.css$/.test(request)){
  missing++;const error=Error('Cannot find module '+request);error.code='MODULE_NOT_FOUND';throw error;
 }
 return original.call(this,request,...args);
};
const config=require('../vercel.json');
const included=config.builds.find(build=>build.src==='server.js').config.includeFiles;
for(const name of ['src/components/PlatformHome.css','src/components/tierList/TierCardPreview.css','src/components/QuizCategorySections.css'])assert(included.includes(name));
process.on('exit',()=>{assert.equal(missing,3);});
require('./platform-home-routes.cjs');
