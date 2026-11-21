import { api } from "./api/client";
import { getMarketCandles, getMarketLatest } from "./api/market";
import type { ScreeningLatest, ScreeningResults } from "./api/screening";
import type { Asset } from "./portfolio-engine";

/** Phân ngành ICB (mã 4 số của nguồn dữ liệu) sang tên hiển thị. */
const SECTOR_NAMES: Record<string, string> = {
  "0500": "Dầu khí", "1300": "Hóa chất", "1700": "Tài nguyên cơ bản",
  "2300": "Xây dựng & vật liệu", "2700": "Hàng & dịch vụ công nghiệp",
  "3300": "Ô tô & phụ tùng", "3500": "Thực phẩm & đồ uống",
  "3700": "Hàng cá nhân & gia dụng", "4500": "Y tế", "5300": "Bán lẻ",
  "5500": "Truyền thông", "5700": "Du lịch & giải trí", "6300": "Viễn thông",
  "6500": "Tiện ích", "6700": "Bất động sản", "8300": "Ngân hàng",
  "8500": "Bảo hiểm", "8700": "Dịch vụ tài chính", "9500": "Công nghệ thông tin",
};
export const sectorName = (code: string | null | undefined): string | null =>
  code ? SECTOR_NAMES[code] ?? `Ngành ${code}` : null;

export type PortfolioResourceData = {
  symbol: string; name: string | null; sector: string | null;
  priceVnd: number | null; priceAsOf: string;
  candles: { label: string; close: number }[];
  screening: { status: string; score: number | null; label: string; source: string };
  quant: { status: string; score: number | null; label: string; factors: { label: string; raw?: string }[] };
};

type Candle = { label: string; close: number };
export function alignedCandleReturns(series: { symbol: string; candles: Candle[] }[]) {
  if (!series.length) throw new Error("Thiếu chuỗi giá dùng chung.");
  for (const { candles } of series) if (candles.length < 2 || new Set(candles.map(c => c.label)).size !== candles.length || candles.some(c => !c.label || !Number.isFinite(c.close) || c.close <= 0)) throw new Error("Nến thiếu, trùng phiên hoặc có giá không hợp lệ.");
  const common = series[0].candles.map(c => c.label).filter(label => series.every(s => s.candles.some(c => c.label === label)));
  if (common.length < 3) throw new Error("Cần ít nhất ba nến chung để tính covariance.");
  for (const s of series) if (s.candles.filter(c => common.includes(c.label)).map(c => c.label).join("|") !== common.join("|")) throw new Error("Các chuỗi không cùng thứ tự phiên.");
  return { labels: common.slice(1), returns: series.map(s => { const closes = common.map(label => s.candles.find(c => c.label === label)!.close); return closes.slice(1).map((close, i) => close / closes[i] - 1); }) };
}

/** Nạp giá, ngành, nến và bằng chứng quét từ kết quả đã công bố gần nhất. */
export async function loadSharedPortfolioAssets(definitions: { symbol: string; beta: number; color: string }[]) {
  const latest = await getMarketLatest();
  const bySymbol = new Map(latest.items.map(item => [item.symbol, item]));
  let screeningBySymbol: Map<string, string> | null = new Map();
  try {
    const sLatest = await api<ScreeningLatest>("user", "screenings/latest");
    const results = await api<ScreeningResults>("user", `screenings/${encodeURIComponent(sLatest.id)}/results?group=OVERALL`);
    for (const item of results.items) screeningBySymbol.set(item.symbol, item.status);
  } catch { screeningBySymbol = null; }
  const resources: PortfolioResourceData[] = [];
  for (const definition of definitions) {
    const item = bySymbol.get(definition.symbol);
    const candleData = await getMarketCandles(definition.symbol, 300);
    const candles = candleData.bars.map(bar => ({ label: bar.session, close: bar.close }));
    const screenStatus = screeningBySymbol?.get(definition.symbol);
    resources.push({
      symbol: definition.symbol,
      name: item?.name ?? null,
      sector: sectorName(item?.sector),
      priceVnd: item?.price_vnd ?? null,
      priceAsOf: latest.as_of,
      candles,
      screening: !screeningBySymbol
        ? { status: "UNAVAILABLE", score: null, label: "Không tải được kết quả quét", source: "" }
        : screenStatus
          ? { status: "PUBLISHED", score: null, label: screenStatus === "ELIGIBLE" ? "Đủ điều kiện" : screenStatus === "LOW_LIQUIDITY" ? "Thanh khoản thấp" : "Chưa đủ dữ liệu", source: `Quét toàn sàn · phiên ${latest.as_of}` }
          : { status: "NOT_LISTED", score: null, label: "Không có trong kết quả quét gần nhất", source: `Quét toàn sàn · phiên ${latest.as_of}` },
      quant: { status: "UNAVAILABLE", score: null, label: "Chưa có báo cáo Quant", factors: [] },
    });
  }
  const aligned = alignedCandleReturns(resources.map(r => ({ symbol: r.symbol, candles: r.candles })));
  const assets: Asset[] = resources.map((r, i) => {
    if (r.priceVnd === null || !r.name || !r.sector) throw new Error(`Thiếu giá/ngành dùng chung của ${r.symbol}.`);
    return { symbol: r.symbol, name: r.name, sector: r.sector, price: r.priceVnd, beta: definitions[i].beta, color: definitions[i].color, returns: aligned.returns[i] };
  });
  const variances = new Map(assets.map(asset => {
    const mean = asset.returns.reduce((a, b) => a + b, 0) / asset.returns.length;
    const variance = asset.returns.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, asset.returns.length - 1);
    return [asset.symbol, variance] as const;
  }));
  return { assets, resources, variances, observations: aligned.labels.length, labels: aligned.labels };
}
