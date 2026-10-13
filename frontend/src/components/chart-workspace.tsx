"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, ChartCandlestick, ChartLine, Star } from "lucide-react";
import {
  stocks,
  getStock,
  getCandles,
  aggregateCandles,
  format,
  signed,
  tone,
} from "@/lib/mock-data";
import { PriceChart } from "./charts";
import { PageHeading, EmptyState } from "./ui";
import { usePreferences } from "./preferences";
export function ChartWorkspace() {
  const params = useSearchParams(),
    router = useRouter(),
    symbol = (params.get("symbol") ?? "FPT").toUpperCase(),
    stock = getStock(symbol);
  const { watchlist, toggleWatch } = usePreferences();
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M">("1D"),
    [type, setType] = useState<"candles" | "line">("candles"),
    [cmf, setCmf] = useState(false);
  if (!stock)
    return (
      <>
        <PageHeading
          title={`Biểu đồ ${symbol}`}
          description="Mã này chưa có dữ liệu mẫu."
        />
        <EmptyState title="Chọn cổ phiếu khác">
          <Link href="/dashboard" className="text-link">
            Quay về Dashboard →
          </Link>
        </EmptyState>
      </>
    );
  const candles = aggregateCandles(getCandles(symbol), timeframe),
    last = candles.at(-1)!;
  return (
    <>
      <PageHeading
        title="Biểu đồ"
        description="Giá, khối lượng và dòng tiền trong cùng một không gian."
      >
        <Link className="button primary" href={`/analysis?symbol=${symbol}`}>
          Phân tích Quant <ArrowUpRight size={17} />
        </Link>
      </PageHeading>
      <section className="chart-workspace">
        <div className="chart-controls">
          <label>
            <span className="sr-only">Chọn mã biểu đồ</span>
            <select
              className="symbol-select"
              value={symbol}
              onChange={(e) =>
                router.replace(`/charts?symbol=${e.target.value}`)
              }
            >
              {stocks.map((s) => (
                <option key={s.symbol}>{s.symbol}</option>
              ))}
            </select>
          </label>
          <div className="segmented" role="group" aria-label="Khung thời gian">
            {(["1D", "1W", "1M"] as const).map((t) => (
              <button
                key={t}
                aria-pressed={timeframe === t}
                className={timeframe === t ? "active" : ""}
                onClick={() => setTimeframe(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div
            className="segmented chart-type"
            role="group"
            aria-label="Kiểu biểu đồ"
          >
            <button
              className={type === "candles" ? "active" : ""}
              aria-label="Biểu đồ nến"
              aria-pressed={type === "candles"}
              onClick={() => setType("candles")}
            >
              <ChartCandlestick size={18} />
            </button>
            <button
              className={type === "line" ? "active" : ""}
              aria-label="Biểu đồ đường"
              aria-pressed={type === "line"}
              onClick={() => setType("line")}
            >
              <ChartLine size={18} />
            </button>
          </div>
          <button
            className={`button secondary indicator-toggle ${cmf ? "is-saved" : ""}`}
            aria-pressed={cmf}
            onClick={() => setCmf(!cmf)}
          >
            CMF {cmf ? "✓" : "+"}
          </button>
          <button
            className="icon-button chart-watch"
            aria-label={`${watchlist.includes(symbol) ? "Bỏ theo dõi" : "Theo dõi"} ${symbol}`}
            aria-pressed={watchlist.includes(symbol)}
            onClick={() => toggleWatch(symbol)}
          >
            <Star
              size={18}
              fill={watchlist.includes(symbol) ? "currentColor" : "none"}
            />
          </button>
        </div>
        <div className="chart-stock-heading">
          <div>
            <h2>
              {symbol}
              <span>{stock.name}</span>
            </h2>
            <p>{stock.exchange} · Giá theo nghìn đồng</p>
          </div>
          <div>
            <strong className="number">{format(stock.price)}</strong>
            <span className={`number ${tone(stock.change)}`}>
              {signed(stock.change)}
            </span>
          </div>
        </div>
        <div className="ohlc-row">
          <span>{last.date}</span>
          {[
            ["O", last.open],
            ["H", last.high],
            ["L", last.low],
            ["C", last.close],
          ].map(([label, value]) => (
            <span key={label}>
              <b>{label}</b>{" "}
              <span className="number">{format(Number(value))}</span>
            </span>
          ))}
        </div>
        <div className="chart-viewport">
          <PriceChart candles={candles} type={type} cmf={cmf} />
        </div>
      </section>
      <div className="chart-facts">
        <div>
          <span>Khối lượng kỳ cuối</span>
          <strong className="number">
            {format(last.volume / 1e6, 1)} triệu CP
          </strong>
        </div>
        <div>
          <span>CMF kỳ cuối</span>
          <strong className={`number ${tone(last.cmf)}`}>
            {format(last.cmf)}
          </strong>
        </div>
        <div>
          <span>Khung đang xem</span>
          <strong>
            {timeframe === "1D"
              ? "Ngày"
              : timeframe === "1W"
                ? "Tuần"
                : "Tháng"}
          </strong>
        </div>
      </div>
    </>
  );
}
