"use client";
import Link from "next/link";
import { useEffect } from "react";
import { stamp } from "@/lib/api/contracts";
import { screeningReason } from "@/lib/api/screening";
import { ResourceState, useResource } from "../account/common";

type Health = {
  calendar_status: string; processes: { role: string; state: string; count: number }[];
  screening: { published: { target_session: string; slot: string; published_at: number } | null;
    latest_attempt: { status: string; reason: string | null } | null; scheduled_provider_enabled: boolean;
    operations: { enabled: boolean; ingestion_enabled: boolean; screening_enabled: boolean } | null };
};
export function ScreeningHealth() {
  const result = useResource<Health>("admin/operations/health", "admin");
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === "visible") result.reload(); }, 30000); return () => clearInterval(timer); }, [result.reload]);
  const data = result.data, scan = data?.screening;
  return <section className="mb-6 rounded-[4px] border border-[var(--border)] p-5 text-sm leading-7"><h2 className="mb-2 text-lg font-semibold">Vận hành quét toàn sàn</h2><ResourceState {...result} retry={result.reload}/>{scan && <>
    <p>Bản công bố: {scan.published ? `${scan.published.target_session} · ${scan.published.slot} · ${stamp(scan.published.published_at)}` : "Chưa có"}</p>
    <p>Nạp theo lịch: {scan.scheduled_provider_enabled && scan.operations?.enabled && scan.operations.ingestion_enabled ? "Đã bật" : "Đang tắt"} · Quét: {scan.operations?.enabled && scan.operations.screening_enabled ? "Đã bật" : "Đang tắt"}</p>
    <p>Lịch giao dịch: {data?.calendar_status === "READY" ? "Trong phạm vi" : "Cần kiểm tra lịch"}</p>
    {scan.latest_attempt && <p>Lần gần nhất: {scan.latest_attempt.status === "READY" ? "Đã công bố" : screeningReason(scan.latest_attempt.reason)}</p>}
    {["scheduler", "schedule-worker:INGEST", "schedule-worker:SCREEN"].map(role => <p key={role}>{role}: {data?.processes.some(process => process.role === role && process.state === "RUNNING") ? "Đang chạy" : "Chưa ghi nhận tiến trình đang chạy"}</p>)}
    <div className="mt-3 flex flex-wrap gap-4 text-[var(--accent)] underline"><Link href="/admin/config/operations">Cấu hình vận hành</Link><Link href="/admin/config/integrations">Kết nối Vnstock</Link><Link href="/admin/config/calendar">Lịch giao dịch</Link></div>
  </>}</section>;
}
