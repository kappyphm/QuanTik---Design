"use client";
import { useId, useState } from "react";
import { analysisReason, type AnalysisReport } from "@/lib/api/analysis";
import { at, metricText, number, researchFor } from "@/lib/quant-reader";
import { QuantResearchVisuals } from "./quant-research";
import { QuantModelSection } from "./quant-model-section";
import { QuantModuleNavigation, quantModuleItems } from "./quant-module-navigation";
import { QuantActionSummary } from "./quant-action-summary";

const card = "min-w-0 rounded border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6";
const ordered = quantModuleItems.map(([name]) => name);
export function LiveQuantReport({ report, compact = false, showAction = true }: { report: AnalysisReport; compact?: boolean; showAction?: boolean }) {
  const [selectedModule, setSelectedModule] = useState("");
  const uid = useId().replaceAll(":", ""), research = researchFor(report), statistics = report.sections.statistics?.metrics;
  const technical = report.sections.technical?.metrics, agreement = report.sections.agreement?.metrics;
  const costs = report.sections.costs?.metrics, trade = report.sections.trade_plan?.metrics;
  const sectionId = (name: string) => `${uid}-quant-${name}`;
  const selectModule = (name: string) => {
    setSelectedModule(name);
    const section = document.getElementById(sectionId(name));
    if (section instanceof HTMLDetailsElement) { section.open = true; section.scrollIntoView({block: "start", behavior: "instant"}); section.querySelector("summary")?.focus({preventScroll: true}); }
  };
  const reasons = Array.isArray(report.decision.reason_codes) ? report.decision.reason_codes.map(reason => analysisReason(String(reason))) : [];
  const net = at(costs, "costs.net_forecast_pct"), cmf = at(technical, "flow.cmf"), er = at(technical, "trend.er");
  const blocks = [
    { title: "Hiệu suất và dòng tiền", text: `Sharpe ${number(at(statistics, "stats.sharpe"))}; sụt giảm tối đa ${number(at(statistics, "stats.max_dd_pct"), "%")}. CMF ${number(cmf)}${typeof cmf === "number" ? cmf < 0 ? ": áp lực giá–khối lượng nghiêng về bên bán." : cmf > 0 ? ": áp lực giá–khối lượng nghiêng về bên mua." : ": chưa cho thấy lệch hướng dòng tiền." : ". Chưa có đủ dữ liệu dòng tiền."}` },
    { title: "Trạng thái và chất lượng xu hướng", text: `HMM ${metricText(at(report.sections.hmm?.metrics, "hmm.current"))}; Hurst ${number(at(report.sections.directional_alpha?.metrics, "hurst.hurst"))}; ER ${number(er)}. ${typeof er === "number" && er <= .3 ? "Đường giá còn nhiễu, cần thêm xác nhận xu hướng." : "Đọc trạng thái cùng cấu trúc giá và điều kiện thời điểm của báo cáo."}` },
    { title: "Dự báo, đồng thuận và chi phí", text: `Dự báo tổng hợp ${number(at(agreement, "fcast.ensemble_ret_pct"), "%")}; đồng thuận ${number(at(agreement, "fcast.agreement_pct"), "%")}; độ phủ ${number(at(agreement, "fcast.coverage_pct"), "%")}. Sau chi phí ${number(net, "%")}. ${typeof net === "number" && net <= 0 ? "Dự báo ròng chưa dương sau chi phí." : "Dự báo được đối chiếu với rủi ro và các cổng thực thi, không phải cam kết lợi nhuận."}` },
    { title: "Rủi ro và khả năng thực thi", text: `${report.decision.executable === true ? "Báo cáo xác nhận đủ điều kiện thực thi theo quy tắc hệ thống." : "Báo cáo chưa xác nhận đủ điều kiện thực thi."} Quy mô ${metricText(at(trade, "pos.shares"))} cổ phiếu, theo ${metricText(at(trade, "sizing_mode")).toLowerCase()}. Mốc giá và quy mô là kế hoạch có điều kiện; cần đọc cùng rủi ro T-lock.` },
  ];
  return <div className={`quant-report grid min-w-0 gap-6 ${compact ? "is-compact" : ""}`}>
    <QuantActionSummary report={report} compact={compact} showAction={showAction}/>
    <section className={card}><h3 className="mb-3 font-medium">Dữ liệu của lần phân tích</h3><p className="text-sm leading-7 text-[var(--muted)]">{metricText(research.observations ?? at(statistics, "n"))} nến ngày · {research.start && research.end ? `${research.start} → ${research.end}` : metricText(at(statistics, "range"))} · Giá theo VND</p><details className="mt-3 text-xs leading-6 text-[var(--muted)]"><summary className="cursor-pointer">Nguồn dữ liệu và luồng xử lý</summary><p className="mt-2">Lịch sử giá–khối lượng và VN-Index → kiểm tra, chuẩn hóa dữ liệu → phân tích mô hình → tổng hợp rủi ro, khuyến nghị và biểu đồ.</p></details></section>
    <section className={card} aria-label="Tổng hợp và khuyến nghị"><p className="text-xs tracking-widest text-[var(--accent)]">TỔNG HỢP BẰNG CHỨNG</p><h3 className="mt-2 text-xl font-medium">Xâu chuỗi các mô hình và khuyến nghị</h3><p className="mt-3 text-sm leading-7 text-[var(--muted)]">Đọc cả yếu tố ủng hộ, điểm mâu thuẫn và phần còn thiếu trước khi dùng kết luận.</p>
      <div className="grid gap-3">{blocks.map((block, i) => <details key={block.title} open={!compact} className="rounded border border-[var(--border)] px-4"><summary className="cursor-pointer py-4 text-sm font-medium"><span className="mr-3 font-mono text-[var(--accent)]">0{i + 1}</span>{block.title}</summary><p className="pb-4 text-sm leading-7 text-[var(--muted)]">{block.text}</p></details>)}</div>
      <div className="mt-5 text-sm leading-7"><h4 className="font-medium">Điều kiện cần theo dõi để đánh giá lại</h4><p className="mt-2 text-[var(--muted)]">{reasons.length ? reasons.join(" ") : "Đối chiếu báo cáo ở phiên tiếp theo khi dữ liệu, tín hiệu và rủi ro thay đổi."}</p></div>
      {!!report.warnings.length && <div className="mt-4 text-xs leading-7 text-[var(--muted)]"><h4 className="font-medium text-[var(--text)]">Phần bằng chứng còn hạn chế</h4><ul className="list-inside list-disc">{report.warnings.map((warning, i) => <li key={i}>{analysisReason(warning)}</li>)}</ul></div>}
    </section>
    <section id={sectionId("navigation")} aria-label="Phân tích từng module" className="grid min-w-0 gap-3"><div><h3 className="text-xl font-medium">Hiểu từng mô hình và kết quả</h3><p className="mt-2 text-sm leading-7 text-[var(--muted)]">Từ dữ liệu đầu vào đến ý nghĩa kết quả, nguyên nhân và vai trò trong khuyến nghị tổng hợp.</p></div>
      <QuantModuleNavigation selected={selectedModule} onSelect={selectModule}/>
      {ordered.map(name => <QuantModelSection key={name} name={name} report={report} compact={compact} id={sectionId(name)} agreementId={sectionId("agreement")} navigationId={sectionId("navigation")}/>)}</section>
    <QuantResearchVisuals report={report}/>
    <details className={`${card} text-xs leading-7 text-[var(--muted)]`}><summary className="cursor-pointer">Phiên bản dữ liệu và mô hình</summary><dl className="mt-3">{Object.entries(report.versions).filter(([, value]) => typeof value === "string" || typeof value === "number").map(([key, value]) => <div key={key} className="my-2 break-all"><dt>{key}</dt><dd className="font-mono">{String(value)}</dd></div>)}</dl></details>
  </div>;
}
