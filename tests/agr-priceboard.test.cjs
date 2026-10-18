const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildSync } = require('esbuild');
function load(file) {
  const output = buildSync({ entryPoints: [path.join(__dirname, '../frontend/src', file)], bundle: true, platform: 'node', format: 'cjs', write: false });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}
const { toAgrStock, mergeAgrRecord, connectAgrPriceboard } = load('lib/agr-priceboard.ts');
const snapshot = { symbol: 'FPT', exchange: 'HOSE', FullName: 'FPT Corp', reference: 58000, closePrice: 58200, totalTrading: 3733300, totalTradingValue: 217764840000, bidPrice1: '58100.0', bidVol1: 16800, foreignRemain: 359373728, ts: 100, s: 10, tradingdate: '16/10/2026' };

test('AGR: converts VND and turnover units, preserves share quantities and auction prices', () => {
  const stock = toAgrStock(snapshot);
  assert.equal(stock.price, 58.2);
  assert.equal(stock.value, 217764.84);
  assert.equal(stock.volume, 3733300);
  assert.equal(stock.foreignRoom, 359373728);
  assert.equal(stock.quantScore, null);
  assert.equal(stock.bid[0].price, 58.1);
  assert.ok(Math.abs(stock.change - 0.3448275862068966) < 1e-10);
  const auction = toAgrStock({ ...snapshot, bidPrice1: 'ATC' });
  assert.equal(auction.bid[0].price, null);
  assert.equal(auction.bid[0].priceLabel, 'ATC');
  assert.equal(toAgrStock({ ...snapshot, exchange: 'XHNF' }), null);
  assert.equal(toAgrStock({ ...snapshot, symbol: 'CFPT2601' }), null);
});
test('AGR: merges sparse events, zeroes, stale snapshots and new-session sequences', () => {
  const merged = mergeAgrRecord(snapshot, { SB: 'FPT', CP: 59000, V1: 0, s: 11, ts: 101 });
  assert.equal(toAgrStock(merged).price, 59);
  assert.equal(toAgrStock(merged).bid[0].volume, 0);
  assert.equal(toAgrStock(merged).volume, 3733300);
  assert.equal(mergeAgrRecord(merged, snapshot).closePrice, 59000);
  assert.equal(mergeAgrRecord(merged, { SB: 'FPT', CP: 60000, TD: '19/10/2026', s: 1, ts: 200 }).closePrice, 60000);
  const earlyEvent = mergeAgrRecord(undefined, { SB: 'FPT', CP: 59000, ts: 101 });
  assert.equal(toAgrStock(mergeAgrRecord(earlyEvent, snapshot)).price, 59);
});
test('AGR: Engine.IO handshake, subscription acknowledgement, events and cleanup', () => {
  const sent = [], received = []; let ready = 0, reset = 0, disconnected = 0, closed = 0;
  const socket = { readyState: 1, send: frame => sent.push(frame), close: () => { closed++; socket.onclose?.(); } };
  const stop = connectAgrPriceboard({ onReady: () => ready++, onRecords: rows => received.push(...rows), onDisconnect: () => disconnected++, onReset: () => reset++ }, url => { assert.match(url, /EIO=3/); return socket; });
  const message = data => socket.onmessage({ data });
  message('0{"pingInterval":25000,"pingTimeout":60000}'); message('40');
  assert.equal(ready, 0);
  const subscription = JSON.parse(sent[0].slice(3));
  assert.deepEqual(subscription[1].data.args, ['e:HOSE', 'e:HNX', 'e:UPCOM']);
  message('430[{"statusCode":200}]'); assert.equal(ready, 1);
  message('42["i",{"a":"u","d":[{"SB":"FPT","CP":59000}]}]');
  message('42["initday",{}]'); message('42bad-json');
  assert.equal(received[0].CP, 59000); assert.equal(reset, 1);
  stop(); assert.equal(closed, 1); assert.equal(disconnected, 0); assert.equal(socket.onmessage, null);
});
test('AGR snapshot route returns 502 for invalid upstream and does not leak upstream errors', async () => {
  const { GET } = load('app/api/market/agr/route.ts');
  const previous = global.fetch;
  try {
    global.fetch = async url => { assert.equal(url, 'https://trading.agr.vn/datafeed/instruments'); return Response.json({ s: 'ok', d: [snapshot] }); };
    assert.equal((await GET()).status, 200);
    global.fetch = async () => Response.json({ s: 'error', d: [] });
    assert.equal((await GET()).status, 502);
    global.fetch = async () => { throw new Error('private upstream details'); };
    assert.doesNotMatch(await (await GET()).text(), /private upstream details/);
  } finally { global.fetch = previous; }
});
