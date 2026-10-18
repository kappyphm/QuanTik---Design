"use client";
import { useId, useState } from "react";
import { stamp } from "@/lib/api/contracts";
import { analysisReason, type AnalysisReport } from "@/lib/api/analysis";
import { actionNames, at, metricText, moduleGuides, moduleReading, number, record, researchFor } from "@/lib/quant-reader";
import { QuantResearchVisuals } from "./quant-research";
import TermHint from "./term-hint";

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
  const uid = useId().replaceAll(":", ""), research = researchFor(report), statistics = report.sections.statistics?.metrics;
  const technical = report.sections.technical?.metrics, agreement = report.sections.agreement?.metrics;
  const costs = report.sections.costs?.metrics, trade = report.sections.trade_plan?.metrics, action = String(report.decision.action || "");
  const sectionId = (name: string) => `${uid}-quant-${name}`;
  const reasons = Array.isArray(report.decision.reason_codes) ? report.decision.reason_codes.map(reason => analysisReason(String(reason))) : [];
  const net = at(costs, "costs.net_forecast_pct"), cmf = at(technical, "flow.cmf"), er = at(technical, "trend.er");
  const blocks = [
    { title: "Hiệu suất và dòng tiền", text: `Sharpe ${number(at(statistics, "stats.sharpe"))}; sụt giảm tối đa ${number(at(statistics, "stats.max_dd_pct"), "%")}. CMF ${number(cmf)}${typeof cmf === "number" ? cmf < 0 ? ": áp lực giá–khối lượng nghiêng về bên bán." : cmf > 0 ? ": áp lực giá–khối lượng nghiêng về bên mua." : ": chưa cho thấy lệch hướng dòng tiền." : ". Chưa có đủ dữ liệu dòng tiền."}` },
    { title: "Trạng thái và chất lượng xu hướng", text: `HMM ${metricText(at(report.sections.hmm?.metrics, "hmm.current"))}; Hurst ${number(at(report.sections.directional_alpha?.metrics, "hurst.hurst"))}; ER ${number(er)}. ${typeof er === "number" && er <= .3 ? "Đường giá còn nhiễu, cần thêm xác nhận xu hướng." : "Đọc trạng thái cùng cấu trúc giá và điều kiện thời điểm của báo cáo."}` },
    { title: "Dự báo, đồng thuận và chi phí", text: `Dự báo tổng hợp ${number(at(agreement, "fcast.ensemble_ret_pct"), "%")}; đồng thuận ${number(at(agreement, "fcast.agreement_pct"), "%")}; độ phủ ${number(at(agreement, "fcast.coverage_pct"), "%")}. Sau chi phí ${number(net, "%")}. ${typeof net === "number" && net <= 0 ? "Dự báo ròng chưa dương sau chi phí." : "Dự báo được đối chiếu với rủi ro và các cổng thực thi, không phải cam kết lợi nhuận."}` },
    { title: "Rủi ro và khả năng thực thi", text: `${report.decision.executable === true ? "Báo cáo xác nhận đủ điều kiện thực thi theo quy tắc hệ thống." : "Báo cáo chưa xác nhận đủ điều kiện thực thi."} Quy mô ${metricText(at(trade, "pos.shares"))} cổ phiếu, theo ${metricText(at(trade, "sizing_mode")).toLowerCase()}. Mốc giá và quy mô là kế hoạch có điều kiện; cần đọc cùng rủi ro T-lock.` },
  ];
  return <div className={`quant-report grid min-w-0 gap-6 ${compact ? "is-compact" : ""}`}>
    <div className="border-l-2 border-[var(--accent)] bg-[var(--raised)] px-4 py-3 text-sm leading-7">Kết quả từ báo cáo API · Phiên {report.target_session || report.data_as_of.slice(0, 10)} · Phân tích lúc {stamp(report.evaluated_at)}{report.data_observed_at && <p className="text-xs text-[var(--muted)]">Thu thập dữ liệu lúc {stamp(report.data_observed_at)}</p>}</div>
    <section className={card}><h3 className="mb-3 font-medium">Dữ liệu của lần phân tích</h3><p className="text-sm leading-7 text-[var(--muted)]">{metricText(research.observations ?? at(statistics, "n"))} nến ngày · {research.start && research.end ? `${research.start} → ${research.end}` : metricText(at(statistics, "range"))} · Giá theo VND</p><details className="mt-3 text-xs leading-6 text-[var(--muted)]"><summary className="cursor-pointer">Nguồn dữ liệu và luồng xử lý</summary><p className="mt-2">Lịch sử giá–khối lượng và VN-Index → kiểm tra, chuẩn hóa dữ liệu → phân tích mô hình → tổng hợp rủi ro, khuyến nghị và biểu đồ.</p></details></section>
    <section className={card} aria-label="Kế hoạch giao dịch"><Values rows={[["Khuyến nghị", actionNames[action] || action || "Chưa có quyết định"], ["Điểm vào (VND)", metricText(at(trade, "sl.entry"))], ["Cắt lỗ (VND)", metricText(at(trade, "sl.sl_swing"))], ["Chốt lời 1 (VND)", metricText(at(trade, "sl.tp1"))], ["Chốt lời 2 (VND)", metricText(at(trade, "sl.tp2"))], ["R:R TP2", metricText(at(trade, "sl.rr2"), "x")], ["ATR (VND)", metricText(at(trade, "sl.atr"))], ["Dự báo sau chi phí", number(net, "%")]]}/></section>
    <section className={card} aria-label="Tổng hợp và khuyến nghị"><p className="text-xs tracking-widest text-[var(--accent)]">TỔNG HỢP BẰNG CHỨNG</p><h3 className="mt-2 text-xl font-medium">Xâu chuỗi các mô hình và khuyến nghị</h3><p className="mt-3 text-sm leading-7 text-[var(--muted)]">Đọc cả yếu tố ủng hộ, điểm mâu thuẫn và phần còn thiếu trước khi dùng kết luận.</p>
      {showAction && <div aria-label="Hành động" className="my-5 border-l-2 border-[var(--accent)] bg-[var(--raised)] p-4"><h4 className="font-medium">HÀNH ĐỘNG · {actionNames[action] || action}</h4><p className="mt-3 whitespace-pre-line text-sm leading-7">{report.commentary.summary}</p>{!!reasons.length && <ul className="mt-3 list-inside list-disc text-xs leading-7 text-[var(--muted)]">{reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>}</div>}
      <div className="grid gap-3">{blocks.map((block, i) => <details key={block.title} open={!compact} className="rounded border border-[var(--border)] px-4"><summary className="cursor-pointer py-4 text-sm font-medium"><span className="mr-3 font-mono text-[var(--accent)]">0{i + 1}</span>{block.title}</summary><p className="pb-4 text-sm leading-7 text-[var(--muted)]">{block.text}</p></details>)}</div>
      <div className="mt-5 text-sm leading-7"><h4 className="font-medium">Điều kiện cần theo dõi để đánh giá lại</h4><p className="mt-2 text-[var(--muted)]">{reasons.length ? reasons.join(" ") : "Đối chiếu báo cáo ở phiên tiếp theo khi dữ liệu, tín hiệu và rủi ro thay đổi."}</p></div>
      {!!report.warnings.length && <div className="mt-4 text-xs leading-7 text-[var(--muted)]"><h4 className="font-medium text-[var(--text)]">Phần bằng chứng còn hạn chế</h4><ul className="list-inside list-disc">{report.warnings.map((warning, i) => <li key={i}>{analysisReason(warning)}</li>)}</ul></div>}
    </section>
    <section aria-label="Phân tích từng module" className="grid min-w-0 gap-3"><div><h3 className="text-xl font-medium">Hiểu từng mô hình và kết quả</h3><p className="mt-2 text-sm leading-7 text-[var(--muted)]">Từ dữ liệu đầu vào đến ý nghĩa kết quả, nguyên nhân và vai trò trong khuyến nghị tổng hợp.</p></div>
      {!compact && <nav aria-label="Điều hướng module" className="my-2 flex flex-wrap gap-2">{ordered.map(name => <a key={name} href={`#${sectionId(name)}`} className="rounded border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)] hover:text-[var(--accent)]">{moduleGuides[name].title}</a>)}</nav>}
      {ordered.map(name => <Module key={name} name={name} report={report} compact={compact} id={sectionId(name)}/>)}</section>
    <QuantResearchVisuals report={report}/>
    <details className={`${card} text-xs leading-7 text-[var(--muted)]`}><summary className="cursor-pointer">Phiên bản dữ liệu và mô hình</summary><dl className="mt-3">{Object.entries(report.versions).filter(([, value]) => typeof value === "string" || typeof value === "number").map(([key, value]) => <div key={key} className="my-2 break-all"><dt>{key}</dt><dd className="font-mono">{String(value)}</dd></div>)}</dl></details>
  </div>;
}
