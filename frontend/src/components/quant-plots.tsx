"use client";
import { useEffect, useRef, useState } from "react";
import { format, type AnalysisVisuals } from "@/lib/mock-data";

function usePlotWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(180, el.clientWidth)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export function QuantPlot({ report, kind }: { report: AnalysisVisuals; kind: "cone" | "regime" | "volatility" }) {
  const { ref, width } = usePlotWidth();
  const [hover, setHover] = useState<number | null>(null);
  const rows = kind === "cone" ? report.monteCarlo.cone.map(p => ({ session: p.session, value: p.p50, low: p.p05, high: p.p95, innerLow: p.p25, innerHigh: p.p75, state: "" }))
    : kind === "regime" ? report.hmm.history.map(p => ({ session: p.session, value: p.price, low: p.price, high: p.price, innerLow: p.price, innerHigh: p.price, state: p.state }))
    : report.garch.volatility.map(p => ({ session: p.session, value: p.valuePct, low: p.valuePct, high: p.valuePct, innerLow: p.valuePct, innerHigh: p.valuePct, state: "" }));
  const min = Math.min(...rows.map(p => p.low)), max = Math.max(...rows.map(p => p.high));
  const pad = Math.max((max - min) * .12, .1), low = min - pad, high = max + pad;
  const left = 58, right = width - 16, top = 30, bottom = 214;
  const x = (i: number) => left + i / (rows.length - 1) * (right - left);
  const y = (v: number) => bottom - (v - low) / (high - low) * (bottom - top);
  const line = (key: "value" | "low" | "high" | "innerLow" | "innerHigh") => rows.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  const band = (a: "low" | "innerLow", b: "high" | "innerHigh") => `${line(b)} ${rows.map((p, i) => `${x(i)},${y(p[a])}`).reverse().join(" ")}`;
  const index = hover == null ? rows.length - 1 : Math.min(hover, rows.length - 1), current = rows[index];
  const unit = kind === "volatility" ? "% / phiên" : "nghìn ₫";
  const title = kind === "cone" ? "Dải giá Monte Carlo" : kind === "regime" ? "Giá và trạng thái HMM" : "Biến động có điều kiện GARCH";
  const stateColor = (state: string) => state === "bull" ? "var(--positive)" : state === "bear" ? "var(--negative)" : "var(--neutral)";
  return <div className="quant-plot" ref={ref}>
    <div className="quant-plot-readout"><span>Phiên {kind === "cone" ? "+" : ""}{current.session}</span><strong>{format(current.value)} {unit}</strong>{kind === "cone" && <span>P05–P95: {format(current.low)}–{format(current.high)}</span>}{kind === "regime" && <span>{current.state.toUpperCase()}</span>}</div>
    <svg viewBox={`0 0 ${width} 260`} role="img" aria-label={`${title} ${report.symbol}, dữ liệu mô phỏng`} className="quant-plot-svg"
      onPointerMove={event => { const box = event.currentTarget.getBoundingClientRect(); const px = (event.clientX - box.left) / box.width * width; setHover(Math.max(0, Math.min(rows.length - 1, Math.round((px - left) / (right - left) * (rows.length - 1))))); }} onPointerLeave={() => setHover(null)}>
      <title>{title} · {unit} · fixture mô phỏng</title>
      <text x={left} y="16" fill="var(--muted)" fontSize="13">{unit}</text>
      {[0, 1, 2, 3].map(i => { const value = low + (high - low) * i / 3; return <g key={i}><line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="var(--border)" /><text x={left - 9} y={y(value) + 4} textAnchor="end" fill="var(--muted)" fontSize="13">{format(value, 1)}</text></g>; })}
      {kind === "regime" && rows.map((p, i) => { const step = (right - left) / (rows.length - 1), start = Math.max(left, x(i) - step / 2), end = Math.min(right, x(i) + step / 2); return <rect key={i} x={start} y={top} width={end - start} height={bottom - top} fill={stateColor(p.state)} opacity=".13" />; })}
      {kind === "cone" && <><polygon points={band("low", "high")} fill="var(--positive)" opacity=".10" /><polygon points={band("innerLow", "innerHigh")} fill="var(--positive)" opacity=".23" /></>}
      <polyline points={line("value")} fill="none" stroke={kind === "regime" ? "var(--text)" : "var(--accent)"} strokeWidth="2" strokeLinejoin="round" />
      {hover != null && <><line x1={x(index)} x2={x(index)} y1={top} y2={bottom} stroke="var(--muted)" opacity=".6" /><circle cx={x(index)} cy={y(current.value)} r="4" fill="var(--accent)" /></>}
      {[0, rows.length - 1].map(i => <text key={i} x={x(i)} y="242" textAnchor={i ? "end" : "start"} fill="var(--muted)" fontSize="13">{kind === "cone" ? "+" : ""}{rows[i].session} phiên</text>)}
    </svg>
    <div className="quant-plot-legend">{kind === "cone" ? <><span><i className="cone-wide" />P05–P95</span><span><i className="cone-inner" />P25–P75</span><span><i className="median" />Trung vị P50</span></> : kind === "regime" ? <><span><i className="bull" />Tăng</span><span><i className="sideways" />Đi ngang</span><span><i className="bear" />Giảm</span></> : <span>Biến động ngày; không biểu thị hướng giá</span>}</div>
  </div>;
}

export function QuantDistribution({ report }: { report: AnalysisVisuals }) {
  const { ref, width } = usePlotWidth();
  const [active, setActive] = useState<number | null>(null);
  const rows = report.monteCarlo.distribution, max = Math.max(...rows.map(p => p.probabilityPct), 1);
  const left = 40, right = width - 16, bottom = 190, step = (right - left) / rows.length;
  const current = active == null ? null : rows[active];
  return <div className="quant-plot" ref={ref}>
    <div className="quant-plot-readout">{current ? `Lợi suất ${format(current.returnPct)}% · ${format(current.probabilityPct, 1)}% kịch bản mẫu` : "Lợi suất cuối kỳ · 20 phiên mẫu"}</div>
    <svg className="quant-plot-svg" viewBox={`0 0 ${width} 242`} role="img" aria-label={`Phân phối lợi suất cuối kỳ ${report.symbol}, dữ liệu mô phỏng`}>
      <text x={left} y="17" fill="var(--muted)" fontSize="13">Kịch bản (%)</text>
      {[0, .5, 1].map(t => <g key={t}><line x1={left} x2={right} y1={bottom - t * 150} y2={bottom - t * 150} stroke="var(--border)" /><text x={left - 8} y={bottom - t * 150 + 4} textAnchor="end" fill="var(--muted)" fontSize="13">{format(max * t, 0)}</text></g>)}
      {rows.map((p, i) => <g key={i} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} onClick={() => setActive(i)}><rect x={left + i * step + 2} y={bottom - p.probabilityPct / max * 150} width={Math.max(1, step - 4)} height={p.probabilityPct / max * 150} fill={p.returnPct < 0 ? "var(--negative)" : "var(--positive)"} opacity={active === i ? 1 : .65} /></g>)}
      {[0, rows.length - 1].map(i => <text key={i} x={left + (i + .5) * step} y="214" textAnchor={i ? "end" : "start"} fontSize="13" fill="var(--muted)">{format(rows[i].returnPct, 1)}%</text>)}
      <text x={(left + right) / 2} y="236" textAnchor="middle" fontSize="13" fill="var(--muted)">Lợi suất cuối kỳ (%)</text>
    </svg>
  </div>;
}
