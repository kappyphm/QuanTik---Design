"use client";
import { tw } from "@/lib/tailwind";
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
        if (!element || !supported)
            return;
        element.replaceChildren();
        setStatus("loading");
        const inner = document.createElement("div");
        inner.className = tw("tradingview-widget-container__widget");
        inner.style.height = "100%";
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.async = true;
        script.textContent = config;
        let active = true;
        script.onerror = () => {
            if (active)
                setStatus("error");
        };
        const observer = new MutationObserver(() => {
            if (element.querySelector("iframe"))
                setStatus("embedded");
        });
        observer.observe(element, { childList: true, subtree: true });
        const timer = setTimeout(() => {
            if (active && !element.querySelector("iframe"))
                setStatus("error");
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
    if (!supported)
        return <div className="chart-placeholder [min-height:440px] flex flex-col items-center justify-center [gap:16px] [color:var(--muted)] [margin:0_24px_24px] [border-width:1px] [border-style:dashed] [border-color:var(--border)] [border-radius:4px] [background-image:linear-gradient(var(--border)_1px,_transparent_1px),_linear-gradient(90deg,_var(--border)_1px,_transparent_1px)] [background-size:72px_72px] [background-color:var(--background)] [&_strong]:[color:var(--text)] [&_strong]:[font-weight:500] [&_strong]:[font-size:18px] [&_strong]:[background:var(--background)] [&_strong]:[padding:4px_12px] [&_>_span]:[background:var(--background)] [&_>_span]:[padding:4px_12px] max-[700px]:[margin:0_16px_16px] max-[700px]:[min-height:340px]"><strong>Chưa có sàn cho {symbol}</strong></div>;
    return <div className="tradingview-frame relative [height:560px] [margin:0_16px_16px] max-[700px]:[height:450px] max-[700px]:[margin:0_0_12px]" aria-label={`TradingView ${exchange}:${symbol}`}>
    {status !== "embedded" && <div className="widget-status absolute [inset:0] flex flex-col items-center justify-center [gap:14px] [color:var(--muted)] [pointer-events:none] [&_button]:[pointer-events:auto]" role="status">
      <p>{status === "loading" ? "Đang tải TradingView…" : "Không tải được TradingView."}</p>
      {status === "error" && <button className="button secondary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[background:var(--surface)] [.button&]:[border-color:var(--border)] [.button&]:[color:var(--text)] [.button&:hover]:[background:var(--raised)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" onClick={() => setRetry((value) => value + 1)}>Thử lại</button>}
    </div>}
    <div ref={host} className="tradingview-widget-container h-full w-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:[border-width:0]"/>
  </div>;
}
