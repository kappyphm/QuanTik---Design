"use client";
import { useState } from "react";
import { scanSnapshot, getScanResult, getDemoResult, demoEnabled, demoWeights, type ScanResult } from "@/lib/mock-data";
import { Modal, EmptyState } from "./ui";
import { QuantReport } from "./quant-report";
import TermHint, {AnnotatedText} from "./term-hint";
import {criterionTerms} from "@/content/legacy/glossary";

export function Criteria({ result, expanded = !result, weightSuffix = " mẫu" }: { result?: ScanResult; expanded?: boolean; weightSuffix?: string }) {
  return <div className="criteria-grid">
    {scanSnapshot.criteria.map((group) => <details className="criteria-group" key={group.title} open={expanded}>
      <summary>{group.title}{demoEnabled && <span className="sample-group-weight">{demoWeights.find((item) => item.title === group.title)?.weight}%{weightSuffix}</span>}</summary>
      <dl>{group.metrics.map((metric) => <div key={metric.id}>
        <dt>{criterionTerms[metric.id] ? <TermHint id={criterionTerms[metric.id]}>{metric.label}</TermHint> : metric.label}</dt>
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
      <QuantReport result={result} compact={compact} />
      <details className="quant-raw-metrics"><summary>Tất cả chỉ tiêu</summary><Criteria result={result} weightSuffix="" /></details>
      <details className="result-explanation quant-original-reading"><summary>Nhận định gốc</summary><p><AnnotatedText text={result.explanation}/></p></details>
    </> : <EmptyState title="Chưa có kết quả">
      {result && <button className="button secondary" onClick={() => setSample(true)}>Xem kết quả mẫu</button>}
    </EmptyState>}
    {review && <Modal title={`Trước khi chạy Quant ${symbol}`} onClose={() => setReview(false)} className="criteria-dialog">
      <Criteria result={demoEnabled ? result : undefined} expanded />
      <div className="review-actions"><button className="button secondary" onClick={() => setReview(false)}>Quay lại</button><button className="button primary" disabled={!demoEnabled || !result} onClick={() => { setSample(true); setReview(false); }}>Chạy phân tích mẫu</button></div>
    </Modal>}
  </div>;
}
