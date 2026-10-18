"use client";
import { useId, useState } from "react";
import { stamp } from "@/lib/api/contracts";
import { analysisReason, type AnalysisReport } from "@/lib/api/analysis";
import { at, metricText, moduleGuides, moduleReading, number, record, researchFor } from "@/lib/quant-reader";
import { QuantResearchVisuals } from "./quant-research";
import TermHint from "./term-hint";
import { SimpleQuantReport } from "./quant-simple-report";
import styles from "./quant-simple.module.css";

const card = "min-w-0 rounded border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6";
const ordered = ["statistics", "distribution", "arima", "garch", "hmm", "technical", "directional_alpha", "context", "agreement", "simulation_risk", "costs", "trade_plan", "liquidity", "data_quality", "decision", "commentary"];
const terms: Record<string, string> = { hmm: "hmm", garch: "garch", simulation_risk: "monte_carlo", agreement: "agreement", trade_plan: "risk_reward", statistics: "sharpe" };
function Values({ rows }: { rows: [string, string][] }) {
  return <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">{rows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs leading-5 text-[var(--muted)]">{label}</dt><dd className="mt-2 break-words font-mono text-lg leading-7">{value}</dd></div>)}</dl>;
}

function Module({ name, report, compact, id }: { name: string; report: AnalysisReport; compact: boolean; id: string }) {
  const [open, setOpen] = useState(!compact), section = report.sections[name], guide = moduleGuides[name];
  if (!section || !guide) return null;
  const metrics = guide.metrics.map(([label, path, unit]) => [label, metricText(at(section.metrics, path), unit)] as [string, string]);
  const children = Object.values(section.metrics).flatMap(v => [record(v), ...Object.values(record(v)).map(record)]);
  const failed = children.some(v => v.error || v.available === false), fallback = children.some(v => v.method === "fallback");
  const label = section.status === "DISABLED" ? "Đã tắt" : section.status === "UNAVAILABLE" ? "Chưa khả dụng" : fallback ? "Phương pháp thay thế" : failed ? "Kết quả một phần" : "Có dữ liệu";
  const hasMetrics = metrics.some(([, value]) => value !== "—"), narrative = name === "commentary" ? report.commentary.detailed || report.commentary.summary : null;
  return <details id={id} open={open} onToggle={e => setOpen(e.currentTarget.open)} className="quant-report-section min-w-0 scroll-mt-6 rounded border border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6">
    <summary className="cursor-pointer py-5 marker:text-[var(--accent)]"><span className="ml-1 inline-flex w-[calc(100%-24px)] flex-wrap items-center justify-between gap-3 align-top"><strong className="text-base font-medium">{guide.title}</strong><span className="text-xs text-[var(--muted)]">{label}</span></span></summary>
    {open && <div className="grid gap-5 border-t border-[var(--border)] py-5 text-sm leading-7">
      <div><h4 className="font-medium">1. Đây là gì, dùng để hiểu điều gì?</h4><p className="mt-1 text-[var(--muted)]">{terms[name] ? <TermHint id={terms[name]}>{guide.title}</TermHint> : guide.title}: {guide.definition}</p></div>
      <div><h4 className="font-medium">2. Đầu vào và điều kiện để sử dụng</h4><p className="mt-1 text-[var(--muted)]">{guide.inputs}</p></div>
      <div><h4 className="mb-4 font-medium">3. Kết quả đang nói điều gì?</h4>
        {section.status !== "AVAILABLE" && <p role="status" className="mb-4 text-[var(--muted)]">{section.reason_codes.map(analysisReason).join(" ")}</p>}
        {fallback && <p className="mb-4 text-[var(--muted)]">Mô hình sử dụng phương pháp thay thế; không coi là HMM đã fit thành công.</p>}
        {failed && <p className="mb-4 text-[var(--muted)]">Một số thành phần chưa khả dụng. Chỉ đọc các chỉ tiêu có kết quả bên dưới.</p>}
        {hasMetrics ? <><p className="mb-5 text-[var(--muted)]">{moduleReading(name, section.metrics)}</p><Values rows={metrics}/></> : !narrative && <p className="text-[var(--muted)]">Chưa có chỉ tiêu đã xác nhận cho mục này.</p>}
        {narrative && <p className="whitespace-pre-line text-[var(--muted)]">{narrative}</p>}
        {name === "hmm" && <div className="mt-5 grid gap-3">{[["BULL", "var(--positive)"], ["SIDEWAY", "var(--neutral)"], ["BEAR", "var(--negative)"]].map(([state, color]) => {
          const probability = at(section.metrics, `hmm.state_probs.${state}`);
          return typeof probability === "number" && Number.isFinite(probability) ? <div key={state} className="grid grid-cols-[80px_1fr_60px] items-center gap-3 text-xs"><span>{state}</span><div className="h-5 overflow-hidden rounded-sm bg-[var(--raised)]"><div style={{ width: `${Math.max(0, Math.min(100, probability))}%`, background: color }} className="h-full opacity-70"/></div><span className="text-right font-mono">{number(probability, "%")}</span></div> : null;
        })}</div>}
      </div>
      <div><h4 className="font-medium">4. Vì sao xuất hiện kết quả này?</h4><p className="mt-1 text-[var(--muted)]">{guide.why}</p></div>
      <div className="border-l-2 border-[var(--accent)] pl-4"><h4 className="font-medium">5. Ghép với mô hình khác và dùng trong quyết định</h4><p className="mt-1 text-[var(--muted)]">{guide.connection}</p></div>
    </div>}
  </details>;
}

