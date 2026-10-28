const assert=require('node:assert/strict'),fs=require('fs'),babel=require('@babel/core');
const m={exports:{}};
const code=babel.transformSync(fs.readFileSync('src/utils/statsPageWithSelected.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code;
new Function('module','exports',code)(m,m.exports);
const page=m.exports.statsPageWithSelected;
const rows=Array.from({length:105},(_,i)=>({candidate_id:i+1,rank:i+1,name:'Candidate '+(i+1)}));
for(const count of [10,20,25,50,100]){
 const result=page(rows,1,count,105);assert.equal(result.length,count+1);assert.equal(result.at(-1).rank,105);
 assert.equal(page(rows,1,count,1).length,count);
}
const example=page(rows,1,10,'15');assert.equal(example[10].rank,15);assert.deepEqual(example.slice(0,10),rows.slice(0,10));
assert.equal(page(rows,2,10,15).length,10);assert.equal(page(rows,2,10,1).at(-1).rank,1);
assert.equal(page(rows,1,10,null).length,10);assert.equal(page(rows,1,10,999).length,10);
assert.equal(page(rows.filter(r=>r.candidate_id!==15),1,10,15).length,10);
assert.equal(page([],1,10,15).length,0);assert.equal(rows.length,105);assert.equal(rows[14].rank,15);
const source=fs.readFileSync('src/components/StatsPage.js','utf8');assert.match(source,/\[itemsPerPage, setItemsPerPage\] = useState\(10\)/);assert.ok(source.includes('[10, 20, 25, 50, 100]'));assert.ok(source.includes('statsPageWithSelected(filteredStats, currentPage, itemsPerPage, highlightCandidateId)'));
console.log('PASS: default 10, five sizes, selected 15th as extra 11th row, no duplicates, later pages, search, empty/missing selection, ranks and input preserved');
