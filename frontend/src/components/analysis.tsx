"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { stocks, scanSnapshot, getStock, getScanResult } from "@/lib/mock-data";
import { PageHeading } from "./ui";
import { QuantPanel } from "./quant-panel";
export function AnalysisPage() {
    const router = useRouter();
    const query = useSearchParams();
    const fromScreening = query.get("from") === "screening";
    const symbol = (query.get("symbol") ?? "FPT").toUpperCase();
    const [draft, setDraft] = useState(symbol);
    const [error, setError] = useState("");
    useEffect(() => { setDraft(symbol); setError(""); }, [symbol]);
    const stock = getStock(symbol);
    const result = getScanResult(symbol);
    const symbols = [...new Set([...stocks.map((item) => item.symbol), ...scanSnapshot.best.map((item) => item.symbol), ...scanSnapshot.avoid.map((item) => item.symbol)])];
    return <>
    <PageHeading title="Phân tích Quant">
      <form className="analysis-picker flex [gap:8px] items-center [&_input]:[border-width:1px] [&_input]:[border-style:solid] [&_input]:[border-color:var(--border)] [&_input]:[background:var(--surface)] [&_input]:[color:var(--text)] [&_input]:[padding:10px_12px] [&_input]:[border-radius:4px] [&_input]:[width:150px] [&_input]:[font-family:var(--font-mono),_monospace] [&_input]:[font-size:15px]" onSubmit={(event) => {
            event.preventDefault();
            const next = draft.trim().toUpperCase();
            if (!/^[A-Z][A-Z0-9]{2,4}$/.test(next)) {
                setError("Nhập mã cổ phiếu hợp lệ.");
                return;
            }
            router.replace(`/analysis?symbol=${next}`);
        }}>
        <label><span className="sr-only">Chọn mã phân tích</span><input aria-label="Chọn mã phân tích" value={draft} onChange={(event) => setDraft(event.target.value.toUpperCase())} list="quant-symbols" placeholder="Nhập mã cổ phiếu"/></label>
        <datalist id="quant-symbols">{symbols.map((item) => <option key={item} value={item}/>)}</datalist>
        <button className="button secondary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[background:var(--surface)] [.button&]:[border-color:var(--border)] [.button&]:[color:var(--text)] [.button&:hover]:[background:var(--raised)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" type="submit">Chọn mã</button>
      </form>
    </PageHeading>
    {error && <p className="error-message" role="alert">{error}</p>}
    <section className="analysis-stock flex items-center justify-between [gap:16px] [margin:2px_0_24px] max-[700px]:items-start max-[700px]:flex-wrap">
      <div className="stock-line flex items-center [gap:12px] flex-wrap [&_h2]:[font-size:27px] [&_h2]:[font-weight:600] [&_h2]:[line-height:1.2] [&_h2]:[margin:0] [&_>_span]:[color:var(--muted)] [&_>_span]:[font-size:15px] max-[700px]:[gap:9px] max-[700px]:[&_h2]:[font-size:26px]"><h2>{symbol}</h2><span>{stock?.name ?? result?.sector ?? ""}</span>{stock && <span className="exchange-label [font-size:14px]! [padding:2px_7px] [background:var(--raised)] [border-radius:4px]">{stock.exchange}</span>}</div>
      {stock && <Link className="button secondary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[background:var(--surface)] [.button&]:[border-color:var(--border)] [.button&]:[color:var(--text)] [.button&:hover]:[background:var(--raised)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" href={`/charts?symbol=${symbol}`}>Biểu đồ ↗</Link>}
    </section>
    <section className="panel standalone-quant [padding:24px] max-[700px]:[padding:18px] [background:var(--surface)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:4px] min-w-0 overflow-hidden"><>{fromScreening && <p role="status" className="mb-5 rounded-[4px] border border-[var(--border)] p-4 leading-7">Đây là giao diện phân tích Quant mô phỏng, chưa phải báo cáo được tạo từ kết quả quét. Việc mở trang này không tạo yêu cầu hoặc trừ hạn mức.</p>}<QuantPanel key={symbol} symbol={symbol}/></></section>
  </>;
}
