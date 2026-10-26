const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const manifest = JSON.parse(fs.readFileSync('build/asset-manifest.json', 'utf8'));
const main = path.basename(manifest.entrypoints.find(file => file.endsWith('.js')));
const found = new Map();
for (const file of fs.readdirSync('build/static/js').filter(file => file.endsWith('.js'))) {
  const script = fs.readFileSync(path.join('build/static/js', file), 'utf8');
  // Webpack emits large JSON modules as JSON.parse(string literals). Decode the
  // literals without executing generated application code.
  for (const match of script.matchAll(/JSON\.parse\(('(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*")\)/g)) {
    const data = JSON.parse(parser.parseExpression(match[1]).value);
    if (data?.game_guide_upload) found.set(data.game_guide_upload, file);
  }
}
const languages = Object.keys(require('../src/seo/siteHomeCopy.json'));
for (const lang of languages) {
  const data = require(`../src/locales/${lang}/translation.json`);
  const file = found.get(data.game_guide_upload);
  assert(file, `${lang} full resource must be present in built assets`);
  if (lang === 'en') assert.equal(file, main);
  else {
    assert.notEqual(file, main, `${lang} must not be in initial main JS`);
    assert(!manifest.entrypoints.some(entry => path.basename(entry) === file));
  }
}
console.log('PASS: English fallback in main; all 15 other full language resources exist only in deferred assets.');
