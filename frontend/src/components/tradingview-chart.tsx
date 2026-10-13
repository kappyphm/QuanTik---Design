"use client";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "./preferences";

const studies: Record<string, string> = {
  SMA: "MASimple@tv-basicstudies",
  EMA: "MAExp@tv-basicstudies",
  RSI: "RSI@tv-basicstudies",
  MACD: "MACD@tv-basicstudies",
  "Bollinger Bands": "BB@tv-basicstudies",
  ATR: "ATR@tv-basicstudies",
};
const intervals: Record<string, string> = {
  "1m": "1", "5m": "5", "15m": "15", "30m": "30", "1h": "60", "4h": "240",
  "1D": "D", "1W": "W", "1M": "M",
};

export function TradingViewChart({ symbol, exchange, interval, indicators }: {
  symbol: string;
  exchange: string;
  interval: string;
  indicators: string[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const { theme } = usePreferences();
  const [status, setStatus] = useState("loading");
  const [retry, setRetry] = useState(0);
  const supported = ["HOSE", "HNX", "UPCOM"].includes(exchange);
  const config = JSON.stringify({
    locale: "vi_VN", theme, autosize: true, symbol: `${exchange}:${symbol}`,
    interval: intervals[interval] ?? "D", timezone: "Asia/Ho_Chi_Minh",
    style: "1", allow_symbol_change: false, hide_side_toolbar: false,
    hide_top_toolbar: false, hide_legend: false, hide_volume: false,
    details: false, save_image: true, calendar: false, withdateranges: true,
    studies: indicators.map((name) => studies[name]).filter(Boolean),
    support_host: "https://www.tradingview.com",
  });
  useEffect(() => {
    const element = host.current;
    if (!element || !supported) return;
    element.replaceChildren();
    setStatus("loading");
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = config;
    let active = true;
    script.onerror = () => { if (active) setStatus("error"); };
    const observer = new MutationObserver(() => {
      if (element.querySelector("iframe")) setStatus("embedded");
    });
    observer.observe(element, { childList: true, subtree: true });
    const timer = setTimeout(() => {
      if (active && !element.querySelector("iframe")) setStatus("error");
    }, 15000);
    element.append(inner, script);
    return () => {
      active = false;
      observer.disconnect();
      clearTimeout(timer);
      script.onerror = null;
      element.replaceChildren();
    };
  }, [config, supported, retry]);
  if (!supported) return <div className="chart-placeholder"><strong>Chưa có sàn cho {symbol}</strong></div>;
  return <div className="tradingview-frame" aria-label={`TradingView ${exchange}:${symbol}`}>
    {status !== "embedded" && <div className="widget-status" role="status">
      <p>{status === "loading" ? "Đang tải TradingView…" : "Không tải được TradingView."}</p>
      {status === "error" && <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>Thử lại</button>}
    </div>}
    <div ref={host} className="tradingview-widget-container" />
  </div>;
}
