"use client";
import { useState } from "react";
import { money, stamp } from "@/lib/api/contracts";
import { analysisMessages, analysisReason, type AnalysisReport } from "@/lib/api/analysis";
import TermHint from "./term-hint";

type Metrics = Record<string, unknown>;
const object = (value: unknown): Metrics => value && typeof value === "object" && !Array.isArray(value) ? value as Metrics : {};
const numeric = (value: unknown, suffix = "") => typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("vi-VN", { maximumFractionDigits: 3 }) + suffix : "—";
const cash = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? money(value) : "—";
const labels: Record<string, string> = {
  data_quality: "Chất lượng dữ liệu", liquidity: "Thanh khoản", distribution: "Phân phối lợi suất", statistics: "Hiệu suất & dòng tiền",
  arima: "ARIMA", garch: "GARCH & biến động", hmm: "HMM & Hurst", technical: "Kỹ thuật", context: "Bối cảnh thị trường và ngành",
  directional_alpha: "Tín hiệu có hướng", agreement: "Đồng thuận mô hình", simulation_risk: "Monte Carlo & rủi ro", costs: "Chi phí",
  trade_plan: "Rủi ro & kế hoạch vị thế", decision: "Quyết định", commentary: "Nhận định",
  stats: "Thống kê lợi suất", vol: "Trạng thái biến động", ac: "Tự tương quan", n: "Số quan sát", range: "Khoảng dữ liệu", date: "Thời điểm tính",
  mean_daily_pct: "Lợi suất trung bình ngày (%)", ann_mean_return_pct: "Lợi suất trung bình năm (%)", ann_return_pct: "Lợi suất năm (%)",
  total_return_pct: "Lợi suất toàn kỳ (%)", ann_vol_pct: "Biến động năm (%)", max_dd_pct: "Sụt giảm tối đa (%)", sharpe: "Sharpe", sortino: "Sortino", calmar: "Calmar",
  current: "Trạng thái hiện tại", prob_pct: "Xác suất trạng thái (%)", state_probs: "Xác suất các trạng thái", hurst: "Hurst", regime: "Chế độ", confidence: "Độ tin cậy",
  forecast_vol: "Biến động dự báo (%)", mc_path: "Các phân vị đường giá", median: "Trung vị", upper: "Biên trên", lower: "Biên dưới",
  sl: "Mức giá và dừng lỗ", pos: "Quy mô vị thế", sizing_mode: "Cách tính quy mô", entry: "Giá tham chiếu vào lệnh", sl_swing: "Dừng lỗ", tp1: "Mục tiêu 1", tp2: "Mục tiêu 2",
  shares: "Số cổ phiếu", value: "Giá trị vị thế", risk_budget_vnd: "Ngân sách rủi ro (VND)", max_loss: "Mức lỗ ước tính (VND)", pct_acct: "Tỷ trọng tài khoản (%)",
  net_forecast_pct: "Dự báo sau chi phí (%)", gross_forecast_pct: "Dự báo trước chi phí (%)", roundtrip_cost_pct: "Chi phí hai chiều (%)",
  ensemble_ret_pct: "Dự báo tổng hợp (%)", action: "Hành động", executable: "Đủ điều kiện thực thi", gate_pass: "Đạt điều kiện", reason_codes: "Lý do", score: "Điểm", rec: "Xếp hạng",
  summary: "Tóm tắt", detailed: "Nhận định chi tiết", sector: "Ngành", name: "Tên", trend: "Xu hướng", flow: "Dòng tiền", cross_corr: "Tương quan trong ngành",
};
const priceKeys = new Set(["entry", "sl_swing", "tp1", "tp2", "atr", "max_loss", "risk_per_share_vnd", "risk_budget_vnd"]);
const hiddenSeries = new Set(["_price_dates", "_price_close", "_mc_paths", "compatibility", "kelly", "meta_label"]);
const actions: Record<string, string> = { BUY_NOW: "Có tín hiệu mua", WATCH: "Theo dõi", AVOID: "Tránh mở vị thế", REFERENCE: "Tham chiếu", PERSONALIZED: "Theo vốn cá nhân" };

