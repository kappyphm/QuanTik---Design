const { test } = require("node:test");
const assert = require("node:assert/strict");
const data = require("../backend/mock/analysis-visuals.json");
const demo = require("../backend/mock/demo.json");
const scan = require("../backend/mock/scan.json");

test("Fixture biểu đồ có đủ mã và giữ trạng thái mô phỏng", () => {
  assert.equal(data.mode, "demo");
  const symbols = new Set([...demo.results, ...scan.best, ...scan.avoid].map(r => r.symbol));
  assert.equal(data.reports.length, symbols.size);
  for (const report of data.reports) { assert.ok(symbols.has(report.symbol)); assert.equal(report.mode, "demo"); }
});
test("Dải phân vị, phân phối và xác suất mẫu hợp lệ", () => {
  for (const r of data.reports) {
    assert.ok(Math.abs(Object.values(r.hmm.probabilities).reduce((a, b) => a + b, 0) - 1) < 1e-8);
    assert.ok(Math.abs(r.monteCarlo.distribution.reduce((sum, p) => sum + p.probabilityPct, 0) - 100) < .001);
    for (const path of r.monteCarlo.paths) { assert.equal(path.length, r.monteCarlo.horizon + 1); assert.ok(path.every(v => Number.isFinite(v) && v > 0)); }
    for (const p of r.monteCarlo.cone) assert.ok(p.p05 <= p.p25 && p.p25 <= p.p50 && p.p50 <= p.p75 && p.p75 <= p.p95);
  }
});
