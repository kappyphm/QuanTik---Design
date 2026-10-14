"use client";
import { useState } from "react";
import { scanSnapshot, getScanResult, getDemoResult, demoEnabled, demoWeights, type ScanResult } from "@/lib/mock-data";
import { Modal, EmptyState } from "./ui";

export function Criteria({ result, expanded = !result, weightSuffix = " mẫu" }: { result?: ScanResult; expanded?: boolean; weightSuffix?: string }) {
  return <div className="criteria-grid">
    {scanSnapshot.criteria.map((group) => <details className="criteria-group" key={group.title} open={expanded}>
      <summary>{group.title}{demoEnabled && <span className="sample-group-weight">{demoWeights.find((item) => item.title === group.title)?.weight}%{weightSuffix}</span>}</summary>
      <dl>{group.metrics.map((metric) => <div key={metric.id}>
        <dt>{metric.label}</dt>
        <dd className="number">{result?.metrics[metric.id] ?? "—"}</dd>
      </div>)}</dl>
    </details>)}
  </div>;
}

export function QuantPanel({ symbol, compact = false }: { symbol: string; compact?: boolean }) {
  const [review, setReview] = useState(false);
  const [sample, setSample] = useState(false);
  const mockResult = getDemoResult(symbol);
  const result = mockResult ?? getScanResult(symbol);
  return <div className={`quant-panel ${compact ? "compact" : ""}`}>
    <div className="quant-panel-heading"><h2>Phân tích {symbol}</h2><button className="button primary" onClick={() => setReview(true)}>Chạy Quant {symbol}</button></div>
    {sample && result ? <>
      <div className="sample-stamp" role="status">{mockResult ? "Kết quả mô phỏng · không chạy Quant thật" : `Bản mẫu Excel · ${scanSnapshot.source.publishedLabel}`}</div>
      <div className="quant-action"><strong>{result.recommendation}</strong><span>{result.filter}</span></div>
      <ul className="condition-list">{result.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
      <Criteria result={result} />
      <details className="result-explanation"><summary>Nhận xét chi tiết</summary><p>{result.explanation}</p></details>
    </> : <EmptyState title="Chưa có kết quả">
      {result && <button className="button secondary" onClick={() => setSample(true)}>Xem kết quả mẫu</button>}
    </EmptyState>}
    {review && <Modal title={`Trước khi chạy Quant ${symbol}`} onClose={() => setReview(false)} className="criteria-dialog">
      <Criteria result={demoEnabled ? result : undefined} expanded />
      <p className="weight-note">{demoEnabled ? "Trọng số mẫu để thử giao diện, không phải trọng số hệ thống." : "Trọng số % chưa có trong file tham chiếu."}</p>
      <div className="review-actions"><button className="button secondary" onClick={() => setReview(false)}>Quay lại</button><button className="button primary" disabled={!demoEnabled || !result} onClick={() => { setSample(true); setReview(false); }}>Chạy phân tích mẫu</button></div>
      <p className="shell-note">Nạp kết quả từ JSON mẫu, không gọi backend.</p>
    </Modal>}
  </div>;
}
