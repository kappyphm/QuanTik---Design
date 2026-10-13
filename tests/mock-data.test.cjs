const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, "../backend/mock", name + ".json"), "utf8"));

test("Snapshot giao diện giữ nguồn và không tạo dòng tiền ròng hoặc dự báo giả", () => {
  const market = read("market");
  assert.equal(market.mode, "snapshot-sample");
  assert.equal(market.source.provider, "vnstock_price_board");
  assert.equal(market.units.value, "triệu đồng");
  assert.equal(market.units.sectorValue, "tỷ đồng");
  const fpt = market.stocks.find((stock) => stock.symbol === "FPT");
  assert.equal(fpt.price, 56.30);
  assert.equal(fpt.reference, 57.10);
  assert.equal(fpt.volume, 6775400);
  assert.equal(fpt.matchedVolume, null);
  for (const stock of market.stocks) {
    assert.equal(stock.bid.length, 3);
    assert.equal(stock.ask.length, 3);
    assert.ok(market.sectors.some((sector) => sector.name === stock.sector));
  }
  for (const sector of market.sectors) assert.equal("flow" in sector, false);
  for (const index of market.indices) assert.equal(index.value, null);
  assert.equal(read("analysis").results.length, 0);
  assert.equal(read("charts").series.length, 0);
});

test("Mẫu Excel giữ nhãn nguồn, không suy diễn trọng số hoặc tín hiệu mua", () => {
  const scan = read("scan");
  assert.equal(scan.source.sheet, "Summary_20261005_2338");
  assert.equal(scan.best.length, 5);
  assert.equal(scan.avoid.length, 5);
  assert.ok(scan.best.every((result) => result.recommendation === "THEO DÕI"));
  assert.ok(scan.avoid.every((result) => result.recommendation === "TRÁNH"));
  assert.ok(scan.criteria.every((group) => group.metrics.every((metric) => metric.weight === null)));
});
