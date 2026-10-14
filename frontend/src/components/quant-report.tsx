"use client";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Info } from "lucide-react";
import Link from "next/link";
import { getAnalysisVisuals, format, type AnalysisVisuals, type ScanResult } from "@/lib/mock-data";
import { QuantPlot, QuantDistribution } from "./quant-plots";
import { QuantModelVisual } from "./quant-model-visual";
import { Modal } from "./ui";

const guides = {
  stats: { name: "Hiệu suất & dòng tiền", definition: "Sharpe so lợi nhuận vượt lãi suất phi rủi ro với biến động. CMF mô tả áp lực mua/bán từ giá đóng cửa và khối lượng.", input: "Lịch sử giá, khối lượng; CMF dùng High, Low, Close và Volume của 20 phiên.", output: "Sharpe, mức giảm sâu nhất từ đỉnh và CMF. CMF dương nghiêng về áp lực mua, âm nghiêng về áp lực bán.", formula: "Sharpe = lợi suất vượt trội / biến động\nCMF = Σ[V × (2C − H − L)/(H − L)] / ΣV", limit: "Sharpe ở đây mô tả lịch sử giá, không phải kết quả chiến lược. CMF không đo tiền thực nạp vào/rút ra khỏi thị trường." },
  hmm: { name: "HMM & Hurst", definition: "HMM nhận diện trạng thái tăng, giảm hoặc đi ngang. Hurst mô tả mức dai dẳng hoặc hồi quy của chuỗi.", input: "Lịch sử lợi suất, biến động, khối lượng và đủ quan sát để khớp mô hình.", output: "Nhãn trạng thái, xác suất trạng thái và hệ số H. H trên 0,5 gợi ý tính dai dẳng, không khẳng định chiều tăng.", formula: "P(Sₜ = j | Sₜ₋₁ = i) = aᵢⱼ\nE[R/S(s)] ∝ sᴴ", limit: "Xác suất trạng thái khác xác suất giao dịch thắng. Không khớp được HMM thì phải hiển thị thiếu dữ liệu hoặc phương pháp thay thế." },
  garch: { name: "GARCH(1,1)–t", definition: "Mô tả việc biến động mạnh có thể kéo dài qua nhiều phiên. Student-t cho phép cú sốc cực đoan xuất hiện thường hơn phân phối chuẩn.", input: "Chuỗi lợi suất ngày, tham số ω, α, β và mô hình đã khớp thành công.", output: "Biến động có điều kiện. α đo ảnh hưởng cú sốc mới, β đo ảnh hưởng phương sai cũ.", formula: "σ²ₜ = ω + αε²ₜ₋₁ + βσ²ₜ₋₁", limit: "GARCH dự báo mức dao động, không dự báo hướng giá. Bề mặt 3D là phản hồi phương sai, không phải implied volatility surface." },
  monte: { name: "Monte Carlo", definition: "Đặt nhiều kịch bản giá cạnh nhau để thấy độ rộng và hai phía rủi ro.", input: "Giá gốc, horizon, giả định lợi suất và biến động; ở bản này dùng tập đường giá mẫu đã lưu.", output: "Dải phân vị P05–P95, trung vị P50 và phân phối lợi suất cuối kỳ.", formula: "rₜ = μₜ + σₜzₜ", limit: "Dải phân vị phụ thuộc giả định. P50 không phải giá chắc chắn; phân phối cuối kỳ không cho biết TP chạm trước SL. Trục kịch bản trong 3D chỉ tách các đường để quan sát." },
};
type GuideKey = keyof typeof guides;

