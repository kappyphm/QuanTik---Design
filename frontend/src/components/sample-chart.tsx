"use client";
import { useEffect, useRef, useState } from "react";
import { getDemoCandles, format } from "@/lib/mock-data";
export function SampleChart({ symbol, interval }: {
    symbol: string;
    interval: string;
}) {
    const candles = getDemoCandles(symbol, interval);
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(640);
    const [hover, setHover] = useState<number | null>(null);
    useEffect(() => {
        const element = ref.current;
        if (!element)
            return;
        const observer = new ResizeObserver(() => setWidth(Math.max(280, element.clientWidth)));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    useEffect(() => setHover(null), [symbol, interval]);
    if (!candles.length)
        return <div className="chart-placeholder [min-height:440px] flex flex-col items-center justify-center [gap:16px] [color:var(--muted)] [margin:0_24px_24px] [border-width:1px] [border-style:dashed] [border-color:var(--border)] [border-radius:4px] [background-image:linear-gradient(var(--border)_1px,_transparent_1px),_linear-gradient(90deg,_var(--border)_1px,_transparent_1px)] [background-size:72px_72px] [background-color:var(--background)] [&_strong]:[color:var(--text)] [&_strong]:[font-weight:500] [&_strong]:[font-size:18px] [&_strong]:[background:var(--background)] [&_strong]:[padding:4px_12px] [&_>_span]:[background:var(--background)] [&_>_span]:[padding:4px_12px] max-[700px]:[margin:0_16px_16px] max-[700px]:[min-height:340px]">Chưa có nến mẫu cho {symbol}</div>;
    const low = Math.min(...candles.map((c) => c.low));
    const high = Math.max(...candles.map((c) => c.high));
    const padding = Math.max((high - low) * .12, .1);
    const bottom = low - padding, top = high + padding;
    const plotWidth = width - 82;
    const step = plotWidth / candles.length;
    const x = (index: number) => 12 + step * (index + .5);
    const y = (price: number) => 26 + (top - price) / (top - bottom) * 266;
    const maxVolume = Math.max(...candles.map((c) => c.volume));
    const current = candles[Math.min(hover ?? candles.length - 1, candles.length - 1)];
    return <div className="sample-chart min-w-0 [margin:12px_16px_20px]" ref={ref}>
    <div className="sample-chart-head flex flex-wrap justify-between [gap:8px] [font-size:14px] [padding:12px_0] [&_strong]:[font-weight:500] [&_span]:[color:var(--muted)]"><strong>Nến mẫu · {symbol} · {interval}</strong><span>Giá: nghìn ₫ · không phải TradingView</span></div>
    <div className="sample-ohlc number [font-family:var(--font-mono),_ui-monospace,_monospace] [font-variant-numeric:tabular-nums] [letter-spacing:-0.025em] [color:var(--muted)] [font-size:14px] [line-height:1.7] [padding:0_0_10px] [overflow-wrap:anywhere]">O {format(current.open)} · H {format(current.high)} · L {format(current.low)} · C {format(current.close)} · KL {format(current.volume, 0)}</div>
    <svg viewBox={`0 0 ${width} 398`} role="img" aria-label={`Biểu đồ nến mô phỏng ${symbol}, ${candles.length} phiên mẫu`} className="sample-chart-svg block w-full [height:auto]">
      <title>Nến và khối lượng mô phỏng, chỉ dùng kiểm tra giao diện</title>
      {[0, 1, 2, 3, 4].map((index) => { const price = bottom + (top - bottom) * index / 4; return <g key={index}><line x1="12" x2={width - 70} y1={y(price)} y2={y(price)} stroke="var(--border)"/><text x={width - 8} y={y(price) + 5} textAnchor="end" fill="var(--muted)" fontSize="13">{format(price)}</text></g>; })}
      {candles.map((c, index) => {
            const color = c.close >= c.open ? "var(--positive)" : "var(--negative)";
            const bodyWidth = Math.max(2, Math.min(12, step * .62));
            return <g key={index} onPointerEnter={() => setHover(index)} onClick={() => setHover(index)}>
          <rect x={x(index) - step / 2} y="20" width={step} height="340" fill="transparent"/>
          <line x1={x(index)} x2={x(index)} y1={y(c.high)} y2={y(c.low)} stroke={color}/>
          <rect x={x(index) - bodyWidth / 2} y={Math.min(y(c.open), y(c.close))} width={bodyWidth} height={Math.max(1, Math.abs(y(c.open) - y(c.close)))} fill={color}/>
          <rect x={x(index) - bodyWidth / 2} y={356 - c.volume / maxVolume * 40} width={bodyWidth} height={c.volume / maxVolume * 40} fill={color} opacity=".45"/>
        </g>;
        })}
      {(width < 450 ? [0, candles.length - 1] : [0, Math.floor(candles.length / 2), candles.length - 1]).map((index) => <text key={index} x={x(index)} y="382" textAnchor={index === 0 ? "start" : index === candles.length - 1 ? "end" : "middle"} fill="var(--muted)" fontSize="13">Phiên mẫu {index + 1}</text>)}
    </svg>
  </div>;
}
