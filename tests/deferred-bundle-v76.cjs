// Run after the CRA production build. Check actual bundle membership, not import syntax.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const manifest = JSON.parse(fs.readFileSync('build/asset-manifest.json', 'utf8'));
const main = manifest.entrypoints.find(name => /\/main\.[^/]+\.js$/.test(name));
assert(main, 'main entry must exist');
let sources = JSON.parse(fs.readFileSync(path.join('build', main + '.map'), 'utf8')).sources;
if (sources.some(source => source.endsWith('/bootAfterPaint.js'))) {
  assert(!sources.some(source => source.split('/').pop() === 'App.js'), 'boot entry must not contain the React application');
  const maps = fs.readdirSync('build/static/js').filter(file => file.endsWith('.map'));
  const application = maps.map(file => JSON.parse(fs.readFileSync(path.join('build/static/js', file), 'utf8')))
    .find(map => map.sources.some(source => source.split('/').pop() === 'mountApplication.js'));
  assert(application, 'deferred application chunk must exist');
  sources = application.sources;
}
for (const name of ['Home', 'Header', 'LoginBox']) {
  assert(sources.some(source => source.endsWith('/' + name + '.js')), `${name} should be available immediately`);
}
for (const name of ['WorldcupMaker', 'QuizMaker', 'TierListMaker', 'AdminDashboard', 'AdminStatsPage', 'MatchPage', 'ResultPage', 'QuizPage', 'TierListPage']) {
  assert(!sources.some(source => source.endsWith('/' + name + '.js')), `${name} must not be in initial main JS`);
}
for (const file of Object.values(manifest.files)) {
  // Built JS/CSS chunks referenced by the manifest must be present at deploy time.
  if (/\.(?:js|css)$/.test(file)) {
    const localFile = path.join('build', file.replace(/^\//, ''));
    assert(fs.existsSync(localFile), file);
  }
}
const css = Object.values(manifest.files).filter(file => file.endsWith('.css')).map(file => fs.readFileSync(path.join('build', file.replace(/^\//, '')), 'utf8')).join('\n');
assert(!/@import[^;]*fonts\.googleapis\.com/.test(css), 'main CSS must not request blocking duplicate fonts');
console.log('PASS: production home/header/login stay eager; makers/admin/game routes are deferred; chunk files exist; no blocking Google Fonts CSS import.');
