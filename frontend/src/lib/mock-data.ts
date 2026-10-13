import market from "../../../backend/mock/market.json";
import charts from "../../../backend/mock/charts.json";
import scan from "../../../backend/mock/scan.json";

type Quote = number | null;
export type Stock = {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  reference: Quote;
  ceiling: Quote;
  floor: Quote;
  price: Quote;
  change: Quote;
  volume: Quote;
  matchedVolume: Quote;
  value: Quote;
  open: Quote;
  high: Quote;
  low: Quote;
  foreignBuy: Quote;
  foreignSell: Quote;
  foreignRoom: Quote;
  quantScore: Quote;
  bid: { price: Quote; volume: Quote }[];
  ask: { price: Quote; volume: Quote }[];
};

export const stocks: Stock[] = market.stocks;
export const sectors = market.sectors;
export const indices = market.indices;
export const chartOptions = charts;
export const scanSnapshot = scan;
export type ScanResult = (typeof scan.best)[number] | (typeof scan.avoid)[number];
export const getScanResult = (symbol: string) =>
  [...scan.best, ...scan.avoid].find((result) => result.symbol === symbol);
export const getStock = (symbol: string) =>
  stocks.find((stock) => stock.symbol === symbol.toUpperCase());
export const format = (value: Quote, digits = 2) =>
  value === null ? "—" : value.toLocaleString("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
export const signed = (value: Quote) =>
  value === null ? "—" : `${value > 0 ? "+" : ""}${format(value)}%`;
export const tone = (value: Quote) =>
  value === null ? "muted" : value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
