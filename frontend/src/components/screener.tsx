"use client";
import { tw } from "@/lib/tailwind";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Search, ShieldCheck, ChartNoAxesCombined } from "lucide-react";
import { scanSnapshot, demoEnabled, type ScanResult } from "@/lib/mock-data";
import { PageHeading, Panel } from "./ui";
import { Criteria } from "./quant-panel";
import { QuantReport } from "./quant-report";
import { AnnotatedText } from "./term-hint";
export function Screener() {
    const [loaded, setLoaded] = useState(false);
    return <>
    <PageHeading title="Quét toàn sàn">{loaded && <>
      <button className="button primary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[color:#172016]! [.button&]:[background:var(--accent)] [.button&]:[border-color:var(--accent)] [.terminal[data-theme='light']_.button&]:[color:white]! [.button&:hover]:[background:color-mix(in_srgb,_var(--accent)_85%,_white)] [.button&:hover]:[transform:translateY(-1px)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" onClick={() => setLoaded(false)}>Quét lại</button>
    </>}</PageHeading>
    {!loaded ? <section className="scan-intro overflow-hidden [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:4px] [background:linear-gradient(145deg,_transparent_43%,_color-mix(in_srgb,_var(--positive)_7%,_transparent)_43%,_color-mix(in_srgb,_var(--positive)_7%,_transparent)_65%,_var(--accent-soft)_65%,_transparent_90%),_var(--surface)]" aria-labelledby="scan-intro-title">
      <div className="scan-intro-main grid [grid-template-columns:1.05fr_1fr] items-center [gap:24px] [padding:clamp(28px,_4vw,_56px)] [min-height:420px] max-[1000px]:[grid-template-columns:1fr] max-[1000px]:[gap:12px] max-[700px]:[padding:28px_22px_8px] max-[700px]:[min-height:0]">
        <div className="scan-intro-copy min-w-0 [&_h2]:[font-size:clamp(34px,_3.2vw,_54px)] [&_h2]:[font-weight:600] [&_h2]:[line-height:1.16] [&_h2]:[letter-spacing:-.04em] [&_h2]:[margin:26px_0_20px] [&_h2_em]:[color:var(--accent)] [&_h2_em]:[font-style:normal] [&_>_p]:[font-size:18px] [&_>_p]:[line-height:1.7] [&_>_p]:[max-width:490px] [&_>_p]:[color:var(--muted)] [&_>_p]:[margin:0] max-[700px]:[&_>_p]:[font-size:17px] max-[700px]:[&_h2]:[margin-top:22px]">
          <span className="scan-intro-eyebrow inline-flex items-center [gap:10px] [color:var(--positive)] [font-size:15px] [font-weight:500] [&::before]:[content:''] [&::before]:[width:7px] [&::before]:[height:7px] [&::before]:[border-radius:50%] [&::before]:[background:currentColor]">Góc nhìn toàn thị trường</span>
          <h2 id="scan-intro-title">Khai mở góc nhìn<br /><em>toàn sàn.</em></h2>
          <p>Tìm 5 mã nổi bật, nhận diện 5 mã nên tránh và khám phá lý do phía sau từng lựa chọn.</p>
          <div className="scan-intro-actions flex items-center flex-wrap [gap:12px] [margin-top:30px] max-[700px]:[align-items:stretch]">
            <button className="button primary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[color:#172016]! [.button&]:[background:var(--accent)] [.button&]:[border-color:var(--accent)] [.terminal[data-theme='light']_.button&]:[color:white]! [.button&:hover]:[background:color-mix(in_srgb,_var(--accent)_85%,_white)] [.button&:hover]:[transform:translateY(-1px)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" disabled={!demoEnabled} onClick={() => setLoaded(true)}>Quét toàn sàn <ArrowUpRight size={22} aria-hidden="true"/></button>
          </div>
        </div>
        <ScanIllustration />
      </div>
      <div className="scan-intro-features grid [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:24px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--border)] [padding:28px_0] [margin:0_clamp(28px,_4vw,_56px)] [&_>_div]:flex [&_>_div]:items-start [&_>_div]:[gap:12px] [&_>_div]:min-w-0 [&_svg]:[color:var(--positive)] [&_svg]:[flex-shrink:0] [&_svg]:[margin-top:3px] [&_h3]:[font-size:17px] [&_h3]:[font-weight:500] [&_h3]:[margin:0_0_6px] [&_p]:[font-size:15px] [&_p]:[color:var(--muted)] [&_p]:[margin:0] max-[700px]:[grid-template-columns:1fr] max-[700px]:[gap:22px] max-[700px]:[margin:0_22px] max-[700px]:[padding:24px_0]">
        <div><Search size={22} aria-hidden="true"/><div><h3>Tìm cơ hội</h3><p>5 mã nổi bật để theo dõi</p></div></div>
        <div><ShieldCheck size={22} aria-hidden="true"/><div><h3>Nhận diện rủi ro</h3><p>5 mã cần thận trọng</p></div></div>
        <div><ChartNoAxesCombined size={22} aria-hidden="true"/><div><h3>Hiểu từng mã</h3><p>Xem lý do và phân tích Quant</p></div></div>
      </div>
    </section> : <>
    <div className="scan-results-heading flex [align-items:baseline] justify-between flex-wrap [gap:12px] [margin-bottom:20px] [&_h2]:[font-size:22px] [&_h2]:[font-weight:500] [&_h2]:[margin:0] [&_span]:[color:var(--muted)] [&_span]:[font-size:16px]"><h2>Kết quả quét</h2><span role="status">10 mã · 2 nhóm</span></div>
    <div className="scan-grid scan-results grid [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:24px] max-[900px]:[grid-template-columns:1fr]">
      <Panel title="5 mã nổi bật"><ScanList items={scanSnapshot.best}/></Panel>
      <Panel title="5 mã nên tránh"><ScanList items={scanSnapshot.avoid} caution/></Panel>
    </div>
    </>}
  </>;
}
function ScanList({ items, caution = false }: {
    items: ScanResult[];
    caution?: boolean;
}) {
    return <div className="scan-list [padding:0_22px] max-[700px]:[padding:0_18px]">{items.map((item) => <article className="scan-item [padding:20px_0] [.scan-item_+_&]:[border-top-width:1px] [.scan-item_+_&]:[border-top-style:solid] [.scan-item_+_&]:[border-top-color:var(--border)]" key={item.symbol}>
    <div className="scan-item-heading flex justify-between [gap:12px] items-center [&_>_div]:flex [&_>_div]:items-center [&_>_div]:[gap:12px] [&_>_div_>_span]:[font-size:13px] [&_>_strong]:[font-size:24px] [&_>_strong]:[font-weight:500] [&_>_strong_>_span]:[font-size:13px] [&_>_strong_>_span]:[color:var(--muted)]"><div><Link className="symbol-link [background:none] [border-width:0] [font:600_16px_var(--font-mono),_monospace] [color:var(--text)] [padding:0] text-left [&:hover]:[color:var(--accent)]" href={`/analysis?symbol=${item.symbol}`}>{item.symbol}</Link><span className={tw(caution ? "negative" : "neutral")}>{item.recommendation}</span></div><strong className="number [font-family:var(--font-mono),_ui-monospace,_monospace] [font-variant-numeric:tabular-nums] [letter-spacing:-0.025em]">{item.score}<span>/100</span></strong></div>
    <div className="scan-item-summary flex justify-between [gap:12px] items-center [margin-top:7px] [color:var(--muted)] [font-size:14px] [&_>_span]:min-w-0 [&_>_span]:overflow-hidden [&_>_span]:[text-overflow:ellipsis] [&_>_span]:whitespace-nowrap [&_a]:[flex-shrink:0]"><span>{item.sector}</span><Link className="text-link [.auth-stage_.account-login_&]:[font-size:12px] [.auth-stage_.account-login_&]:[color:var(--muted)]" href={`/analysis?symbol=${item.symbol}`}>Phân tích Quant ↗</Link></div>
    <details className="scan-explanation [margin-top:13px] [&_>_summary]:[color:var(--accent)] [&_>_summary]:[font-size:14px] [&_>_summary]:cursor-pointer"><summary>Vì sao {caution ? "nên tránh" : "nổi bật"}?</summary>
      <ul className="condition-list [padding-left:20px] [margin:16px_0] [color:var(--muted)] [font-size:15px] [line-height:1.65] [&_li_+_li]:[margin-top:7px]">{item.conditions.map((condition) => <li key={condition}><AnnotatedText text={condition}/></li>)}</ul>
      <QuantReport result={item} compact showAction={false}/>
      <details className="quant-raw-metrics [margin-top:24px] [&_>_summary]:[font-size:15px] [&_>_summary]:[color:var(--muted)] [&_>_summary]:cursor-pointer"><summary>Tất cả chỉ tiêu</summary><Criteria result={item} weightSuffix=""/></details>
      <details className="result-explanation [&_>_summary]:[color:var(--accent)] [&_>_summary]:[font-size:14px] [&_>_summary]:cursor-pointer [margin-top:18px] [&_p]:[white-space:pre-line] [&_p]:[color:var(--muted)] [&_p]:[font-size:15px] [&_p]:[line-height:1.7]"><summary>Nhận xét đầy đủ</summary><p><AnnotatedText text={item.explanation}/></p></details>
    </details>
  </article>)}</div>;
}
function ScanIllustration() {
    return <div className="scan-intro-visual min-w-0 [&_svg]:block [&_svg]:w-full [&_svg]:[height:auto] max-[1000px]:[max-width:520px] max-[1000px]:w-full max-[1000px]:[justify-self:center]" aria-hidden="true">
    <svg viewBox="0 0 620 420" focusable="false">
      <g className="scan-visual-grid [opacity:.22]" fill="none" stroke="var(--positive)" strokeWidth="1">
        <path d="M30 230 310 70 590 230 310 390Z M100 270 380 110 M170 310 450 150 M240 350 520 190 M100 190 380 350 M170 150 450 310 M240 110 520 270"/>
      </g>
      <path d="M45 285 150 225 250 170 335 115 445 180 595 270" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round"/>
      {[{ x: 100, y: 228, h: 32 }, { x: 170, y: 205, h: 42 }, { x: 240, y: 178, h: 36 }, { x: 310, y: 165, h: 44 }, { x: 380, y: 133, h: 40 }, { x: 450, y: 110, h: 35 }].map((c, i) => <g key={c.x} fill={i === 3 ? "var(--accent)" : "var(--positive)"} stroke={i === 3 ? "var(--accent)" : "var(--positive)"}>
        <line x1={c.x} x2={c.x} y1={c.y - 20} y2={c.y + c.h + 24}/>
        <rect x={c.x - 8} y={c.y} width="16" height={c.h} stroke="none"/>
      </g>)}
      <circle cx="380" cy="154" r="68" fill="var(--surface)" fillOpacity=".15" stroke="var(--positive)" strokeWidth="1.5"/>
      <path d="M428 204 479 255" stroke="var(--accent)" strokeWidth="10"/>
      <path d="M380 67V86 M380 222V241 M293 154H312 M448 154H467" stroke="var(--positive)" strokeWidth="1.5"/>
    </svg>
  </div>;
}
