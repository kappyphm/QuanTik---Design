import { api } from "./client";

export type MarketLatestItem = {
  symbol: string; name: string | null; exchange: string | null; sector: string | null;
  price_vnd: number | null; change_1d_ratio: number | null; change_5d_ratio: number | null;
  change_20d_ratio: number | null; volume_shares: number | null;
};
export type MarketLatest = { as_of: string; run_id: string; published_at: number | null; items: MarketLatestItem[] };
export type MarketCandles = {
  symbol: string; as_of: string;
  bars: { session: string; open: number; high: number; low: number; close: number; volume: number }[];
};
export type AccountPortfolio = {
  cash_vnd: number;
  positions: { symbol: string; quantity: number; cost_vnd: number }[];
  updated_at: number | null;
};

export const getMarketLatest = () => api<MarketLatest>("user", "market/latest");
export const getMarketCandles = (symbol: string, limit: number) =>
  api<MarketCandles>("user", `market/candles?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
export const getAccountPortfolio = () => api<AccountPortfolio>("user", "portfolio");
export const putAccountPortfolio = (body: { cash_vnd: number; positions: { symbol: string; quantity: number; cost_vnd: number }[] }) =>
  api<AccountPortfolio>("user", "portfolio", { method: "PUT", body: JSON.stringify(body) });
