"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Search, ShieldCheck, ChartNoAxesCombined } from "lucide-react";
import { scanSnapshot, demoEnabled, type ScanResult } from "@/lib/mock-data";
import { PageHeading, Panel, Modal } from "./ui";
import { Criteria } from "./quant-panel";
import { QuantReport } from "./quant-report";

export function Screener() {
  const [review, setReview] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <>
    <PageHeading title="Quét toàn sàn">{loaded && <>
      <button className="button secondary" onClick={() => setReview(true)}>Tiêu chí & trọng số</button>
      <button className="button primary" onClick={() => setLoaded(false)}>Quét lại</button>
    </>}</PageHeading>
    {!loaded ? <section className="scan-intro" aria-labelledby="scan-intro-title">
      <div className="scan-intro-main">
        <div className="scan-intro-copy">
          <span className="scan-intro-eyebrow">Góc nhìn toàn thị trường</span>
          <h2 id="scan-intro-title">Khai mở góc nhìn<br /><em>toàn sàn.</em></h2>
          <p>Tìm 5 mã nổi bật, nhận diện 5 mã nên tránh và khám phá lý do phía sau từng lựa chọn.</p>
          <div className="scan-intro-actions">
            <button className="button primary" disabled={!demoEnabled} onClick={() => setLoaded(true)}>Quét toàn sàn <ArrowUpRight size={22} aria-hidden="true" /></button>
            <button className="button secondary" onClick={() => setReview(true)}>Tiêu chí & trọng số</button>
          </div>
        </div>
        <ScanIllustration />
      </div>
      <div className="scan-intro-features">
        <div><Search size={22} aria-hidden="true" /><div><h3>Tìm cơ hội</h3><p>5 mã nổi bật để theo dõi</p></div></div>
        <div><ShieldCheck size={22} aria-hidden="true" /><div><h3>Nhận diện rủi ro</h3><p>5 mã cần thận trọng</p></div></div>
        <div><ChartNoAxesCombined size={22} aria-hidden="true" /><div><h3>Hiểu từng mã</h3><p>Xem lý do và phân tích Quant</p></div></div>
      </div>
    </section> : <>
    <div className="scan-results-heading"><h2>Kết quả quét</h2><span role="status">10 mã · 2 nhóm</span></div>
    <div className="scan-grid scan-results">
      <Panel title="5 mã nổi bật"><ScanList items={scanSnapshot.best} /></Panel>
      <Panel title="5 mã nên tránh"><ScanList items={scanSnapshot.avoid} caution /></Panel>
    </div>
    </>}
    {review && <Modal title="Tiêu chí & trọng số" onClose={() => setReview(false)} className="criteria-dialog scan-criteria-dialog">
      <Criteria weightSuffix="" />
      <div className="review-actions"><button className="button secondary" onClick={() => setReview(false)}>Đóng</button><button className="button primary" disabled={!demoEnabled} onClick={() => { setLoaded(true); setReview(false); }}>Quét toàn sàn</button></div>
    </Modal>}
  </>;
}
function ScanList({ items, caution = false }: { items: ScanResult[]; caution?: boolean }) {
  return <div className="scan-list">{items.map((item) => <article className="scan-item" key={item.symbol}>
    <div className="scan-item-heading"><div><Link className="symbol-link" href={`/analysis?symbol=${item.symbol}`}>{item.symbol}</Link><span className={caution ? "negative" : "neutral"}>{item.recommendation}</span></div><strong className="number">{item.score}<span>/100</span></strong></div>
    <div className="scan-item-summary"><span>{item.sector}</span><Link className="text-link" href={`/analysis?symbol=${item.symbol}`}>Phân tích Quant ↗</Link></div>
    <details className="scan-explanation"><summary>Vì sao {caution ? "nên tránh" : "nổi bật"}?</summary>
      <ul className="condition-list">{item.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
      <QuantReport result={item} compact showAction={false} />
      <details className="quant-raw-metrics"><summary>Tất cả chỉ tiêu</summary><Criteria result={item} weightSuffix="" /></details>
      <details className="result-explanation"><summary>Nhận xét đầy đủ</summary><p>{item.explanation}</p></details>
    </details>
  </article>)}</div>;
}

function ScanIllustration() {
  return <div className="scan-intro-visual" aria-hidden="true">
    <svg viewBox="0 0 620 420" focusable="false">
      <g className="scan-visual-grid" fill="none" stroke="var(--positive)" strokeWidth="1">
        <path d="M30 230 310 70 590 230 310 390Z M100 270 380 110 M170 310 450 150 M240 350 520 190 M100 190 380 350 M170 150 450 310 M240 110 520 270" />
      </g>
      <path d="M45 285 150 225 250 170 335 115 445 180 595 270" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" />
      {[{x:100,y:228,h:32},{x:170,y:205,h:42},{x:240,y:178,h:36},{x:310,y:165,h:44},{x:380,y:133,h:40},{x:450,y:110,h:35}].map((c, i) => <g key={c.x} fill={i === 3 ? "var(--accent)" : "var(--positive)"} stroke={i === 3 ? "var(--accent)" : "var(--positive)"}>
        <line x1={c.x} x2={c.x} y1={c.y - 20} y2={c.y + c.h + 24} />
        <rect x={c.x - 8} y={c.y} width="16" height={c.h} stroke="none" />
      </g>)}
      <circle cx="380" cy="154" r="68" fill="var(--surface)" fillOpacity=".15" stroke="var(--positive)" strokeWidth="1.5" />
      <path d="M428 204 479 255" stroke="var(--accent)" strokeWidth="10" />
      <path d="M380 67V86 M380 222V241 M293 154H312 M448 154H467" stroke="var(--positive)" strokeWidth="1.5" />
    </svg>
  </div>;
}
