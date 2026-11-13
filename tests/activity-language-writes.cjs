const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core');
function exportedFunction(file,name,bindings){
 const ast=babel.parseSync(fs.readFileSync(file,'utf8'),{sourceType:'module',configFile:false,babelrc:false});
 const node=ast.program.body.find(n=>n.type==='ExportNamedDeclaration'&&n.declaration?.id?.name===name).declaration;
 const code=babel.transformFromAstSync({type:'File',program:{type:'Program',sourceType:'script',body:[node]}},null,{configFile:false,babelrc:false}).code;
 return new Function(...Object.keys(bindings),`${code};return ${name}`)(...Object.values(bindings));
}
let payload,table,options;
const supabase={from(name){table=name;return {insert:async row=>{payload=row;return {error:null}},upsert:async(row,opts)=>{payload=row;options=opts;return {error:null}}}}};
const bindings={supabase,currentActivityLanguage:lang=>lang,getUserOrGuestId:async()=>({user_id:null,guest_id:'guest'}),getQuizParticipantId:()=> 'participant'};
(async()=>{
 for(const file of ['src/utils.js','src/utils/index.js']){
  const record=exportedFunction(file,'insertWinnerLog',bindings);
  await record('cup','winner','ja');assert.equal(table,'winner_logs');assert.equal(payload[0].page_language,'ja');assert.equal(payload[0].cup_id,'cup');
 }
 const quiz=exportedFunction('src/utils/supabaseQuizApi.js','saveQuizAttempt',bindings);
 await quiz({quizId:'quiz',attemptToken:'once',language:'en',records:[{correct:true,question:{id:'q1'}},{correct:false}]});
 assert.equal(table,'quiz_attempts');assert.equal(payload.page_language,'en');assert.equal(payload.correct_count,1);assert.equal(payload.answered_count,2);assert.equal(options.ignoreDuplicates,true);
 console.log('PASS: worldcup writers retain visitor language; quiz records language and preserves scores/idempotency');
})().catch(e=>{console.error(e);process.exitCode=1});
