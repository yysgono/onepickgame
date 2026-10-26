const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { JSDOM } = require('jsdom');
const babel = require('@babel/core');
const localRequire = createRequire(path.resolve('src/utils/bootAfterPaint.js'));
const moduleObject = { exports: {} };
new Function('require', 'module', 'exports', babel.transformSync(fs.readFileSync('src/utils/bootAfterPaint.js', 'utf8'), {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
}).code)(localRequire, moduleObject, moduleObject.exports);
const { bootAfterPaint } = moduleObject.exports;
function fixture(hidden = false, raf = true) {
  const dom = new JSDOM('<html lang="ko"><body><div id="root"><main><h1>이상형 월드컵</h1><a href="/ko/quiz">퀴즈</a></main></div></body></html>', { pretendToBeVisual: true });
  Object.defineProperty(dom.window.document, 'visibilityState', { value: hidden ? 'hidden' : 'visible' });
  let id = 0;
  const frames = new Map(), timers = new Map(), marks = [];
  const browser = { document: dom.window.document, performance: { mark: name => marks.push(name) },
    setTimeout: (fn, delay) => { const key = ++id; timers.set(key, { fn, delay }); return key; },
    clearTimeout: key => timers.delete(key),
  };
  if (raf) {
    browser.requestAnimationFrame = fn => { const key = ++id; frames.set(key, fn); return key; };
    browser.cancelAnimationFrame = key => frames.delete(key);
  }
  const frame = () => { const list = [...frames.values()]; frames.clear(); return Promise.all(list.map(fn => fn())); };
  return { browser, doc: browser.document, frames, timers, marks, frame };
}
(async () => {
  const f = fixture();
  const serverRoot = f.doc.getElementById('root'), originalMain = serverRoot.firstChild;
  let resolveModule, requests = 0, mounts = 0;
  const pending = new Promise(resolve => { resolveModule = resolve; });
  const boot = bootAfterPaint(() => { requests++; return pending; }, f.browser);
  assert.equal(requests, 0);
  await f.frame();
  assert.equal(requests, 0, 'large module must not start in the first pre-paint frame');
  const nextFrame = f.frame();
  await Promise.resolve();
  assert.equal(requests, 1);
  assert.equal(serverRoot.firstChild, originalMain, 'pending download must preserve server DOM and links');
  assert.equal(boot.start(), boot.start(), 'startup must deduplicate concurrent requests');
  resolveModule({ mountApplication() { mounts++; serverRoot.textContent = 'Interactive app'; } });
  await nextFrame;
  assert.equal(mounts, 1);
  assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
  await boot.start(); assert.equal(requests, 1);
  assert(f.marks.includes('onepick-app-module-ready'));

  for (const [hidden, raf] of [[true, true], [false, false]]) {
    const x = fixture(hidden, raf); let count = 0;
    const controller = bootAfterPaint(async () => ({ mountApplication() { count++; } }), x.browser);
    assert.equal([...x.timers.values()][0].delay, 0);
    await [...x.timers.values()][0].fn(); assert.equal(count, 1);
    controller.dispose();
  }
  const failed = fixture(); let fail = true, retryCount = 0;
  const previousError = console.error; console.error = () => {};
  try {
    const controller = bootAfterPaint(async () => {
      retryCount++; if (fail) throw new Error('network');
      return { mountApplication() {} };
    }, failed.browser);
    const before = failed.doc.getElementById('root').innerHTML;
    await controller.start();
    assert.equal(failed.doc.getElementById('root').innerHTML, before);
    assert(failed.doc.querySelector('[role="alert"] button'));
    assert.equal(retryCount, 1, 'failure must not cause an automatic reload/retry loop');
    fail = false;
    failed.doc.querySelector('button').click(); await controller.start();
    assert.equal(retryCount, 2); assert.equal(failed.doc.querySelector('[role="alert"]'), null);
  } finally { console.error = previousError; }
  const disposed = fixture(); let unexpected = false;
  const controller = bootAfterPaint(async () => { unexpected = true; return {}; }, disposed.browser);
  controller.dispose(); await controller.start();
  assert.equal(unexpected, false); assert.equal(disposed.frames.size, 0); assert.equal(disposed.timers.size, 0);
  console.log('PASS: paint opportunity before module load, preserved server DOM, startup deduplication, background/no-rAF fallback, failure/manual retry, disposal.');
})().catch(error => { console.error(error); process.exitCode = 1; });
