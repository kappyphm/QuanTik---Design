"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChartCandlestick, PanelRightClose, PanelRightOpen } from "lucide-react";
import { stocks, getStock, chartOptions, demoEnabled } from "@/lib/mock-data";
import { PageHeading, EmptyState } from "./ui";
import { TradingViewChart } from "./tradingview-chart";
import { QuantPanel } from "./quant-panel";
import { SampleChart } from "./sample-chart";

export function ChartWorkspace() {
  const router = useRouter();
  const symbol = (useSearchParams().get("symbol") ?? "FPT").toUpperCase();
  return <><PageHeading title="Biểu đồ" /><ChartSurface key={symbol} symbol={symbol} onSymbolChange={(next) => router.replace(`/charts?symbol=${next}`)} /></>;
}
export function ChartSurface({ symbol, onSymbolChange }: { symbol: string; onSymbolChange: (symbol: string) => void }) {
  const stock = getStock(symbol);
  const [source, setSource] = useState(demoEnabled ? "Dữ liệu mẫu" : "TradingView");
  const [timeframe, setTimeframe] = useState("1D");
  const [indicators, setIndicators] = useState<string[]>(["SMA", "RSI"]);
  const [sidebar, setSidebar] = useState(true);
  if (!stock) return <EmptyState title="Chọn mã cổ phiếu"><Link className="text-link" href="/dashboard">Dashboard →</Link></EmptyState>;
  return <section className="chart-workspace">
    <div className="chart-controls">
      <label><span className="sr-only">Chọn mã biểu đồ</span><select aria-label="Chọn mã biểu đồ" className="symbol-select" value={symbol} onChange={(event) => onSymbolChange(event.target.value)}>{stocks.map((item) => <option key={item.symbol}>{item.symbol}</option>)}</select></label>
      <label><span className="sr-only">Nguồn biểu đồ</span><select aria-label="Nguồn biểu đồ" value={source} onChange={(event) => { setSource(event.target.value); if (event.target.value !== "TradingView") setTimeframe("1D"); }}>{chartOptions.sources.map((name) => <option key={name}>{name}</option>)}</select></label>
      <label><span className="sr-only">Khung thời gian</span><select aria-label="Khung thời gian" value={timeframe} onChange={(event) => setTimeframe(event.target.value)}>{(source === "TradingView" ? chartOptions.intervals : ["1D","1W","1M"]).map((interval) => <option key={interval}>{interval}</option>)}</select></label>
      <div className="chart-view-actions">
        <Link className="button secondary" href={`/analysis?symbol=${symbol}`}>Mở Quant toàn màn hình ↗</Link>
        <button className="button secondary" aria-pressed={sidebar} onClick={() => setSidebar(!sidebar)}>{sidebar ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}{sidebar ? "Thu phân tích" : "Mở phân tích bên chart"}</button>
      </div>
    </div>
    <div className={`chart-split ${sidebar ? "with-quant" : ""}`}>
      <div className="chart-main">
        <div className="chart-stock-heading"><div><h2>{symbol}<span>{stock.name}</span></h2></div><span className="muted">{stock.exchange}</span></div>
        {source === "TradingView" && <div className="chart-indicators" role="group" aria-label="Chỉ báo">
          {chartOptions.indicators.map((indicator) => <button className={`button secondary ${indicators.includes(indicator) ? "is-saved" : ""}`} key={indicator} aria-pressed={indicators.includes(indicator)} onClick={() => setIndicators((items) => items.includes(indicator) ? items.filter((item) => item !== indicator) : [...items, indicator])}>{indicator}</button>)}
        </div>}
        {source === "Dữ liệu mẫu" ? <SampleChart symbol={symbol} interval={timeframe} /> : source === "TradingView" ? <TradingViewChart symbol={symbol} exchange={stock.exchange} interval={timeframe} indicators={indicators} /> : <div className="chart-placeholder"><ChartCandlestick size={36} aria-hidden="true" /><strong>Chưa có dữ liệu Quantik</strong></div>}
      </div>
      {sidebar && <aside className="chart-quant" aria-label={`Phân tích bên chart ${symbol}`}><QuantPanel key={symbol} symbol={symbol} compact /></aside>}
    </div>
  </section>;
}
