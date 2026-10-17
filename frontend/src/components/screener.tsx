"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Search, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { money } from "@/lib/api/contracts";
import type { ScreeningItem, ScreeningLatest, ScreeningResults } from "@/lib/api/screening";
import { Guard } from "./account/session";
import { ErrorNotice } from "./account/common";
import { PageHeading, Panel } from "./ui";

const control = "min-h-11 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm disabled:opacity-50";
const percent = (v: number) => new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 1 }).format(v);
type Publication = { latest: ScreeningLatest; best: ScreeningItem[]; avoid: ScreeningItem[] };

export function Screener() {
  return <><PageHeading title="Quét toàn sàn"/><Guard><ScreeningBoard/></Guard></>;
}
function ScreeningBoard() {
  const [started, setStarted] = useState(false), [version, setVersion] = useState(0);
  const [publication, setPublication] = useState<Publication>(), [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!started) return;
    let active = true; setLoading(true);
    void (async () => {
      const latest = await api<ScreeningLatest>("user", "screenings/latest");
      const groups = ["OVERALL", "DISTRIBUTION"] as const;
      const pages = await Promise.all(groups.map(group => api<ScreeningResults>("user", `screenings/${encodeURIComponent(latest.id)}/results?group=${group}&limit=5`)));
      if (pages.some((page, i) => page.run_id !== latest.id || page.group !== groups[i])) throw new Error("Chưa tải được kết quả phù hợp. Vui lòng thử lại.");
      if (active) { setPublication({ latest, best: pages[0].items.slice(0,5), avoid: pages[1].items.slice(0,5) }); setError(undefined); }
    })().catch(err => { if (active) { setError(err); if (err instanceof ApiError && [401,403].includes(err.status)) setPublication(undefined); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [started, version]);
  const forbidden = error instanceof ApiError && error.code === "SCREENING_SUBSCRIPTION_REQUIRED";
  const notReady = error instanceof ApiError && error.code === "SCREENING_NOT_READY";
  useEffect(() => {
    if (!started || loading || forbidden) return;
    const refresh = () => { if (document.visibilityState === "visible") setVersion(v => v+1); };
    const timer = setTimeout(refresh,60000);
    document.addEventListener("visibilitychange",refresh);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange",refresh); };
  }, [started, loading, forbidden, version]);
  return <>
    <section className="scan-intro mb-6 overflow-hidden rounded-[4px] border border-[var(--border)] bg-[var(--surface)] [background-image:linear-gradient(145deg,transparent_43%,var(--accent-soft)_65%,transparent_90%)]" aria-labelledby="scan-intro-title">
      <div className="grid min-h-[380px] items-center gap-6 p-7 min-[900px]:grid-cols-2 min-[900px]:p-12">
        <div className="min-w-0">
          <span className="text-sm text-[var(--positive)]">Góc nhìn toàn thị trường</span>
          <h2 id="scan-intro-title" className="my-6 text-4xl font-semibold leading-tight tracking-tight min-[900px]:text-5xl">Khai mở góc nhìn<br/><em className="not-italic text-[var(--accent)]">toàn sàn.</em></h2>
          <p className="max-w-lg leading-7 text-[var(--muted)]">Tìm 5 mã nổi bật và nhận diện 5 mã nên tránh để chủ động theo dõi thị trường.</p>
          <button className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-[4px] bg-[var(--accent)] px-5 py-3 font-medium text-[#172016] disabled:opacity-50" disabled={loading} onClick={() => { setStarted(true); setVersion(v => v+1); }}>{loading ? "Đang tải kết quả…" : started ? "Quét lại" : "Kích hoạt quét"}<ArrowUpRight size={20} aria-hidden="true"/></button>
        </div>
        <ScanIllustration/>
      </div>
      <div className="grid gap-5 border-t border-[var(--border)] px-7 py-5 text-sm min-[700px]:grid-cols-2 min-[900px]:px-12">
        <div className="flex items-center gap-3"><Search size={21} aria-hidden="true"/><span>Tìm 5 mã nổi bật để theo dõi</span></div>
        <div className="flex items-center gap-3"><ShieldCheck size={21} aria-hidden="true"/><span>Nhận diện 5 mã cần thận trọng</span></div>
      </div>
    </section>
    {started && <div className="grid gap-5" aria-live="polite">
      {forbidden ? <section className="rounded-[4px] border border-[var(--border)] p-6"><h2 className="text-xl">Cần gói phân tích còn hiệu lực</h2><p className="my-3">Kích hoạt gói để xem kết quả quét.</p><Link className="text-[var(--accent)] underline" href="/plans">Xem các gói phân tích</Link></section>
        : notReady && !publication ? <section role="status" className="rounded-[4px] border border-[var(--border)] p-6"><h2 className="text-xl">Chưa có kết quả được công bố</h2><p className="mt-3 text-[var(--muted)]">Kết quả sẽ xuất hiện tại đây khi dữ liệu sẵn sàng.</p></section>
        : error && !publication ? <ErrorNotice error={error}/> : null}
      {publication && <>
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="text-xl font-semibold">Kết quả quét</h2><p className="text-sm text-[var(--muted)]">Dữ liệu ngày {publication.latest.target_session.split("-").reverse().join("/")}</p></div>
        {(publication.latest.stale || error) && <p role="status" className="text-sm text-[var(--muted)]">Đang hiển thị kết quả gần nhất. Kết quả mới sẽ tự cập nhật khi sẵn sàng.</p>}
        <div className="grid min-w-0 gap-6 min-[900px]:grid-cols-2"><ScreeningList items={publication.best} title="5 mã nổi bật"/><ScreeningList items={publication.avoid} title="5 mã nên tránh"/></div>
      </>}
    </div>}
  </>;
}
function ScreeningList({ items, title }: { items: ScreeningItem[]; title: string }) {
  return <Panel title={title}><div className="min-w-0 px-5 pb-5">{!items.length && <p className="py-5 text-[var(--muted)]">Chưa có mã phù hợp.</p>}{items.map(item => <article key={item.symbol} className="border-t border-[var(--border)] py-5 first:border-t-0">
    <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold"><Link href={`/charts?symbol=${encodeURIComponent(item.symbol)}&exchange=${encodeURIComponent(item.exchange || "")}`}>{item.symbol}</Link><span className="ml-2 text-xs font-normal text-[var(--muted)]">{item.exchange}</span></h3><span className="text-sm">{new Intl.NumberFormat("vi-VN",{ maximumFractionDigits:1 }).format(item.score)}/100</span></div>
    <p className="my-2 flex flex-wrap gap-3 text-sm"><span>{typeof item.price_vnd === "number" ? money(item.price_vnd) : "—"}</span>{typeof item.change_ratio === "number" && <span className={item.change_ratio < 0 ? "text-[var(--negative)]" : "text-[var(--positive)]"}>{percent(item.change_ratio)}</span>}</p>
    {item.recommendation && <p className="mb-3 text-sm text-[var(--muted)]">{item.recommendation}</p>}
    <Link className="text-sm text-[var(--accent)]" href={`/analysis?symbol=${encodeURIComponent(item.symbol)}`}>Phân tích Quant ↗</Link>
  </article>)}</div></Panel>;
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
