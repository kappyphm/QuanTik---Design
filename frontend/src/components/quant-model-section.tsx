"use client";
import { useState } from "react";
import { analysisReason, type AnalysisReport, type ReportSection } from "@/lib/api/analysis";
import { at, metricText, moduleGuides, moduleReading, number, record } from "@/lib/quant-reader";
import { moduleMetricTerms } from "@/content/quant-module-terms";
import TermHint from "./term-hint";
import { QuantModuleEvidence } from "./quant-module-evidence";

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const signed = (v: unknown, unit = "") => finite(v) ? `${v > 0 ? "+" : ""}${number(v, unit)}` : "—";
const tone = (v: unknown) => finite(v) && v > 0 ? "text-[var(--positive)]" : finite(v) && v < 0 ? "text-[var(--negative)]" : "text-[var(--text)]";
const regimes: Record<string, string> = { PERSISTENT: "Có tính duy trì", MEAN_REVERTING: "Có tính hồi quy", RANDOM_WALK: "Gần ngẫu nhiên", UNCERTAIN: "Chưa rõ cấu trúc" };
const reasons: Record<string, string> = {
  regime_or_extreme_not_confirmed: "Điều kiện regime hoặc độ lệch phần dư chưa được xác nhận.",
  missing_market_sector_factors: "Thiếu dữ liệu nhân tố thị trường hoặc ngành để ước lượng phần dư.",
  insufficient_aligned_factors: "Chưa đủ quan sát đồng bộ giữa cổ phiếu và các nhân tố.",
  need_80_obs: "Chưa đủ 80 quan sát để phân tích phần dư.", need_65_obs: "Chưa đủ 65 quan sát để phân tích động lượng.",
  residual_regression_failed: "Chưa ước lượng được hồi quy phần dư.", insufficient_residual_history: "Lịch sử phần dư chưa đủ dài.",
};

// Preserve explicit zero/false, while hiding disabled or failed output objects.
export function readableMetrics(section?: ReportSection): Record<string, unknown> {
  if (!section || section.status === "DISABLED") return {};
  const clean = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(clean);
    if (!value || typeof value !== "object") return value;
    const data = record(value);
    if (data.error || data.disabled === true) return {};
    // Keep availability and reason visible, but not stale numerical predictions.
    if (data.available === false) return { available: false, reason: data.reason };
    return Object.fromEntries(Object.entries(data).map(([key, child]) => [key, clean(child)]));
  };
  return record(clean(section.metrics));
}

function ReadingScale({ value, centered, label }: { value: unknown; centered?: boolean; label: string }) {
  const low = centered ? -1 : 0, high = 1;
  if (!finite(value) || value < low || value > high) return <p className="mt-4 text-xs text-[var(--muted)]">Chưa có giá trị hợp lệ để vẽ thang đo.</p>;
  const x = 12 + (value - low) / (high - low) * 276, zero = centered ? 150 : 12;
  return <svg role="img" aria-label={label} viewBox="0 0 300 48" className="mt-4 block w-full">
    <title>{label}: {number(value)}</title>
    <line x1="12" y1="12" x2="288" y2="12" stroke="var(--border)" strokeWidth="5"/>
    {centered && <line x1={Math.min(zero, x)} y1="12" x2={Math.max(zero, x)} y2="12" stroke={value < 0 ? "var(--negative)" : "var(--positive)"} strokeWidth="5"/>}
    <line x1="150" y1="5" x2="150" y2="20" stroke="var(--muted)" strokeWidth="1"/>
    <circle cx={x} cy="12" r="5" fill={centered ? value < 0 ? "var(--negative)" : "var(--positive)" : "var(--accent)"}/>
    <text x="12" y="42" fill="var(--muted)" fontSize="10">{centered ? "−1" : "0"}</text><text x="150" y="42" fill="var(--muted)" fontSize="10" textAnchor="middle">{centered ? "0" : "0,5"}</text><text x="288" y="42" fill="var(--muted)" fontSize="10" textAnchor="end">{centered ? "+1" : "1"}</text>
  </svg>;
}

function Participation({ value }: { value: unknown }) {
  return <span>{value === true ? "Đang tham gia" : value === false ? "Chưa tham gia" : "Chưa công bố trạng thái tham gia"}</span>;
}

