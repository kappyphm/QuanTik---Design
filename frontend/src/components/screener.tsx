"use client";
import Link from "next/link";
import { useState } from "react";
import { scanSnapshot, type ScanResult } from "@/lib/mock-data";
import { PageHeading, Panel, Modal } from "./ui";
import { Criteria } from "./quant-panel";

export function Screener() {
  const [review, setReview] = useState(false);
  return <>
    <PageHeading title="Quét toàn sàn"><button className="button primary" onClick={() => setReview(true)}>Chạy Quant tổng quát</button></PageHeading>
    <div className="scan-published-bar">
      <span>Bản mẫu Excel · {scanSnapshot.source.publishedLabel}</span>
    </div>
    <div className="scan-grid">
      <Panel title="5 mã nổi bật"><ScanList items={scanSnapshot.best} /></Panel>
      <Panel title="5 mã nên tránh"><ScanList items={scanSnapshot.avoid} caution /></Panel>
    </div>
    <details className="criteria-overview"><summary>Tiêu chí đánh giá & trọng số</summary><Criteria /><p className="weight-note">File tham chiếu có chỉ tiêu đánh giá; chưa có hệ số trọng số %.</p></details>
    {review && <Modal title="Trước khi chạy Quant toàn sàn" onClose={() => setReview(false)} className="criteria-dialog">
      <Criteria /><p className="weight-note">Trọng số % chưa có trong file tham chiếu.</p>
      <div className="review-actions"><button className="button secondary" onClick={() => setReview(false)}>Quay lại</button><button className="button primary" disabled>Chạy phân tích</button></div>
      <p className="shell-note">Bản giao diện chưa kết nối bộ chạy Quant.</p>
    </Modal>}
  </>;
}
function ScanList({ items, caution = false }: { items: ScanResult[]; caution?: boolean }) {
  return <div className="scan-list">{items.map((item) => <article className="scan-item" key={item.symbol}>
    <div className="scan-item-heading"><div><Link className="symbol-link" href={`/analysis?symbol=${item.symbol}`}>{item.symbol}</Link><span className={caution ? "negative" : "neutral"}>{item.recommendation}</span></div><strong className="number">{item.score}<span>/100</span></strong></div>
    <div className="scan-item-summary"><span>{item.sector}</span><Link className="text-link" href={`/analysis?symbol=${item.symbol}`}>Phân tích Quant ↗</Link></div>
    <details className="scan-explanation"><summary>Vì sao {caution ? "nên tránh" : "nổi bật"}?</summary>
      <ul className="condition-list">{item.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
      <Criteria result={item} />
      <details className="result-explanation"><summary>Nhận xét đầy đủ</summary><p>{item.explanation}</p></details>
    </details>
  </article>)}</div>;
}