function MetricTree({ value, name = "", depth = 0 }: { value: unknown; name?: string; depth?: number }) {
  if (value == null) return <span>—</span>;
  if (typeof value === "number") return <span>{priceKeys.has(name) || name.endsWith("_vnd") ? cash(value) : numeric(value)}</span>;
  if (typeof value === "boolean") return <span>{value ? "Có" : "Không"}</span>;
  if (typeof value === "string") return <span className="whitespace-pre-line break-words">{actions[value] || value}</span>;
  if (Array.isArray(value)) return <details className="my-2"><summary className="cursor-pointer text-[var(--accent)]">{value.length} giá trị</summary><div className="max-h-72 overflow-auto pl-3">{value.map((entry, index) => <div key={index} className="my-1"><MetricTree value={entry} name={name} depth={depth+1}/></div>)}</div></details>;
  return <dl className={`min-w-0 ${depth ? "ml-3 border-l border-[var(--border)] pl-3" : ""}`}>{Object.entries(object(value)).filter(([key]) => !hiddenSeries.has(key)).map(([key, entry]) => <div key={key} className="my-3 min-w-0"><dt className="text-xs text-[var(--muted)]">{labels[key] || key.replaceAll("_", " ")}</dt><dd className="mt-1 min-w-0 break-words"><MetricTree value={entry} name={key} depth={depth+1}/></dd></div>)}</dl>;
}

function Values({ rows }: { rows: [string, string][] }) {
  return <dl className="my-5 grid grid-cols-2 gap-5 lg:grid-cols-4">{rows.map(([label, value]) => <div key={label}><dt className="text-xs text-[var(--muted)]">{label}</dt><dd className="mt-2 break-words font-mono text-lg">{value}</dd></div>)}</dl>;
}

function SeriesChart({ title, lines, unit = "VND" }: { title: string; lines: { label: string; values: unknown[]; color: string }[]; unit?: string }) {
  const values = lines.flatMap(line => line.values).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const length = Math.max(0, ...lines.map(line => line.values.length));
  if (values.length < 2 || length < 2) return <p className="my-3 text-sm text-[var(--muted)]">Chưa có chuỗi dữ liệu cho biểu đồ {title}.</p>;
  const low = Math.min(...values), high = Math.max(...values), span = high-low || Math.max(Math.abs(high)*0.01, 1);
  const y = (value: number) => 195-(value-low)/span*155;
  return <figure className="my-5 min-w-0 rounded-[4px] border border-[var(--border)] p-3"><figcaption className="text-sm">{title} · {unit}</figcaption>
    <svg viewBox="0 0 640 230" role="img" aria-label={title} className="mt-3 block h-auto w-full">
      {[0, 1, 2, 3].map(index => { const value = low+span*index/3; return <g key={index}><line x1="80" x2="625" y1={y(value)} y2={y(value)} stroke="var(--border)"/><text x="72" y={y(value)+4} fill="var(--muted)" fontSize="11" textAnchor="end">{numeric(value)}</text></g>; })}
      {lines.map(line => {
        let path = "", pen = false;
        line.values.forEach((value, index) => { if (typeof value !== "number" || !Number.isFinite(value)) { pen = false; return; } path += `${pen ? " L" : " M"}${80+index/(length-1)*545},${y(value)}`; pen = true; });
        return <path key={line.label} d={path} fill="none" stroke={line.color} strokeWidth="2"><title>{line.label}</title></path>;
      })}
      <text x="80" y="220" fill="var(--muted)" fontSize="11">Đầu chuỗi</text><text x="625" y="220" textAnchor="end" fill="var(--muted)" fontSize="11">Cuối chuỗi</text>
    </svg><div className="flex flex-wrap gap-4 text-xs">{lines.map(line => <span key={line.label} style={{ color: line.color }}>{line.label}</span>)}</div>
  </figure>;
}