function AlphaEvidence({ report, metrics, agreementId, compact }: { report: AnalysisReport; metrics: Record<string, unknown>; agreementId?: string; compact: boolean }) {
  const momentum = record(metrics.momentum_alpha), hurst = record(metrics.hurst), lgbm = record(metrics.lightgbm_cross_sectional), residual = record(metrics.conditional_mr);
  const forecast = lgbm.available === true ? lgbm.proj_pct : undefined;
  const sourceHorizon = finite(lgbm.horizon_sessions) ? lgbm.horizon_sessions : finite(lgbm.horizon) ? lgbm.horizon : undefined;
  const windows = Array.isArray(hurst.windows) ? hurst.windows.map(record).filter(v => finite(v.window) && finite(v.hurst) && v.hurst >= 0 && v.hurst <= 1) : [];
  const components = record(momentum.components), regime = typeof hurst.regime === "string" ? hurst.regime : "";
  const momRead = finite(momentum.score) ? momentum.score > 0 ? "Momentum dương" : momentum.score < 0 ? "Momentum âm" : "Momentum trung tính" : "Momentum chưa có kết quả";
  const forecastRead = finite(forecast) ? `LightGBM dự báo ${signed(forecast, "%")}` : "LightGBM chưa có dự báo khả dụng";
  const residualReason = typeof residual.reason === "string" ? reasons[residual.reason] : undefined;
  const agreement = readableMetrics(report.sections.agreement), fcast = record(agreement.fcast);
  return <div className="grid min-w-0 gap-5">
    <div className="max-w-4xl"><p className="text-[10px] font-medium tracking-widest text-[var(--accent)]">KẾT QUẢ CỦA {report.symbol}</p><h4 className="mt-2 text-lg font-medium leading-8">{momRead}; {forecastRead}.</h4><p className="mt-2 text-xs leading-6 text-[var(--muted)]">Hurst: {regimes[regime] || regime || "chưa có nhãn regime"}. Cấu trúc chuỗi và hướng dự báo được đọc riêng.</p></div>
    <div className={`grid min-w-0 gap-3 ${compact ? "" : "xl:grid-cols-3"}`}>
      <article aria-label="Bằng chứng Momentum" className="min-w-0 rounded border border-[var(--border)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><h5 className="font-medium"><TermHint id="module_momentum">Momentum</TermHint></h5><span className="text-[var(--muted)]">Điểm có dấu</span></div>
        <p data-alpha-value="momentum" className={`mt-4 font-mono text-2xl ${tone(momentum.score)}`}>{signed(momentum.score)}</p><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">Thang −1 đến +1 · không phải % lợi nhuận</p>
        <ReadingScale centered value={momentum.score} label="Điểm Momentum trên thang −1 đến +1"/>
        <p className="mt-3 text-xs text-[var(--muted)]"><TermHint id="module_lightgbm_available"><Participation value={momentum.active}/></TermHint></p>
        <div className="mt-4 border-t border-[var(--border)] pt-3"><p className="mb-2 text-[10px] text-[var(--muted)]"><TermHint id="module_momentum_windows">Lợi suất đã quan sát</TermHint></p><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">{[5, 10, 20, 60].map(n => <div key={n}><dt className="text-[10px] text-[var(--muted)]">{n} phiên</dt><dd className="mt-1 font-mono">{signed(components[`ret_${n}d_pct`], "%")}</dd></div>)}</dl></div>
      </article>
      <article aria-label="Bằng chứng Hurst" className="min-w-0 rounded border border-[var(--border)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><h5 className="font-medium"><TermHint id="module_hurst">Hurst</TermHint></h5><span className="text-[var(--muted)]">Cấu trúc chuỗi</span></div>
        <p data-alpha-value="hurst" className="mt-4 font-mono text-2xl">{number(hurst.hurst)}</p><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]"><TermHint id="module_hurst_regime">{regimes[regime] || regime || "Chưa có regime"}</TermHint>{regime && ` · ${regime}`}</p>
        <ReadingScale value={hurst.hurst} label="Hurst trên thang 0 đến 1, mốc tham chiếu 0,5"/>
        <p className="mt-3 text-xs text-[var(--muted)]"><TermHint id="module_hurst_confidence">Độ tin cậy ước lượng</TermHint>: {number(hurst.confidence)} / 1</p>
        <div className="mt-4 border-t border-[var(--border)] pt-3"><p className="mb-2 text-[10px] text-[var(--muted)]"><TermHint id="module_hurst_windows">Ước lượng theo cửa sổ</TermHint></p>{windows.length ? <dl className="grid gap-2 text-xs">{windows.map((v, i) => <div key={i} className="flex items-center gap-3"><dt className="w-24 shrink-0 whitespace-nowrap text-[var(--muted)]">{number(v.window)} quan sát</dt><dd className="flex min-w-0 flex-1 items-center gap-3"><span className="h-1 flex-1 bg-[var(--raised)]"><span className="block h-1 bg-[var(--accent)] opacity-70" style={{ width: `${Number(v.hurst) * 100}%` }}/></span><span className="w-10 text-right font-mono">{number(v.hurst)}</span></dd></div>)}</dl> : <p className="text-xs leading-6 text-[var(--muted)]">Báo cáo chưa công bố các cửa sổ ước lượng.</p>}</div>
      </article>
      <article aria-label="Bằng chứng LightGBM" className="min-w-0 rounded border border-[var(--border)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><h5 className="font-medium"><TermHint id="module_lightgbm">LightGBM</TermHint></h5><span className="text-[var(--muted)]"><TermHint id="module_lightgbm_available">{lgbm.available === true ? "Khả dụng" : lgbm.available === false ? "Chưa khả dụng" : "Chưa xác nhận"}</TermHint></span></div>
        <p data-alpha-value="lightgbm" className={`mt-4 font-mono text-2xl ${tone(forecast)}`}>{signed(forecast, "%")}</p><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">Lợi suất dự báo riêng · chưa trừ chi phí</p>
        <dl className="mt-5 grid gap-3 text-xs"><div className="flex justify-between gap-3"><dt className="text-[var(--muted)]"><TermHint id="lightgbm_rank_pct">Thứ hạng alpha trong rổ</TermHint></dt><dd className="font-mono">{number(lgbm.rank_pct, "%")}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--muted)]"><TermHint id="lightgbm_alpha_pct">Alpha dự báo</TermHint></dt><dd className="font-mono">{signed(lgbm.predicted_alpha_pct, "%")}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--muted)]">Phiên nguồn</dt><dd className="font-mono">{typeof lgbm.as_of === "string" ? lgbm.as_of : "—"}</dd></div></dl>
        <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs leading-6 text-[var(--muted)]"><TermHint id="module_lightgbm_available"><Participation value={lgbm.active}/></TermHint>.<br/>{sourceHorizon != null && sourceHorizon > 0 ? `Horizon của nguồn: ${number(sourceHorizon, " phiên")}.` : "Báo cáo chưa công bố horizon riêng của nguồn này."}</p>
      </article>
    </div>
    <div className={`grid min-w-0 gap-5 border-t border-[var(--border)] pt-4 ${compact ? "" : "lg:grid-cols-2"}`}>
      <div className="max-w-2xl"><h5 className="text-xs font-medium"><TermHint id="module_residual">Hồi quy phần dư</TermHint> · {residual.active === true ? "Đang hoạt động" : residual.active === false ? "Chưa kích hoạt" : "Chưa xác nhận trạng thái"}</h5><p className="mt-2 text-xs leading-6 text-[var(--muted)]">{residual.active === true ? `Dự báo riêng ${signed(residual.proj_pct, "%")}; chỉ dùng cùng điều kiện của nguồn.` : residualReason || (residual.active === false ? "Báo cáo chưa công bố lý do chi tiết; không suy nguyên nhân chỉ từ nhãn Hurst." : "Chưa đủ dữ liệu để kết luận về nguồn này.")}</p></div>
      <div className="max-w-2xl"><h5 className="text-xs font-medium">Đối chiếu với tổng hợp</h5><p className="mt-2 text-xs leading-6 text-[var(--muted)]"><TermHint id="action_forecast">Forecast</TermHint> {signed(fcast.ensemble_ret_pct, "%")} · <TermHint id="action_agreement">Đồng thuận</TermHint> {number(fcast.agreement_pct, "%")} · <TermHint id="model_coverage">Độ phủ</TermHint> {number(fcast.coverage_pct, "%")}. Hurst không bỏ phiếu hướng; chỉ các nguồn đủ điều kiện mới tham gia tổng hợp.</p>{agreementId && <a href={`#${agreementId}`} onClick={() => { const section = document.getElementById(agreementId); if (section instanceof HTMLDetailsElement) section.open = true; }} className="mt-2 inline-block text-xs text-[var(--accent)] underline underline-offset-4">Xem đồng thuận & forecast →</a>}</div>
    </div>
  </div>;
}

