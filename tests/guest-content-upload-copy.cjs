const assert=require('node:assert/strict');
const guest=require('../src/utils/guestUploadCopy.json'),top=require('../src/components/topNine/copy.json'),registration=require('../src/components/topNine/registrationCopy.json'),tier=require('../src/locales/tierInlineEditor.json');
assert.equal(Object.keys(guest).length,20);
for(const [lang,copy]of Object.entries(guest)){
 for(const key of ['help','type','share','rate','failed'])assert(copy[key]?.trim(),lang+'/'+key);
 assert(top[lang].publishHelp.includes(copy.nineHelp),lang+' public registration');
 assert.equal(registration[lang].help,copy.nineHelp);
 assert.equal(tier[lang].guestGuide,copy.tierHelp);
 assert.equal(tier[lang].signInToPublish,copy.tierHelp);
}
console.log('PASS: guest upload guidance and messages across all 20 languages.');
