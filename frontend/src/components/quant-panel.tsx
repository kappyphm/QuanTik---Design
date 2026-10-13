"use client";
import { useState } from "react";
import { scanSnapshot, getScanResult, type ScanResult } from "@/lib/mock-data";
import { Modal, EmptyState } from "./ui";

export function Criteria({ result }: { result?: ScanResult }) {
  return <div className="criteria-grid">
    {scanSnapshot.criteria.map((group) => <details className="criteria-group" key={group.title} open={!result}>
      <summary>{group.title}</summary>
      <dl>{group.metrics.map((metric) => <div key={metric.id}>
        <dt>{metric.label}</dt>
        <dd className="number">{result?.metrics[metric.id as keyof typeof result.metrics] ?? "—"}</dd>
      </div>)}</dl>
    </details>)}
  </div>;
}

export function QuantPanel({ symbol, compact = false }: { symbol: string; compact?: boolean }) {
  const [review, setReview] = useState(false);
  const [sample, setSample] = useState(false);
  const result = getScanResult(symbol);
  return <div className={`quant-panel ${compact ? "compact" : ""}`}>
    <div className="quant-panel-heading"><h2>Phân tích {symbol}</h2><button className="button primary" onClick={() => setReview(true)}>Chạy Quant {symbol}</button></div>
    {sample && result ? <>
      <div className="sample-stamp">Bản mẫu Excel · {scanSnapshot.source.publishedLabel}</div>
      <div className="quant-action"><strong>{result.recommendation}</strong><span>{result.filter}</span></div>
      <ul className="condition-list">{result.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
      <Criteria result={result} />
      <details className="result-explanation"><summary>Nhận xét chi tiết</summary><p>{result.explanation}</p></details>
    </> : <EmptyState title="Chưa có kết quả">
      {result && <button className="button secondary" onClick={() => setSample(true)}>Xem kết quả mẫu</button>}
    </EmptyState>}
    {review && <Modal title={`Trước khi chạy Quant ${symbol}`} onClose={() => setReview(false)} className="criteria-dialog">
      <Criteria />
      <p className="weight-note">Trọng số % chưa có trong file tham chiếu.</p>
      <div className="review-actions"><button className="button secondary" onClick={() => setReview(false)}>Quay lại</button><button className="button primary" disabled>Chạy phân tích</button></div>
      <p className="shell-note">Bản giao diện chưa kết nối bộ chạy Quant.</p>
    </Modal>}
  </div>;
}