export function QuantModelSection({ name, report, compact, id, agreementId, navigationId }: { name: string; report: AnalysisReport; compact: boolean; id: string; agreementId?: string; navigationId?: string }) {
  const [open, setOpen] = useState(!compact), section = report.sections[name], guide = moduleGuides[name];
  if (!section || !guide) return null;
  const metrics = readableMetrics(section), rows = guide.metrics.map(([label, path, unit]) => ({ label, path, value: metricText(at(metrics, path), unit) }));
  const children = Object.values(section.metrics).flatMap(v => [record(v), ...Object.values(record(v)).map(record)]);
  const failed = children.some(v => v.error || v.available === false), fallback = children.some(v => v.method === "fallback");
  const hasMetrics = name === "directional_alpha" ? [at(metrics, "momentum_alpha.score"), at(metrics, "hurst.hurst"), at(metrics, "lightgbm_cross_sectional.available") === true ? at(metrics, "lightgbm_cross_sectional.proj_pct") : undefined].some(finite) || at(metrics, "conditional_mr.active") === true : rows.some(row => row.value !== "—");
  const status = section.status === "DISABLED" ? "Đã tắt" : !hasMetrics && name !== "commentary" ? "Chưa khả dụng" : fallback ? "Phương pháp thay thế" : failed || section.status === "UNAVAILABLE" ? "Kết quả một phần" : "Có dữ liệu";
  const narrative = name === "commentary" ? report.commentary.detailed || report.commentary.summary : null;
  return <details id={id} data-quant-module={name} open={open} onToggle={event => setOpen(event.currentTarget.open)} className="quant-report-section min-w-0 scroll-mt-6 rounded border border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6">
    <summary className="cursor-pointer py-5 marker:text-[var(--accent)]"><span className="ml-1 inline-flex w-[calc(100%-24px)] flex-wrap items-center justify-between gap-3 align-top"><strong className="text-base font-medium">{guide.title}</strong><span className="text-xs text-[var(--muted)]">{status}</span></span></summary>
    {open && <div className="grid min-w-0 gap-5 border-t border-[var(--border)] py-5">
      {section.reason_codes.length > 0 && <p role="status" className="text-xs leading-6 text-[var(--muted)]">{section.reason_codes.map(analysisReason).join(" ")}</p>}
      {fallback && <p className="text-xs leading-6 text-[var(--muted)]">Báo cáo sử dụng phương pháp thay thế; đọc phương pháp công bố trước khi dùng kết quả.</p>}
      {name === "directional_alpha" && section.status !== "DISABLED" ? <AlphaEvidence report={report} metrics={metrics} agreementId={agreementId} compact={compact}/> : <>
        <div className="max-w-4xl"><p className="text-[10px] font-medium tracking-widest text-[var(--accent)]">KẾT QUẢ CỦA {report.symbol}</p><p className="mt-2 whitespace-pre-line text-sm leading-7">{narrative || (hasMetrics ? moduleReading(name, metrics) : "Chưa có chỉ tiêu đã xác nhận cho mục này.")}</p></div>
        {hasMetrics && <dl className={`grid min-w-0 grid-cols-2 gap-4 ${compact ? "" : "lg:grid-cols-4"}`}>{rows.map(row => <div key={row.path} className="min-w-0 rounded border border-[var(--border)] p-3"><dt className="text-xs leading-5 text-[var(--muted)]">{moduleMetricTerms[row.path] ? <TermHint id={moduleMetricTerms[row.path]}>{row.label}</TermHint> : row.label}</dt><dd className="mt-2 break-words font-mono text-lg leading-7">{row.value}</dd></div>)}</dl>}
        <QuantModuleEvidence name={name} report={report} metrics={metrics} available={hasMetrics || name === "commentary"}/>
        <p className="max-w-4xl border-l-2 border-[var(--accent)] pl-3 text-xs leading-6 text-[var(--muted)]">{guide.connection}</p>
      </>}
      {navigationId && <a href={`#${navigationId}`} className="w-fit text-xs text-[var(--accent)] underline underline-offset-4">↑ Chọn module khác</a>}
      <details className="min-w-0 border-t border-[var(--border)] pt-4 text-xs leading-6 text-[var(--muted)]"><summary className="cursor-pointer text-[var(--accent)]">Hiểu mô hình · phương pháp & điều kiện</summary><div className={`mt-4 grid gap-5 ${compact ? "" : "lg:grid-cols-2"}`}><div className="max-w-2xl"><h5 className="font-medium text-[var(--text)]">Mô hình đo điều gì?</h5><p className="mt-2">{guide.definition}</p><h5 className="mt-4 font-medium text-[var(--text)]">Đầu vào và điều kiện</h5><p className="mt-2">{guide.inputs}</p></div><div className="max-w-2xl"><h5 className="font-medium text-[var(--text)]">Cách tạo ra kết quả</h5><p className="mt-2">{guide.why}</p><h5 className="mt-4 font-medium text-[var(--text)]">Vai trò trong quyết định</h5><p className="mt-2">{guide.connection}</p></div></div></details>
    </div>}
  </details>;
}
