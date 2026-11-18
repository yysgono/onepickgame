const assert = require('node:assert/strict');
const home = require('../src/seo/platformHome');
const request = require('../src/seo/platformHomeData');
const fixture = require('./platform-home-fixtures.cjs');

(async () => {
  const data = await home.load(fixture.client(), 'ko');
  let calls = 0;
  const readPublic = async () => { calls++; return data; };
  const never = async () => { throw Error('Unexpected API request'); };
  assert.deepEqual(await request.load({ lang: 'ko', initial: data, fetch: never, readPublic }), data);
  assert.equal(calls, 0);
  for (const fetcher of [
    async () => new Response('{"error":"Not Found"}', { status: 404 }),
    async () => new Response('<html><div id="root"></div></html>'),
    async () => new Response('{}', { status: 503 }),
    async () => new Response(JSON.stringify(Object.assign({}, data, { version: 1 }))),
    async () => { throw Error('Network unavailable'); },
    async () => new Response(JSON.stringify(Object.assign({}, data, { lang: 'en' }))),
  ]) {
    assert.deepEqual(await request.load({ lang: 'ko', fetch: fetcher, readPublic }), data);
  }
  assert.equal(calls, 6);
  let apiCalls = 0;
  const partial = structuredClone(data);
  partial.groups[0].rows = []; partial.groups[0].unavailable = true;
  partial.groups[2].rows[0].label = 'Keep successful server data';
  const recovered = await request.load({ lang: 'ko', initial: partial, fetch: async () => { apiCalls++; }, readPublic });
  assert.equal(apiCalls, 0);
  assert.deepEqual(recovered.groups[0], data.groups[0]);
  assert.equal(recovered.groups[2].rows[0].label, 'Keep successful server data');
  const timeout = await request.load({ lang: 'ko', timeoutMs: 2, readPublic,
    fetch: (_, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(Error('Timed out')))),
  });
  assert.deepEqual(timeout, data);
  const controller = new AbortController();
  const cancelled = request.load({ lang: 'ko', signal: controller.signal, readPublic: never,
    fetch: (_, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(Error('Cancelled')))),
  });
  controller.abort(); await assert.rejects(cancelled, { name: 'AbortError' });
  const failed = await request.load({ lang: 'ko', fetch: async () => new Response('{}', { status: 404 }), readPublic: async () => { throw Error('Database unavailable'); } });
  assert(failed.groups.every(group => group.unavailable && group.rows.length === 0));
  assert.equal(failed.groups[0].href, '/ko/ideal-type-world-cup');
  for (const [lang, copy] of Object.entries(home.COPY)) {
    assert(copy.failed && copy.failed !== copy.empty);
    assert(home.render(request.empty(lang), lang).includes(copy.failed));
  }
  const failures = new Set(['quizzes']), client = fixture.client(failures), cached = home.makeLoader(client);
  assert((await cached('ko')).groups[1].unavailable);
  failures.clear(); assert((await cached('ko')).groups[1].unavailable);
  assert.equal((await cached('ko', { refresh: true })).groups[1].unavailable, false);
  console.log('PASS: missing API/CRA HTML/503/network failure/timeout recover through public reads; partial SSR preserves good sections; cancellation and genuine failures stay safe; retry refreshes failure cache; 20-language error/empty distinction.');
})().catch(error => { console.error(error); process.exitCode = 1; });
