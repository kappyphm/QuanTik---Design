"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { stocks, scanSnapshot, getStock, getScanResult } from "@/lib/mock-data";
import { PageHeading } from "./ui";
import { QuantPanel } from "./quant-panel";

export function AnalysisPage() {
  const router = useRouter();
  const symbol = (useSearchParams().get("symbol") ?? "FPT").toUpperCase();
  const [draft, setDraft] = useState(symbol);
  const [error, setError] = useState("");
  useEffect(() => { setDraft(symbol); setError(""); }, [symbol]);
  const stock = getStock(symbol);
  const result = getScanResult(symbol);
  const symbols = [...new Set([...stocks.map((item) => item.symbol), ...scanSnapshot.best.map((item) => item.symbol), ...scanSnapshot.avoid.map((item) => item.symbol)])];
  return <>
    <PageHeading title="Phân tích Quant">
      <form className="analysis-picker" onSubmit={(event) => {
        event.preventDefault();
        const next = draft.trim().toUpperCase();
        if (!/^[A-Z][A-Z0-9]{2,4}$/.test(next)) { setError("Nhập mã cổ phiếu hợp lệ."); return; }
        router.replace(`/analysis?symbol=${next}`);
      }}>
        <label><span className="sr-only">Chọn mã phân tích</span><input aria-label="Chọn mã phân tích" value={draft} onChange={(event) => setDraft(event.target.value.toUpperCase())} list="quant-symbols" placeholder="Nhập mã cổ phiếu" /></label>
        <datalist id="quant-symbols">{symbols.map((item) => <option key={item} value={item} />)}</datalist>
        <button className="button secondary" type="submit">Chọn mã</button>
      </form>
    </PageHeading>
    {error && <p className="error-message" role="alert">{error}</p>}
    <section className="analysis-stock">
      <div className="stock-line"><h2>{symbol}</h2><span>{stock?.name ?? result?.sector ?? ""}</span>{stock && <span className="exchange-label">{stock.exchange}</span>}</div>
      {stock && <Link className="button secondary" href={`/charts?symbol=${symbol}`}>Biểu đồ ↗</Link>}
    </section>
    <section className="panel standalone-quant"><QuantPanel key={symbol} symbol={symbol} /></section>
  </>;
}
