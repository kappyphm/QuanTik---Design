const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildSync } = require('esbuild');
const output = buildSync({ entryPoints: [path.join(__dirname, '../frontend/src/lib/api/client.ts')], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
function client() { const module = { exports: {} }; new Function('require', 'module', 'exports', output)(require, module, module.exports); return module.exports; }

test('Concurrent API calls share one refresh and keep customer/admin bearer tokens separate', async () => {
  const api = client(), previous = global.fetch;
  let refreshes = 0;
  const authorizations = [];
  global.fetch = async (url, init) => {
    if (url === '/api/v1/auth/refresh') { refreshes++; await Promise.resolve(); return Response.json({ access_token: 'user-only', expires_in: 900 }); }
    authorizations.push([url, new Headers(init.headers).get('Authorization')]);
    return Response.json({ ok: true });
  };
  try {
    await Promise.all([api.api('user', 'me'), api.api('user', 'me/usage')]);
    api.accept('admin', { access_token: 'admin-only', expires_in: 900 });
    await api.api('admin', 'admin/me');
    assert.equal(refreshes, 1);
    assert.deepEqual(authorizations, [['/api/v1/me', 'Bearer user-only'], ['/api/v1/me/usage', 'Bearer user-only'], ['/api/v1/admin/me', 'Bearer admin-only']]);
  } finally { global.fetch = previous; }
});

test('Logout invalidation discards an in-flight refresh instead of restoring a stale session', async () => {
  const api = client(), previous = global.fetch;
  let resolve;
  global.fetch = () => new Promise(done => { resolve = done; });
  try {
    const pending = api.refresh('user');
    api.forget('user');
    resolve(Response.json({ access_token: 'must-not-revive', expires_in: 900 }));
    await assert.rejects(pending, error => error.status === 401);
  } finally { global.fetch = previous; }
});

test('Mutating request with uncertain network outcome is never automatically replayed', async () => {
  const api = client(), previous = global.fetch;
  let calls = 0;
  api.accept('user', { access_token: 'user-only', expires_in: 900 });
  global.fetch = async () => { calls++; throw new Error('Network disconnected after sending'); };
  try {
    await assert.rejects(api.api('user', 'orders', api.mutation('POST', { plan_id: 'fixture' }, 'same-key')), error => error.code === 'BACKEND_UNAVAILABLE');
    assert.equal(calls, 1);
  } finally { global.fetch = previous; }
});