function MetricRow({ items }: { items: { label: string; value: string; tone?: string }[] }) {
  return <dl className="quant-evidence-metrics">{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd className={item.tone ?? ""}>{item.value}</dd></div>)}</dl>;
}
function ReportSection({ title, headline, compact, children }: { title: string; headline: string; compact: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(!compact);
  return <details className="quant-report-section" open={open} onToggle={e => setOpen(e.currentTarget.open)}>
    <summary><span><strong>{title}</strong><span>{headline}</span></span></summary>
    {open && <div className="quant-report-body">{children}</div>}
  </details>;
}
function ChartViews({ report, type }: { report: AnalysisVisuals; type: "garch" | "monte" }) {
  const [view, setView] = useState("chart");
  return <div className="quant-inline-chart">
    <div className="quant-chart-views" role="group" aria-label={`Góc nhìn ${type === "monte" ? "Monte Carlo" : "GARCH"}`}>
      <button className="button secondary" aria-pressed={view === "chart"} onClick={() => setView("chart")}>{type === "monte" ? "Dải giá" : "Biến động"}</button>
      {type === "monte" && <button className="button secondary" aria-pressed={view === "distribution"} onClick={() => setView("distribution")}>Phân phối</button>}
      <button className="button secondary" aria-pressed={view === "3d"} onClick={() => setView("3d")}>Mô hình 3D</button>
    </div>
    {view === "3d" ? <QuantModelVisual report={report} kind={type} /> : view === "distribution" ? <QuantDistribution report={report} /> : <QuantPlot report={report} kind={type === "monte" ? "cone" : "volatility"} />}
  </div>;
}

export function QuantReport({ result, compact = false, showAction = true }: { result: ScanResult; compact?: boolean; showAction?: boolean }) {
  const report = useMemo(() => getAnalysisVisuals(result.symbol), [result.symbol]);
  const [guide, setGuide] = useState<GuideKey | null>(null);
  const m = result.metrics;
  const caution = ["TRÁNH", "THẬN TRỌNG"].includes(result.recommendation);
  const value = (key: string, suffix = "") => m[key] == null ? "—" : `${m[key]}${suffix}`;
  const explain = (key: GuideKey) => <button className="quant-learn-button" onClick={() => setGuide(key)}><Info size={16} aria-hidden="true" />Hiểu mô hình</button>;
  const state = report?.hmm.state === "bull" ? "Tăng" : report?.hmm.state === "bear" ? "Giảm" : "Đi ngang";
  return <div className={`quant-report ${compact ? "is-compact" : ""}`}>
    {showAction && <section className="quant-action quant-action-reading" aria-label="Hành động">
      <div><h3>HÀNH ĐỘNG</h3><strong className={caution ? "negative" : "neutral"}>{result.recommendation}</strong></div>
      <p>{caution ? "Bằng chứng hiện tại chưa thuận lợi để mở vị thế. Nếu chưa mua, nên chờ điều kiện cải thiện. Nếu đang cầm hàng, chưa tăng tỷ trọng và bám mức dừng lỗ trong kế hoạch." : "Tín hiệu có điểm tích cực nhưng chưa đủ xác nhận để mua. Nếu chưa mua, nên tiếp tục theo dõi. Nếu đang cầm hàng, giữ kỷ luật dừng lỗ và chỉ tăng tỷ trọng khi có thêm xác nhận."}</p>
      <ul className="quant-action-conditions">{result.conditions.map(condition => <li key={condition}>{condition}</li>)}</ul>
      {report && <span className="quant-result-mode" role="status">Mô phỏng</span>}
    </section>}
    {report && <div className="quant-report-sections">
      <ReportSection title="Hiệu suất & dòng tiền" headline={caution ? "Dòng tiền chưa ủng hộ" : "Có lực mua, vẫn cần xác nhận"} compact={compact}>
        <div className="quant-section-reading"><p>Sharpe <strong>{value("N")}</strong> mô tả hiệu suất so với biến động trong quá khứ. Mức giảm sâu nhất <strong>{value("P", "%")}</strong> cho thấy tổn thất từng xuất hiện; đây không phải mức lỗ tối đa trong tương lai.</p>
          <p>CMF <strong>{format(report.performance.cmf)}</strong>: {report.performance.cmf < 0 ? "áp lực bán đang chiếm ưu thế trong mẫu." : "giá và khối lượng nghiêng về áp lực mua trong mẫu."} Đọc cùng sức mạnh tương đối với VN-Index.</p>{explain("stats")}</div>
        <MetricRow items={[{ label: "Sharpe", value: value("N") }, { label: "Giảm từ đỉnh", value: value("P", "%"), tone: "negative" }, { label: "CMF", value: format(report.performance.cmf), tone: report.performance.cmf < 0 ? "negative" : "positive" }, { label: "So với VN-Index", value: `${format(report.performance.relativeStrengthPct)}%` }]} />
      </ReportSection>
      <ReportSection title="HMM & Hurst" headline={`Bối cảnh ${state.toLowerCase()} · chưa phải xác nhận mua`} compact={compact}>
        <div className="quant-explained-visual"><div className="quant-section-reading"><p>HMM đang nhận diện trạng thái <strong>{state.toLowerCase()}</strong> trong dữ liệu mẫu. Xác suất dưới đây mô tả trạng thái, không phải xác suất lệnh thắng.</p><p>Hurst <strong>{value("AA")}</strong> cho biết cấu trúc dai dẳng hay hồi quy của chuỗi; không tự kết luận cổ phiếu sẽ tăng.</p>
          <dl className="quant-state-probabilities">{([['bull', 'Tăng'], ['sideways', 'Đi ngang'], ['bear', 'Giảm']] as const).map(([key, label]) => <div key={key}><dt>{label}</dt><dd><span className={`quant-state-fill ${key}`} style={{ width: `${report.hmm.probabilities[key] * 100}%` }} /><strong>{format(report.hmm.probabilities[key] * 100, 0)}%</strong></dd></div>)}</dl>{explain("hmm")}</div>
          <QuantPlot report={report} kind="regime" />
        </div>
      </ReportSection>
      <ReportSection title="GARCH · Biến động" headline="Đo mức dao động, không dự báo chiều giá" compact={compact}>
        <div className="quant-explained-visual"><div className="quant-section-reading"><p>Biến động mẫu đang tăng về cuối cửa sổ. Giá có thể dao động rộng hơn, nên đối chiếu quy mô vị thế với mức dừng lỗ.</p><p>α + β = <strong>{format(report.garch.alpha + report.garch.beta)}</strong>: tác động của cú sốc suy giảm chậm trong cấu hình minh họa.</p><MetricRow items={[{ label: "α · cú sốc mới", value: format(report.garch.alpha) }, { label: "β · phương sai cũ", value: format(report.garch.beta) }]} />{explain("garch")}</div><ChartViews report={report} type="garch" /></div>
      </ReportSection>
      <ReportSection title="Monte Carlo · Kịch bản" headline="Một dải khả năng, không có đường giá chắc chắn" compact={compact}>
        <div className="quant-explained-visual"><div className="quant-section-reading"><p>Vùng màu thể hiện các phân vị giá qua <strong>{report.monteCarlo.horizon} phiên mẫu</strong>. Đường giữa là P50; vùng rộng hơn cho thấy bất định lớn hơn.</p><p>Dự báo có hướng <strong>{value("U", "%")}</strong>, sau chi phí <strong>{value("AG", "%")}</strong>. Đây là chỉ tiêu mẫu được đọc cùng rủi ro, không phải cam kết lợi nhuận.</p>{explain("monte")}</div><ChartViews report={report} type="monte" /></div>
      </ReportSection>
      <ReportSection title="Rủi ro & kế hoạch" headline="Đối chiếu khả năng chịu lỗ trước khi đặt lệnh" compact={compact}>
        <div className="quant-section-reading"><p>Trong thời gian chờ T+2, cổ phiếu có thể giảm khi chưa bán được. Chỉ dùng các mốc dưới đây làm kế hoạch có điều kiện; không coi là lệnh đã được hệ thống xác nhận.</p></div>
        <MetricRow items={[{ label: "Sụt giảm T+2", value: value("AI", "%"), tone: "negative" }, { label: "P(lỗ trên 3%)", value: value("AJ", "%") }, { label: "Chi phí", value: value("AF", "%") }, { label: "Nắm giữ", value: value("G") }]} />
        <dl className="quant-trade-levels">{[['AR', 'Giá vào'], ['AS', 'Dừng lỗ'], ['AT', 'Mục tiêu 1'], ['AU', 'Mục tiêu 2']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd className={key === "AS" ? "negative" : key === "AR" ? "" : "positive"}>{value(key)}<span>nghìn ₫</span></dd></div>)}</dl>
      </ReportSection>
    </div>}
    {compact && <Link className="quant-full-report text-link" href={`/analysis?symbol=${result.symbol}`}>Đọc toàn bộ phân tích <ArrowUpRight size={16} /></Link>}
    {guide && <Modal title={guides[guide].name} onClose={() => setGuide(null)} className="quant-guide-dialog"><p className="quant-guide-definition">{guides[guide].definition}</p><h3>Đầu vào</h3><p>{guides[guide].input}</p><h3>Đầu ra</h3><p>{guides[guide].output}</p><pre className="quant-guide-formula">{guides[guide].formula}</pre><h3>Đọc đúng kết quả</h3><p>{guides[guide].limit}</p></Modal>}
  </div>;
}
