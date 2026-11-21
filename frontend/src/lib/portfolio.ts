import type { Portfolio } from "./portfolio-engine";
import type { Asset } from "./portfolio-engine";
import { loadSharedPortfolioAssets, type PortfolioResourceData } from "./portfolio-resources";
import { registerQuantVariance } from "./portfolio-quant-adapter";

export const assetDefinitions = [
  { symbol: "FPT", beta: 1.1, color: "#ff914d" },
  { symbol: "VCB", beta: .8, color: "#67d6a5" },
  { symbol: "HPG", beta: 1.4, color: "#82aaff" },
  { symbol: "MBB", beta: 1.15, color: "#77cdd4" },
  { symbol: "SSI", beta: 1.6, color: "#d3a6ed" },
  { symbol: "VNM", beta: .6, color: "#e3c16c" },
];

export type PortfolioData = {
  assets: Asset[];
  resources: PortfolioResourceData[];
  samples: { name: string; portfolio: Portfolio }[];
  info: { observations: number; candles: number; priceLabel: string; priceAsOf: string };
};

/** Nạp toàn bộ dữ liệu thật cho trang: giá/ngành/nến từ kết quả quét đã công bố. */
export async function loadPortfolioData(): Promise<PortfolioData> {
  const shared = await loadSharedPortfolioAssets(assetDefinitions);
  for (const [symbol, variance] of shared.variances) registerQuantVariance(symbol, variance);
  const sampleCost = (symbol: string, ratio: number) => Math.round(shared.assets.find(a => a.symbol === symbol)!.price * ratio / 100) * 100;
  const samples: PortfolioData["samples"] = [
    { name: "Danh mục hỗn hợp", portfolio: { cash: 50000000, positions: [{ symbol: "FPT", quantity: 2000, cost: sampleCost("FPT", .9) }, { symbol: "VCB", quantity: 1000, cost: sampleCost("VCB", .96) }, { symbol: "HPG", quantity: 4000, cost: sampleCost("HPG", 1.06) }, { symbol: "MBB", quantity: 3000, cost: sampleCost("MBB", .9) }] } },
    { name: "Tập trung FPT", portfolio: { cash: 20000000, positions: [{ symbol: "FPT", quantity: 5000, cost: sampleCost("FPT", .9) }, { symbol: "VCB", quantity: 500, cost: sampleCost("VCB", .96) }] } },
    { name: "Biến động cao SSI / HPG", portfolio: { cash: 15000000, positions: [{ symbol: "SSI", quantity: 8000, cost: sampleCost("SSI", 1.08) }, { symbol: "HPG", quantity: 8000, cost: sampleCost("HPG", 1.06) }] } },
  ];
  return {
    assets: shared.assets,
    resources: shared.resources,
    samples,
    info: {
      observations: shared.observations,
      candles: shared.observations + 1,
      priceLabel: `Giá đóng cửa phiên ${shared.resources[0]?.priceAsOf ?? ""} từ kết quả quét đã công bố`,
      priceAsOf: shared.resources[0]?.priceAsOf ?? "",
    },
  };
}

export const money = (value: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
export const pct = (value: number, digits = 1) => `${(value * 100).toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
