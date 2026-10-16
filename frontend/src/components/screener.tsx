"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { money, stamp } from "@/lib/api/contracts";
import { groupLabels, screeningReason, type ScreeningGroup, type ScreeningItem, type ScreeningLatest, type ScreeningResults, type ScreeningRun, type ScreeningSlot } from "@/lib/api/screening";
import { Guard } from "./account/session";
import { ErrorNotice } from "./account/common";
import { PageHeading, Panel } from "./ui";

const control = "min-h-11 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm disabled:opacity-50";
const criterionLabels: Record<string, string> = {
  S1_RS_market: "Mạnh hơn thị trường", S2_vol_spike: "Khối lượng đột biến", S3_near_high20: "Gần đỉnh 20 phiên", S4_vol_dry_pullback: "Khối lượng thu hẹp", S5_breakout_high20: "Vượt đỉnh 20 phiên", S6_hh_hl_structure: "Đỉnh và đáy tăng", S7_RS_10d: "Sức mạnh tương đối 10 phiên",
  A1_tight_range: "Biên độ tích lũy hẹp", A2_vol_declining: "Khối lượng giảm", A3_absorption: "Hấp thụ cung", A4_above_ma20: "Trên MA20", A5_near_resistance: "Gần kháng cự", A6_long_accumulation: "Tích lũy kéo dài", A7_spring: "Rũ bỏ dưới hỗ trợ",
  D1_vol_no_price_up: "Khối lượng lớn, giá không tăng", D2_long_upper_shadow: "Bóng nến trên dài", D3_failed_breakout: "Vượt đỉnh thất bại", D4_vol_on_down: "Khối lượng lớn ở phiên giảm", D5_below_ma20: "Dưới MA20", D6_drop_from_peak: "Giảm từ đỉnh", D7_multi_dist_sessions: "Nhiều phiên phân phối",
};
const percent = (v: number) => new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 1 }).format(v);
const score = (v: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(v);
const slotLabel = (r: ScreeningRun) => `${r.target_session.split("-").reverse().join("/")} · ${r.slot === "AM" ? "Ca sáng (tạm tính)" : "Ca chiều (hoàn tất)"}`;

export function Screener() {
  return <><PageHeading title="Quét toàn sàn"/><Guard><ScreeningBoard/></Guard></>;
}
function ScreeningBoard() {
  const [slot, setSlot] = useState<ScreeningSlot>("ALL");
  return <><p className="mb-5 leading-7 text-[var(--muted)]">Kết quả cập nhật theo ca giao dịch. Xem kết quả không sử dụng hạn mức yêu cầu phân tích trong ngày.</p>
    <label className="mb-5 flex flex-wrap items-center gap-3 text-sm">Ca công bố<select aria-label="Ca công bố" className={control} value={slot} onChange={e => setSlot(e.target.value as ScreeningSlot)}><option value="ALL">Mới nhất</option><option value="AM">Ca sáng</option><option value="PM">Ca chiều</option></select></label>
    <Publication key={slot} slot={slot}/></>;
}
function Publication({ slot }: { slot: ScreeningSlot }) {
  const [latest, setLatest] = useState<ScreeningLatest>(), [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true), [version, setVersion] = useState(0);
  const [group, setGroup] = useState<ScreeningGroup | "OVERVIEW">("OVERVIEW");
  const reload = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    let active = true; setLoading(true);
    void api<ScreeningLatest>("user", `screenings/latest?slot=${slot}`).then(data => {
      if (active) { setLatest(data); setError(undefined); }
    }).catch(err => { if (active) { setError(err); if (err instanceof ApiError && [401, 403].includes(err.status)) setLatest(undefined); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slot, version]);
  const forbidden = error instanceof ApiError && error.code === "SCREENING_SUBSCRIPTION_REQUIRED";
  useEffect(() => {
    if (loading || forbidden) return;
    const timer = setTimeout(() => { if (document.visibilityState === "visible") reload(); }, 60000);
    const visible = () => { if (document.visibilityState === "visible") reload(); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", visible); };
  }, [loading, forbidden, version, reload]);
  if (forbidden) return <section className="rounded-[4px] border border-[var(--border)] p-6"><h2 className="text-xl">Cần gói phân tích còn hiệu lực</h2><p className="my-3">Mua hoặc gia hạn gói để xem các kết quả quét định kỳ.</p><Link className="text-[var(--accent)] underline" href="/plans">Xem các gói phân tích</Link></section>;
  const notReady = error instanceof ApiError && error.code === "SCREENING_NOT_READY";
  const attempt = latest?.latest_attempt || (notReady ? error.payload?.latest_attempt as ScreeningRun | null : null);
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--muted)]">Giờ Việt Nam · Sáng 11:30–12:55 · Chiều sau 16:00 đến 17:30 · Theo lịch giao dịch</p><button className={control} disabled={loading} onClick={reload}>{loading ? "Đang cập nhật…" : "Cập nhật kết quả"}</button></div>
    {loading && !latest && <p role="status" className="py-6">Đang tải kết quả quét…</p>}
    {error && !notReady && <ErrorNotice error={error}/>}
    {notReady && !latest && <section role="status" className="rounded-[4px] border border-[var(--border)] p-6"><h2 className="text-xl">Chưa có kết quả được công bố</h2><p className="mt-3">Hệ thống sẽ tự cập nhật khi có kết quả cho ca này.</p></section>}
    {attempt && attempt.status !== "READY" && <p role="status" className="my-4 rounded-[4px] border border-[var(--border)] p-4 leading-7">Lần xử lý gần nhất: {slotLabel(attempt)}. {screeningReason(attempt.reason)}.{latest && " Bạn đang xem bản công bố trước đó."}</p>}
    {latest && <>
      <section className="mb-6 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-5 leading-7"><h2 className="text-xl">Kết quả {slotLabel(latest)}</h2><p className="mt-2 text-sm text-[var(--muted)]">Công bố {stamp(latest.published_at)} · Dữ liệu {latest.summary.ready_symbols}/{latest.summary.expected_symbols} mã · Độ phủ {percent(latest.summary.history_coverage_ratio)}</p>
        {latest.summary.validation_scope === "SCREENING_ONLY" && <p className="mt-2 text-sm">Đã kiểm tra hợp đồng dữ liệu phục vụ sàng lọc. Điều chỉnh giá do sự kiện doanh nghiệp chưa được xác minh.</p>}
        {latest.stale && <p role="status" className="mt-3 text-[var(--accent)]">{latest.stale_reasons.map(screeningReason).join(". ")}. Kết quả có thể chưa phản ánh ca hiện tại.</p>}
        {error && <p className="mt-2">Chưa cập nhật được trạng thái mới. Dữ liệu dưới đây thuộc bản công bố đã ghi ngày ở trên.</p>}
      </section>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Nhóm kết quả">{(["OVERVIEW", "OVERALL", "STRONG", "ACCUMULATION", "DISTRIBUTION", "ALL"] as const).map(value => <button className={`${control} ${group === value ? "text-[var(--accent)] border-[var(--accent)]" : ""}`} key={value} aria-pressed={group === value} onClick={() => setGroup(value)}>{value === "OVERVIEW" ? "Tổng quan" : groupLabels[value]}</button>)}</div>
      {group === "OVERVIEW" ? <div className="grid gap-6 min-[900px]:grid-cols-2"><ScreeningList key={`${latest.id}-OVERALL`} runId={latest.id} group="OVERALL" title="Mã nổi bật"/><ScreeningList key={`${latest.id}-DISTRIBUTION`} runId={latest.id} group="DISTRIBUTION" title="Cảnh báo phân phối"/></div> : <ScreeningList key={`${latest.id}-${group}`} runId={latest.id} group={group} title={groupLabels[group]}/>}
    </>}
  </>;
}
function ScreeningList({ runId, group, title }: { runId: string; group: ScreeningGroup; title: string }) {
  const [items, setItems] = useState<ScreeningItem[]>([]), [cursor, setCursor] = useState<string>();
  const [next, setNext] = useState<string | null>(null), [error, setError] = useState<Error>(), [loading, setLoading] = useState(true), [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError(undefined);
    void api<ScreeningResults>("user", `screenings/${encodeURIComponent(runId)}/results?group=${group}&limit=5${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`).then(data => {
      if (data.run_id !== runId || data.group !== group) throw new Error("Kết quả chưa khớp kỳ đang xem. Vui lòng cập nhật lại.");
      if (active) { setItems(old => cursor ? [...old, ...data.items.filter(item => !old.some(row => row.symbol === item.symbol))] : data.items); setNext(data.next_cursor); }
    }).catch(err => { if (active) { setError(err); if (err instanceof ApiError && [401, 403].includes(err.status)) setItems([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [runId, group, cursor, version]);
  return <Panel title={title}><div className="min-w-0 px-5 pb-5"><ErrorNotice error={error}/>{loading && <p role="status" className="py-4">Đang tải danh sách…</p>}{!loading && !error && !items.length && <p className="py-5 text-[var(--muted)]">Không có mã đủ điều kiện trong nhóm này.</p>}
    {group === "DISTRIBUTION" && <p className="py-3 text-sm text-[var(--muted)]">Điểm cao thể hiện nhiều dấu hiệu phân phối, cần thận trọng.</p>}
    {items.map(item => <ScreeningCard key={item.symbol} item={item} group={group}/>)}
    {error ? <button className={control} disabled={loading} onClick={() => setVersion(v => v + 1)}>Thử lại danh sách</button> : next && <button className={control} disabled={loading} onClick={() => setCursor(next)}>Xem thêm</button>}
  </div></Panel>;
}
function ScreeningCard({ item, group }: { item: ScreeningItem; group: ScreeningGroup }) {
  const value = item.groups[group]?.score ?? item.overall_score;
  const complete = group === "ALL" || group === "OVERALL" ? item.ranking_eligible : item.groups[group]?.ranking_eligible;
  const price = item.price_summary.close, change = item.price_summary.pct_change_1d;
  return <article className="min-w-0 border-t border-[var(--border)] py-5 first:border-t-0">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-mono text-lg font-semibold">{item.symbol} <span className="text-xs font-normal text-[var(--muted)]">{item.exchange}</span></h3><strong className="font-mono text-xl">{score(value)}<span className="text-xs text-[var(--muted)]">/100</span></strong></div>
    <p className="my-2 flex flex-wrap gap-3 text-sm text-[var(--muted)]">{typeof price === "number" && <span>{money(price)}</span>}{typeof change === "number" && <span>{percent(change)}</span>}<span>{complete ? "Đủ điều kiện xếp hạng" : "Chưa đủ điều kiện xếp hạng"}</span></p>
    <details className="my-3"><summary className="cursor-pointer text-sm text-[var(--accent)]">Xem tiêu chí và lý do</summary>
      {Object.entries(item.groups).map(([name, details]) => <section key={name} className="my-4 min-w-0"><h4 className="text-sm font-semibold">{groupLabels[name as ScreeningGroup] || name} · {score(details.score)}/100</h4><p className="mt-1 text-xs text-[var(--muted)]">{details.true_count} đạt · {details.false_count} không đạt · {details.unavailable_count} thiếu dữ liệu</p><ul className="mt-2 divide-y divide-[var(--border)] text-sm">{Object.entries(details.criteria).map(([key, criterion]) => <li className="py-2" key={key}><div className="flex justify-between gap-3"><span>{criterionLabels[key] || key}</span><span className={criterion.state === "TRUE" ? "text-[var(--positive)]" : "text-[var(--muted)]"}>{criterion.state === "TRUE" ? "Đạt" : criterion.state === "FALSE" ? "Không đạt" : "Chưa đủ dữ liệu"}</span></div><p className="mt-1 break-words text-xs leading-5 text-[var(--muted)]">{criterion.detail}{criterion.state === "UNAVAILABLE" && ` · Cần ít nhất ${criterion.minimum_bars} phiên`}</p></li>)}</ul></section>)}
      {[...new Set([...item.warnings, ...item.rejection_reasons])].map(reason => <p className="my-2 text-xs leading-5 text-[var(--muted)]" key={reason}>{screeningReason(reason)}</p>)}
      {item.volume_context.observed_at && <p className="text-xs text-[var(--muted)]">Quan sát lúc {stamp(item.volume_context.observed_at)}</p>}
    </details>
    <Link className="text-sm text-[var(--accent)] underline" href={`/analysis?symbol=${encodeURIComponent(item.symbol)}&from=screening`}>Mở phân tích Quant ↗</Link>
  </article>;
}
