const fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/components/StatsPage.js','utf8');
const code=source.match(/function percent\(n, d, digits = 0\) \{[\s\S]*?\n\}/)[0];
const percent=new Function(code+';return percent;')();
assert.equal(percent(8,183,1),'4.4%');assert.equal(percent(7,183,1),'3.8%');assert.equal(percent(0,183,1),'0.0%');assert.equal(percent(1,1,1),'100.0%');assert.equal(percent(0,0,1),'-');assert.equal(percent(233,362),'64%');
assert.ok(source.includes('winRateAll: percent(win_count, total_games, 1)'));assert.ok(source.includes('winRateAll: percent(row.user_win_count || 0, row.user_total_games || 0, 1)'));
assert.ok(source.includes('background: "#dcecff"'));assert.ok(source.includes('borderBottom: "1px solid #bdd4ef"'));
console.log('PASS: championship decimal, zero/no results, existing match rounding, member totals and blue row styling');
