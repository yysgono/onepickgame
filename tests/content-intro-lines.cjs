const assert = require('node:assert/strict');
const random = require('../src/components/randomPick/randomPickCopy.json');
const topics = require('../src/components/randomPick/recommendationPages.json');
const nine = require('../src/components/topNine/copy.json');
const { renderRandomHtml } = require('../random-pick-routes.cjs');
const shell = '<html><head></head><body><div id="root"></div></body></html>';
const origin = 'https://example.com';

for (const [lang, copy] of Object.entries(random)) {
  for (const mode of ['', ...Object.keys(copy.modes), ...Object.keys(topics)]) {
    const game = topics[mode]?.mode || mode;
    const intro = game ? copy.modeDescriptions[game] : copy.intro;
    assert(intro?.trim() && [...intro].length <= 100, `${lang}/${mode} has concise copy`);
    assert(!intro.includes('\n'), `${lang}/${mode} has no forced line breaks`);
    const html = renderRandomHtml(shell, origin, lang, mode);
    assert.match(html, /<\/h1><p style="[^"]*-webkit-line-clamp:2[^"]*">[^<]+<\/p>/);
  }
}

for (const [lang, copy] of Object.entries(nine)) {
  assert(copy.introLines.length >= 2, lang);
  assert.equal(copy.introLines.join(' '), copy.subtitle);
  assert(copy.subtitle.length > 70, lang);
}

console.log('PASS: concise random-picker introductions for all languages, modes and topics; Top 9 introductions preserved');
