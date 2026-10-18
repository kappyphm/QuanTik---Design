"use client";
import { tw } from "@/lib/tailwind";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Info } from "lucide-react";
import Link from "next/link";
import { getAnalysisVisuals, format, type AnalysisVisuals, type ScanResult } from "@/lib/mock-data";
import { QuantPlot, QuantDistribution } from "./quant-plots";
import { FactorProfile, DrawdownProfile } from "./factor-profile";
import { QuantModelVisual } from "./quant-model-visual";
import { Modal } from "./ui";
import TermHint, { TermContent } from "./term-hint";
import { getTerm } from "@/content/legacy/glossary";
import { usePreferences } from "./preferences";
import type { AnalysisReport } from "@/lib/api/analysis";
import { LiveQuantReport } from "./quant-live-report";
const guides = {
    stats: { name: "Hiệu suất & dòng tiền", terms: ["sharpe", "cmf", "max_drawdown"] },
    hmm: { name: "HMM & Hurst", terms: ["hmm", "hurst"] },
    garch: { name: "GARCH(1,1)–t", terms: ["garch", "volatility_regime"] },
    monte: { name: "Monte Carlo", terms: ["monte_carlo", "mc_volatility"] },
};
type GuideKey = keyof typeof guides;
const metricTerms: Record<string, string> = { Sharpe: "sharpe", "Giảm từ đỉnh": "max_drawdown", CMF: "cmf", "Sụt giảm T+2": "lock_drawdown", "P(lỗ trên 3%)": "probability_loss" };
function MetricRow({ items }: {
    items: {
        label: string;
        value: string;
        tone?: string;
    }[];
}) {
    return <dl className="quant-evidence-metrics grid [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:20px] [margin:20px_0_0] [&_dt]:[color:var(--muted)] [&_dt]:[font-size:14px] [&_dd]:[margin:8px_0_0] [&_dd]:[font-size:20px] [&_dd]:[overflow-wrap:anywhere] [.quant-section-reading_&]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [.quant-section-reading_&]:[margin:0_0_20px] [.quant-report.is-compact_&]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[700px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))]">{items.map(item => <div key={item.label}><dt>{metricTerms[item.label] ? <TermHint id={metricTerms[item.label]}>{item.label}</TermHint> : item.label}</dt><dd className={tw(item.tone ?? "")}>{item.value}</dd></div>)}</dl>;
}
function ReportSection({ title, headline, compact, children }: {
    title: string;
    headline: string;
    compact: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(!compact);
    return <details className="quant-report-section [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--border)] [&_>_summary]:[padding:22px_0] [&_>_summary]:cursor-pointer [&_>_summary::marker]:[color:var(--accent)] [&_>_summary_>_span]:inline-flex [&_>_summary_>_span]:flex-col [&_>_summary_>_span]:[vertical-align:top] [&_>_summary_>_span]:[gap:7px] [&_>_summary_>_span]:[width:calc(100%_-_26px)] [&_>_summary_strong]:[font-size:18px] [&_>_summary_strong]:[font-weight:500] [&_>_summary_span_>_span]:[color:var(--muted)] [&_>_summary_span_>_span]:[font-size:15px] [.quant-report.is-compact_&_>_summary]:[padding:16px_0] [.quant-report.is-compact_&_>_summary_strong]:[font-size:16px] [.quant-report.is-compact_&_>_summary_span_>_span]:[font-size:14px] [background:var(--surface)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:4px] [padding:0_24px] min-w-0 [&_>_summary_strong]:[color:var(--text)] [.quant-report.is-compact_&]:[padding:0_14px] max-[800px]:[padding:0_16px]" open={open} onToggle={e => setOpen(e.currentTarget.open)}>
    <summary><span><strong>{title}</strong><span>{headline}</span></span></summary>
    {open && <div className="quant-report-body [padding:0_0_24px]">{children}</div>}
  </details>;
}
function ChartViews({ report, type }: {
    report: AnalysisVisuals;
    type: "garch" | "monte";
}) {
    const [view, setView] = useState("chart");
    return <div className="quant-inline-chart">
    <div className="quant-chart-views flex [gap:8px] flex-wrap [margin-bottom:10px]" role="group" aria-label={`Góc nhìn ${type === "monte" ? "Monte Carlo" : "GARCH"}`}>
      <button className="button secondary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[background:var(--surface)] [.button&]:[border-color:var(--border)] [.button&]:[color:var(--text)] [.button&:hover]:[background:var(--raised)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" aria-pressed={view === "chart"} onClick={() => setView("chart")}>{type === "monte" ? "Dải giá" : "Biến động"}</button>
      {type === "monte" && <button className="button secondary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[background:var(--surface)] [.button&]:[border-color:var(--border)] [.button&]:[color:var(--text)] [.button&:hover]:[background:var(--raised)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" aria-pressed={view === "distribution"} onClick={() => setView("distribution")}>Phân phối</button>}
      <button className="button secondary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[background:var(--surface)] [.button&]:[border-color:var(--border)] [.button&]:[color:var(--text)] [.button&:hover]:[background:var(--raised)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" aria-pressed={view === "3d"} onClick={() => setView("3d")}>Mô hình 3D</button>
    </div>
    {view === "3d" ? <QuantModelVisual report={report} kind={type}/> : view === "distribution" ? <QuantDistribution report={report}/> : <QuantPlot report={report} kind={type === "monte" ? "cone" : "volatility"}/>}
  </div>;
}
export function QuantReport({ result, compact = false, showAction = true }: {
    result: ScanResult | AnalysisReport;
    compact?: boolean;
    showAction?: boolean;
}) {
    return "schema_version" in result ? <LiveQuantReport report={result} compact={compact} showAction={showAction}/> : <SampleQuantReport result={result} compact={compact} showAction={showAction}/>;
}
function SampleQuantReport({ result, compact = false, showAction = true }: {
    result: ScanResult;
    compact?: boolean;
    showAction?: boolean;
}) {
    const { theme } = usePreferences();
    const report = useMemo(() => getAnalysisVisuals(result.symbol), [result.symbol]);
    const [guide, setGuide] = useState<GuideKey | null>(null);
    const m = result.metrics;
    const caution = ["TRÁNH", "THẬN TRỌNG"].includes(result.recommendation);
    const value = (key: string, suffix = "") => {
        const raw = m[key];
        if (raw == null)
            return "—";
        const number = Number(raw);
        return `${Number.isFinite(number) ? number.toLocaleString("vi-VN", { maximumFractionDigits: 3 }) : raw}${suffix}`;
    };
    const conditions = result.conditions.filter(condition => !/^Dữ liệu mẫu|^Các giá trị chỉ/.test(condition));
    const explain = (key: GuideKey) => <button className="quant-learn-button inline-flex [gap:8px] items-center [color:var(--accent)] [background:none] [border-width:0] [padding:8px_0] [font:inherit] [font-size:15px]" onClick={() => setGuide(key)}><Info size={16} aria-hidden="true"/>Hiểu mô hình</button>;
    const state = report?.hmm.state === "bull" ? "Tăng" : report?.hmm.state === "bear" ? "Giảm" : "Đi ngang";
    return <div className={tw(`quant-report ${compact ? "is-compact" : ""}`)}>
    {showAction && <section className="quant-action quant-action-reading block items-center justify-between [gap:12px] [background:var(--raised)] [padding:22px] [border-radius:4px] [&_strong]:[color:var(--accent)] [&_strong]:[font-size:16px] [&_span]:[color:var(--muted)] [&_span]:[font-size:14px] relative [margin:22px_0_26px] [border-left-width:3px] [border-left-style:solid] [border-left-color:var(--accent)] [&_>_div]:flex [&_>_div]:[align-items:baseline] [&_>_div]:flex-wrap [&_>_div]:justify-between [&_>_div]:[gap:12px] [&_>_div]:[padding-right:95px] [&_h3]:[margin:0] [&_h3]:[font-size:18px] [&_h3]:[font-weight:500] [&_p]:[margin:16px_0_0] [&_p]:[font-size:16px] [&_p]:[line-height:1.8] [.quant-report.is-compact_&]:[padding:16px] [.quant-report.is-compact_&_>_div]:[padding-right:0] max-[700px]:[padding:18px] max-[700px]:[&_>_div]:[padding-right:0]" aria-label="Hành động">
      <div><h3>HÀNH ĐỘNG</h3><strong className={tw(caution ? "negative" : "neutral")}>{result.recommendation}</strong></div>
      <p>{caution ? "Bằng chứng hiện tại chưa thuận lợi để mở vị thế. Nếu chưa mua, nên chờ điều kiện cải thiện. Nếu đang cầm hàng, chưa tăng tỷ trọng và bám mức dừng lỗ trong kế hoạch." : "Tín hiệu có điểm tích cực nhưng chưa đủ xác nhận để mua. Nếu chưa mua, nên tiếp tục theo dõi. Nếu đang cầm hàng, giữ kỷ luật dừng lỗ và chỉ tăng tỷ trọng khi có thêm xác nhận."}</p>
      {!!conditions.length && <ul className="quant-action-conditions [margin:14px_0_0] [padding-left:20px] [color:var(--muted)] [font-size:15px] [&_li_+_li]:[margin-top:6px]">{conditions.map(condition => <li key={condition}>{condition}</li>)}</ul>}
      {report && <span className="quant-result-mode [.quant-action-reading_&]:absolute [.quant-action-reading_&]:[top:22px] [.quant-action-reading_&]:[right:22px] [.quant-action-reading_&]:[color:var(--muted)] [.quant-action-reading_&]:[font-size:14px] [.quant-report.is-compact_&]:[position:static] [.quant-report.is-compact_&]:block [.quant-report.is-compact_&]:[margin-top:14px] max-[700px]:[.quant-action-reading_&]:[position:static] max-[700px]:[.quant-action-reading_&]:block max-[700px]:[.quant-action-reading_&]:[margin-top:16px]" role="status">Mô phỏng</span>}
    </section>}
    {report && <div className="quant-report-sections grid [gap:18px]">
      <ReportSection title="Hồ sơ nhân tố" headline="Sáu góc nhìn · số liệu gốc và điểm quy đổi" compact={compact}>
        <FactorProfile result={result} report={report}/>
      </ReportSection>
      <ReportSection title="Hiệu suất & dòng tiền" headline={report.performance.cmf < 0 ? "Dòng tiền nghiêng về bên bán" : "Dòng tiền nghiêng về bên mua"} compact={compact}>
        <div className="quant-section-reading [&_p]:[font-size:16px] [&_p]:[color:var(--muted)] [&_p]:[line-height:1.85] [&_p]:[margin:0_0_16px] [&_strong]:[color:var(--text)] [&_strong]:[font-weight:500] [.quant-explained-visual_>_&]:[border-top-width:1px] [.quant-explained-visual_>_&]:[border-top-style:solid] [.quant-explained-visual_>_&]:[border-top-color:var(--border)] [.quant-explained-visual_>_&]:[padding-top:22px]"><p><TermHint id="sharpe">Sharpe</TermHint> <strong>{value("N")}</strong> mô tả hiệu suất so với biến động trong quá khứ. Mức giảm sâu nhất <strong>{value("P", "%")}</strong> cho thấy tổn thất từng xuất hiện; đây không phải mức lỗ tối đa trong tương lai.</p>
          <p><TermHint id="cmf">CMF</TermHint> <strong>{format(report.performance.cmf)}</strong>: {report.performance.cmf < 0 ? "áp lực bán đang chiếm ưu thế trong mẫu." : "giá và khối lượng nghiêng về áp lực mua trong mẫu."} Đọc cùng sức mạnh tương đối với VN-Index.</p>{explain("stats")}</div>
        <MetricRow items={[{ label: "Sharpe", value: value("N") }, { label: "Giảm từ đỉnh", value: value("P", "%"), tone: "negative" }, { label: "CMF", value: format(report.performance.cmf), tone: report.performance.cmf < 0 ? "negative" : "positive" }, { label: "So với VN-Index", value: `${format(report.performance.relativeStrengthPct)}%` }]}/>
      </ReportSection>
      <ReportSection title="HMM & Hurst" headline={`Bối cảnh ${state.toLowerCase()} · chưa phải xác nhận mua`} compact={compact}>
        <div className="quant-explained-visual [grid-template-columns:minmax(0,_.9fr)_minmax(0,_1.2fr)] [align-items:start] [&_>_*]:min-w-0 [.quant-report.is-compact_&]:[grid-template-columns:1fr] [.quant-report.is-compact_&]:[gap:18px] max-[1100px]:[grid-template-columns:1fr] max-[1100px]:[gap:18px] flex [gap:24px] flex-col [&_>_*]:w-full"><QuantPlot report={report} kind="regime"/><div className="quant-section-reading [&_p]:[font-size:16px] [&_p]:[color:var(--muted)] [&_p]:[line-height:1.85] [&_p]:[margin:0_0_16px] [&_strong]:[color:var(--text)] [&_strong]:[font-weight:500] [.quant-explained-visual_>_&]:[border-top-width:1px] [.quant-explained-visual_>_&]:[border-top-style:solid] [.quant-explained-visual_>_&]:[border-top-color:var(--border)] [.quant-explained-visual_>_&]:[padding-top:22px]"><p><TermHint id="hmm">HMM</TermHint> đang nhận diện trạng thái <strong>{state.toLowerCase()}</strong> trong dữ liệu mẫu. Xác suất dưới đây mô tả trạng thái, không phải xác suất lệnh thắng.</p><p><TermHint id="hurst">Hurst</TermHint> <strong>{value("AA")}</strong> cho biết cấu trúc dai dẳng hay hồi quy của chuỗi; không tự kết luận cổ phiếu sẽ tăng.</p>
          <dl className="quant-state-probabilities [margin:24px_0_14px] [&_>_div]:grid [&_>_div]:[grid-template-columns:90px_minmax(0,_1fr)] [&_>_div]:[gap:12px] [&_>_div]:items-center [&_>_div]:[margin-bottom:12px] [&_dt]:[color:var(--muted)] [&_dt]:[font-size:14px] [&_dd]:[margin:0] [&_dd]:relative [&_dd]:[height:32px] [&_dd]:[background:var(--raised)] [&_dd]:flex [&_dd]:items-center [&_dd]:justify-end [&_dd]:[padding-right:8px] [&_dd_strong]:relative [&_dd_strong]:[z-index:1] [&_dd_strong]:[font-size:14px] [&_dd_strong]:[font-weight:500]">{([['bull', 'Tăng'], ['sideways', 'Đi ngang'], ['bear', 'Giảm']] as const).map(([key, label]) => <div key={key}><dt>{label}</dt><dd><span className={tw(`quant-state-fill ${key}`)} style={{ width: `${report.hmm.probabilities[key] * 100}%` }}/><strong>{format(report.hmm.probabilities[key] * 100, 0)}%</strong></dd></div>)}</dl>{explain("hmm")}</div>
        </div>
      </ReportSection>
      <ReportSection title="GARCH · Biến động" headline="Đo mức dao động, không dự báo chiều giá" compact={compact}>
        <div className="quant-explained-visual [grid-template-columns:minmax(0,_.9fr)_minmax(0,_1.2fr)] [align-items:start] [&_>_*]:min-w-0 [.quant-report.is-compact_&]:[grid-template-columns:1fr] [.quant-report.is-compact_&]:[gap:18px] max-[1100px]:[grid-template-columns:1fr] max-[1100px]:[gap:18px] flex [gap:24px] flex-col [&_>_*]:w-full"><ChartViews report={report} type="garch"/><div className="quant-section-reading [&_p]:[font-size:16px] [&_p]:[color:var(--muted)] [&_p]:[line-height:1.85] [&_p]:[margin:0_0_16px] [&_strong]:[color:var(--text)] [&_strong]:[font-weight:500] [.quant-explained-visual_>_&]:[border-top-width:1px] [.quant-explained-visual_>_&]:[border-top-style:solid] [.quant-explained-visual_>_&]:[border-top-color:var(--border)] [.quant-explained-visual_>_&]:[padding-top:22px]"><p>Biến động cuối mẫu <strong>{format(report.garch.volatility.at(-1)?.valuePct ?? null)}%</strong>, so với đầu mẫu <strong>{format(report.garch.volatility[0]?.valuePct ?? null)}%</strong>: mức dao động đang {(report.garch.volatility.at(-1)?.valuePct ?? 0) > (report.garch.volatility[0]?.valuePct ?? 0) ? "mở rộng" : "thu hẹp"}. Đối chiếu quy mô vị thế với mức dừng lỗ; GARCH không xác định chiều tăng hay giảm.</p><p>α + β = <strong>{format(report.garch.alpha + report.garch.beta)}</strong>: {report.garch.alpha + report.garch.beta >= 1 ? "cấu hình có độ dai dẳng từ 1 trở lên; không suy luận phương sai dài hạn ổn định." : report.garch.alpha + report.garch.beta >= .9 ? "cú sốc biến động có xu hướng suy giảm chậm trong cấu hình mẫu." : "cú sốc biến động có xu hướng suy giảm nhanh hơn cấu hình sát 1."}</p><MetricRow items={[{ label: "α · cú sốc mới", value: format(report.garch.alpha) }, { label: "β · phương sai cũ", value: format(report.garch.beta) }]}/>{explain("garch")}</div></div>
      </ReportSection>
      <ReportSection title="Monte Carlo · Kịch bản" headline="Một dải khả năng, không có đường giá chắc chắn" compact={compact}>
        <div className="quant-explained-visual [grid-template-columns:minmax(0,_.9fr)_minmax(0,_1.2fr)] [align-items:start] [&_>_*]:min-w-0 [.quant-report.is-compact_&]:[grid-template-columns:1fr] [.quant-report.is-compact_&]:[gap:18px] max-[1100px]:[grid-template-columns:1fr] max-[1100px]:[gap:18px] flex [gap:24px] flex-col [&_>_*]:w-full"><ChartViews report={report} type="monte"/><div className="quant-section-reading [&_p]:[font-size:16px] [&_p]:[color:var(--muted)] [&_p]:[line-height:1.85] [&_p]:[margin:0_0_16px] [&_strong]:[color:var(--text)] [&_strong]:[font-weight:500] [.quant-explained-visual_>_&]:[border-top-width:1px] [.quant-explained-visual_>_&]:[border-top-style:solid] [.quant-explained-visual_>_&]:[border-top-color:var(--border)] [.quant-explained-visual_>_&]:[padding-top:22px]"><p>Vùng màu thể hiện các phân vị giá qua <strong>{report.monteCarlo.horizon} phiên mẫu</strong>. Đường giữa là P50; vùng rộng hơn cho thấy bất định lớn hơn.</p><p>Dự báo có hướng <strong>{value("U", "%")}</strong>, sau chi phí <strong>{value("AG", "%")}</strong>. Đây là chỉ tiêu mẫu được đọc cùng rủi ro, không phải cam kết lợi nhuận.</p>{explain("monte")}</div></div>
      </ReportSection>
      <ReportSection title="Rủi ro & kế hoạch" headline="Đối chiếu khả năng chịu lỗ trước khi đặt lệnh" compact={compact}>
        <DrawdownProfile report={report}/>
        <div className="quant-section-reading [&_p]:[font-size:16px] [&_p]:[color:var(--muted)] [&_p]:[line-height:1.85] [&_p]:[margin:0_0_16px] [&_strong]:[color:var(--text)] [&_strong]:[font-weight:500] [.quant-explained-visual_>_&]:[border-top-width:1px] [.quant-explained-visual_>_&]:[border-top-style:solid] [.quant-explained-visual_>_&]:[border-top-color:var(--border)] [.quant-explained-visual_>_&]:[padding-top:22px]"><p>Trong thời gian chờ T+2, cổ phiếu có thể giảm khi chưa bán được. Chỉ dùng các mốc dưới đây làm kế hoạch có điều kiện; không coi là lệnh đã được hệ thống xác nhận.</p></div>
        <MetricRow items={[{ label: "Sụt giảm T+2", value: value("AI", "%"), tone: "negative" }, { label: "P(lỗ trên 3%)", value: value("AJ", "%") }, { label: "Chi phí", value: value("AF", "%") }, { label: "Nắm giữ", value: value("G") }]}/>
        <dl className="quant-trade-levels grid [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:20px] [margin:24px_0_0] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--border)] [padding-top:22px] [&_dt]:[color:var(--muted)] [&_dt]:[font-size:15px] [&_dd]:[font-size:22px] [&_dd]:[margin:8px_0_0] [&_dd]:[overflow-wrap:anywhere] [&_dd_span]:block [&_dd_span]:[font-size:14px] [&_dd_span]:[color:var(--muted)] [&_dd_span]:[margin-top:4px] [.quant-report.is-compact_&]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[700px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))]">{[['AR', 'Giá vào'], ['AS', 'Dừng lỗ'], ['AT', 'Mục tiêu 1'], ['AU', 'Mục tiêu 2']].map(([key, label]) => <div key={key}><dt><TermHint id={key === "AR" ? "entry" : key === "AS" ? "stop_loss" : "take_profit"}>{label}</TermHint></dt><dd className={tw(key === "AS" ? "negative" : key === "AR" ? "" : "positive")}>{value(key)}<span>nghìn ₫</span></dd></div>)}</dl>
      </ReportSection>
    </div>}
    {compact && <Link className="quant-full-report text-link [.auth-stage_.account-login_&]:[font-size:12px] [.auth-stage_.account-login_&]:[color:var(--muted)] inline-flex items-center [gap:8px] [font-size:15px] [margin-top:18px]" href={`/analysis?symbol=${result.symbol}`}>Đọc toàn bộ phân tích <ArrowUpRight size={16}/></Link>}
    {guide && <Modal title={guides[guide].name} onClose={() => setGuide(null)} className="quant-guide-dialog">
      {guides[guide].terms.map(id => { const term = getTerm(id); return term ? <section className="legacy-term-content [color:var(--term-text)] [font:12px/1.6_var(--font-mono),_ui-monospace,_Consolas,_monospace] text-left [white-space:normal] [&_small]:[color:var(--term-dim)] [&_small]:[font-size:10px] [&_p]:[margin:10px_0] [&_p]:[font-size:12px] [.info-dialog_&_p]:[margin:10px_0] [.info-dialog_&_p]:[font-size:12px] [.info-dialog_&_p]:[line-height:1.6] [.info-dialog_&_p]:[color:var(--term-text)] [&_h4]:[font-size:12px] [&_h4]:[color:var(--term-accent)] [&_h4]:[margin:15px_0_5px] [.legacy-term-content_+_&]:[border-top-width:1px] [.legacy-term-content_+_&]:[border-top-style:solid] [.legacy-term-content_+_&]:[border-top-color:var(--border,_#294337)] [.legacy-term-content_+_&]:[padding-top:20px] [.legacy-term-content_+_&]:[margin-top:24px]" data-theme={theme} key={id}><TermContent term={term}/></section> : null; })}
    </Modal>}
  </div>;
}