export function LiveQuantReport({ report, compact = false, showAction = true }: { report: AnalysisReport; compact?: boolean; showAction?: boolean }) {
  const uid = useId().replaceAll(":", ""), [advancedOpen, setAdvancedOpen] = useState(false);
  const research = researchFor(report), sectionId = (name: string) => `${uid}-quant-${name}`;
  return <div className={`quant-report grid min-w-0 gap-5 ${compact ? "is-compact" : ""}`}>
    <SimpleQuantReport report={report} showAction={showAction} compact={compact}/>
    {(report.commentary.summary || report.commentary.detailed) && <details className={styles.advanced}>
      <summary>Đọc nhận định đầy đủ</summary><div className={styles.advancedBody}><p className="whitespace-pre-line text-sm leading-7 text-[var(--muted)]">{report.commentary.summary}</p>{report.commentary.detailed && <p className="whitespace-pre-line text-sm leading-7 text-[var(--muted)]">{report.commentary.detailed}</p>}</div>
    </details>}
    <details className={styles.advanced} open={advancedOpen} onToggle={event => setAdvancedOpen(event.currentTarget.open)}>
      <summary>Xem phân tích chuyên sâu</summary>
      {advancedOpen && <div className={styles.advancedBody}>
        <p className="text-sm leading-7 text-[var(--muted)]">Tại đây có chỉ tiêu, cách đọc, điều kiện áp dụng và bảng dữ liệu của từng mô hình. Mở mục bạn muốn tìm hiểu.</p>
        <section className={card}><h3 className="mb-3 font-medium">Dữ liệu của lần phân tích</h3><p className="text-sm leading-7 text-[var(--muted)]">{metricText(research.observations ?? at(report.sections.statistics?.metrics, "n"))} phiên dữ liệu · {research.start && research.end ? `${research.start} → ${research.end}` : metricText(at(report.sections.statistics?.metrics, "range"))} · Giá theo VND</p>{report.data_observed_at && <p className="mt-2 text-xs text-[var(--muted)]">Thu thập dữ liệu lúc {stamp(report.data_observed_at)}</p>}</section>
        <section aria-label="Phân tích từng module" className="grid min-w-0 gap-3">
          <h3 className="text-lg font-medium">Chi tiết mô hình và số liệu</h3>
          {ordered.map(name => <Module key={name} name={name} report={report} compact id={sectionId(name)}/>)}</section>
        <QuantResearchVisuals report={report}/>
        {!!report.warnings.length && <section className={card}><h3 className="font-medium">Giới hạn của báo cáo</h3><ul className="mt-3 list-inside list-disc text-sm leading-7 text-[var(--muted)]">{report.warnings.map((warning, i) => <li key={i}>{analysisReason(warning)}</li>)}</ul></section>}
        <details className={`${card} text-xs leading-7 text-[var(--muted)]`}><summary className="cursor-pointer">Phiên bản dữ liệu và mô hình</summary><dl className="mt-3">{Object.entries(report.versions).filter(([, value]) => typeof value === "string" || typeof value === "number").map(([key, value]) => <div key={key} className="my-2 break-all"><dt>{key}</dt><dd className="font-mono">{String(value)}</dd></div>)}</dl></details>
      </div>}
    </details>
  </div>;
}
