const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const fixture = (name) =>
  JSON.parse(
    fs.readFileSync(path.join(root, "backend/mock", name + ".json"), "utf8"),
  );
const filename = path.join(root, "frontend/src/lib/mock-data.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    target: ts.ScriptTarget.ES2022,
  },
});
const moduleObject = { exports: {} };
vm.runInNewContext(compiled.outputText, {
  module: moduleObject,
  exports: moduleObject.exports,
  require: createRequire(filename),
});
const { aggregateCandles, getStock, getAnalysis, getCandles } =
  moduleObject.exports;

test("Mỗi cổ phiếu có dữ liệu phân tích và biểu đồ nhất quán", () => {
  const { stocks, sectors } = fixture("market");
  assert.equal(new Set(stocks.map((s) => s.symbol)).size, stocks.length);
  for (const stock of stocks) {
    const data = getAnalysis(stock.symbol),
      candles = getCandles(stock.symbol);
    assert.ok(data, stock.symbol);
    assert.ok(candles.length > 20, stock.symbol);
    assert.equal(candles.at(-1).close, stock.price);
    assert.equal(stock.spark.at(-1), stock.price);
    assert.equal(data.forecast[0].p50, stock.price);
    assert.equal(
      data.regimes.reduce((sum, r) => sum + r.probability, 0),
      100,
    );
    for (const p of data.forecast)
      assert.ok(
        p.p10 <= p.p25 && p.p25 <= p.p50 && p.p50 <= p.p75 && p.p75 <= p.p90,
      );
    for (const candle of candles)
      assert.ok(
        candle.low <= Math.min(candle.open, candle.close) &&
          candle.high >= Math.max(candle.open, candle.close),
      );
  }
  for (const sector of sectors)
    assert.ok(Number.isFinite(sector.flow), sector.name);
  assert.equal(getStock("UNKNOWN"), undefined);
  assert.equal(getAnalysis("UNKNOWN"), undefined);
  assert.equal(getCandles("UNKNOWN").length, 0);
});

test("Khung tuần giữ OHLC, cộng khối lượng và tách tuần", () => {
  const c = (date, open, high, low, close, volume, cmf) => ({
    date,
    open,
    high,
    low,
    close,
    volume,
    cmf,
  });
  const input = [
    c("2026-08-28", 10, 13, 9, 12, 100, 0.2),
    c("2026-08-29", 12, 15, 11, 14, 200, 0.4),
    c("2026-08-31", 14, 17, 13, 16, 300, -0.2),
  ];
  const result = aggregateCandles(input, "1W");
  assert.equal(result.length, 2);
  assert.equal(result[0].open, 10);
  assert.equal(result[0].close, 14);
  assert.equal(result[0].high, 15);
  assert.equal(result[0].low, 9);
  assert.equal(result[0].volume, 300);
  assert.ok(Math.abs(result[0].cmf - 0.3) < 1e-12);
  assert.equal(result[1].date, "2026-08-31");
});

test("Khung tháng tách tháng và không làm mất khối lượng", () => {
  const input = [
    {
      date: "2026-08-31",
      open: 10,
      high: 13,
      low: 9,
      close: 12,
      volume: 100,
      cmf: 0.1,
    },
    {
      date: "2026-09-01",
      open: 12,
      high: 15,
      low: 11,
      close: 14,
      volume: 200,
      cmf: 0.2,
    },
  ];
  const result = aggregateCandles(input, "1M");
  assert.equal(result.length, 2);
  assert.equal(
    result.reduce((sum, c) => sum + c.volume, 0),
    300,
  );
  assert.equal(aggregateCandles(input, "1D"), input);
});
