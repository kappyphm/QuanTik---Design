import market from "../../../backend/mock/market.json";
import analysis from "../../../backend/mock/analysis.json";
import charts from "../../../backend/mock/charts.json";
import definitions from "../../../backend/mock/models.json";

export const stocks = market.stocks;
export const sectors = market.sectors;
export const indices = market.indices;
export const models = definitions.models;
export type Stock = (typeof stocks)[number];
export type Candle = (typeof charts.series)[number]["candles"][number];
export type Model = (typeof models)[number];
export type Analysis = (typeof analysis.analyses)[number];
export const getStock = (symbol: string) =>
  stocks.find((s) => s.symbol === symbol.toUpperCase());
export const getAnalysis = (symbol: string) =>
  analysis.analyses.find((s) => s.symbol === symbol.toUpperCase());
export const getCandles = (symbol: string) =>
  charts.series.find((s) => s.symbol === symbol.toUpperCase())?.candles ?? [];
export const format = (value: number, digits = 2) =>
  value.toLocaleString("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
export const signed = (value: number) =>
  `${value > 0 ? "+" : ""}${format(value)}%`;
export const tone = (value: number) =>
  value > 0 ? "positive" : value < 0 ? "negative" : "neutral";

export function aggregateCandles(
  data: Candle[],
  timeframe: "1D" | "1W" | "1M",
): Candle[] {
  if (timeframe === "1D") return data;
  const groups = new Map<string, Candle[]>();
  for (const candle of data) {
    const date = new Date(`${candle.date}T00:00:00Z`);
    if (timeframe === "1W")
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const key =
      timeframe === "1M"
        ? candle.date.slice(0, 7)
        : date.toISOString().slice(0, 10);
    const group = groups.get(key) ?? [];
    group.push(candle);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    date: group[0].date,
    open: group[0].open,
    close: group[group.length - 1].close,
    high: Math.max(...group.map((c) => c.high)),
    low: Math.min(...group.map((c) => c.low)),
    volume: group.reduce((sum, c) => sum + c.volume, 0),
    cmf: group.reduce((sum, c) => sum + c.cmf, 0) / group.length,
  }));
}
