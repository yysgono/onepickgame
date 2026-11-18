const assert = require('node:assert/strict');
const fixture = require('./platform-home-fixtures.cjs');
const config = require('../src/utils/publicSupabaseConfig');
const original = global.fetch, keys = [];
for (const name of ['SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'REACT_APP_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']) process.env[name] = '';
process.env.SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL = config.url;
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-never-for-public-home';
global.fetch = async (input, options) => {
  const url = new URL(String(input)); assert.equal(url.origin, config.url);
  keys.push(new Headers(options?.headers).get('apikey'));
  const table = url.pathname.split('/').at(-1);
  const value = table === 'get_worldcup_play_counts' ? [{ cup_id: fixture.id, play_count: 99 }] : fixture.tables[table] || [];
  return new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
};
const app = require('../server');
const server = app.listen(0, '127.0.0.1', async () => {
  try {
    const response = await original('http://127.0.0.1:' + server.address().port + '/api/platform-home?lang=en');
    assert.equal(response.status, 200);
    const data = await response.json();
    assert(data.groups.every(group => !group.unavailable && group.rows.length > 0));
    assert(keys.length > 0 && keys.every(key => key === config.key));
    console.log('PASS: a server configured only with its existing service-role key can read all home groups using the browser public key; no service-role key is used for public home queries.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { global.fetch = original; server.close(); }
});