function Section({ name, report, compact }: { name: string; report: AnalysisReport; compact: boolean }) {
  const [open, setOpen] = useState(!compact && ["statistics", "hmm", "garch", "simulation_risk", "trade_plan"].includes(name)), section = report.sections[name];
  if (!section) return null;
  const metrics = section.metrics, simulation = object(metrics.simulation_risk), paths = object(simulation.mc_path);
  const garch = object(object(metrics.garch).garch);
  const prices = report.sections.statistics?.metrics._price_close;
  return <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="quant-report-section min-w-0 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-4">
    <summary className="cursor-pointer py-5"><strong>{labels[name] || name}</strong><span className="ml-3 text-xs text-[var(--muted)]">{section.status === "AVAILABLE" ? "Có dữ liệu" : section.status === "DISABLED" ? "Không sử dụng" : "Chưa khả dụng"}</span></summary>
    {open && <div className="pb-5 text-sm leading-7">
      {section.status !== "AVAILABLE" && <p>{section.reason_codes.map(analysisReason).join(" ")}</p>}
      {name === "statistics" && Array.isArray(prices) && <SeriesChart title={`Lịch sử giá đóng cửa ${report.symbol}`} lines={[{ label: "Đóng cửa", values: prices, color: "var(--accent)" }]}/>}
      {name === "simulation_risk" && <><SeriesChart title={`Phân vị đường giá ${report.symbol}`} lines={[["median", "Trung vị", "var(--accent)"], ["upper", "Biên trên", "var(--positive)"], ["lower", "Biên dưới", "var(--negative)"]].map(([key, label, color]) => ({ label, color, values: Array.isArray(paths[key]) ? paths[key] as unknown[] : [] }))}/><p className="text-xs text-[var(--muted)]">Các đường là phân vị được trả trong báo cáo. Chưa có dữ liệu cho góc nhìn đường mô phỏng riêng lẻ/3D.</p></>}
      {name === "garch" && Array.isArray(garch.forecast_vol) && <SeriesChart title="Biến động dự báo GARCH" unit="%" lines={[{ label: "Biến động dự báo", values: garch.forecast_vol, color: "var(--accent)" }]}/>}
      {name === "hmm" && <p>Trạng thái: {String(object(metrics.hmm).current || "—")} · Xác suất trạng thái: {numeric(object(metrics.hmm).prob_pct, "%")}</p>}
      <details><summary className="cursor-pointer text-[var(--accent)]">Chỉ tiêu chi tiết</summary><MetricTree value={metrics}/></details>
    </div>}
  </details>;
}

export function LiveQuantReport({ report, compact = false, showAction = true }: { report: AnalysisReport; compact?: boolean; showAction?: boolean }) {
  const statistics = object(report.sections.statistics?.metrics.stats), costs = object(report.sections.costs?.metrics.costs), stops = object(report.sections.trade_plan?.metrics.sl);
  const ordered = ["statistics", "hmm", "directional_alpha", "garch", "simulation_risk", "trade_plan", "agreement", "costs", "technical", "context", "distribution", "arima", "liquidity", "data_quality", "decision", "commentary"];
  const action = String(report.decision.action || "");
  return <div className={`quant-report grid min-w-0 gap-4 ${compact ? "is-compact" : ""}`}>
    <div className="text-sm leading-7 text-[var(--muted)]"><p>Phiên dữ liệu: {report.target_session || report.data_as_of.slice(0,10)} · Phân tích lúc {stamp(report.evaluated_at)}</p>
      {report.data_observed_at && <p>Thu thập dữ liệu lúc {stamp(report.data_observed_at)}</p>}</div>
    {showAction && <section aria-label="Hành động" className="rounded-[4px] border-l-2 border-[var(--accent)] bg-[var(--raised)] p-5"><h3 className="mb-3 font-semibold">{actions[action] || action || "Chưa có quyết định"}</h3>
      {report.decision.executable === false && <p className="mb-3 text-sm">Chưa đủ điều kiện thực thi theo bộ kiểm tra của báo cáo.</p>}
      <p className="whitespace-pre-line text-sm leading-7">{report.commentary.summary}</p>
      {Array.isArray(report.decision.reason_codes) && <ul className="mt-3 list-inside list-disc text-xs leading-6">{report.decision.reason_codes.map((reason, index) => <li key={index}>{analysisMessages[String(reason)] || String(reason)}</li>)}</ul>}
    </section>}
    <Values rows={[["Sharpe", numeric(statistics.sharpe)], ["Sụt giảm tối đa", numeric(statistics.max_dd_pct, "%")], ["Biến động năm", numeric(statistics.ann_vol_pct, "%")], ["Dự báo sau chi phí", numeric(costs.net_forecast_pct, "%")]]}/>
    <Values rows={[["Giá tham chiếu vào lệnh", cash(stops.entry)], ["Dừng lỗ", cash(stops.sl_swing)], ["Mục tiêu 1", cash(stops.tp1)], ["Mục tiêu 2", cash(stops.tp2)]]}/>
    <p className="text-xs text-[var(--muted)]">Giá hiển thị theo VND. <TermHint id="monte_carlo">Monte Carlo</TermHint>, <TermHint id="hmm">HMM</TermHint> và <TermHint id="garch">GARCH</TermHint> được đọc cùng điều kiện và cảnh báo của báo cáo.</p>
    {!!report.warnings.length && <ul className="rounded-[4px] border border-[var(--border)] p-4 text-xs leading-6">{report.warnings.map((warning, index) => <li key={index}>{analysisReason(warning)}</li>)}</ul>}
    {ordered.map(name => <Section key={name} name={name} report={report} compact={compact}/>)}
    <details className="text-xs leading-6"><summary className="cursor-pointer">Phiên bản dữ liệu và mô hình</summary><MetricTree value={report.versions}/></details>
  </div>;
}
