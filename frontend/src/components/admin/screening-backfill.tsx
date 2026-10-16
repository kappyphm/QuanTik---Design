"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, mutation } from "@/lib/api/client";
import { stamp } from "@/lib/api/contracts";
import { accountStyles } from "../account/styles";
import { ErrorNotice, Field, Reason, ResourceState, useResource } from "../account/common";
import { Panel } from "../ui";

type BackfillTask = { id: string; target_session: string; status: string; attempt: number;
  reason: string | null; next_attempt_at: number; deadline: number; result: { reused?: boolean } | null };
type Options = { sessions: string[]; enabled: boolean; latest_task: BackfillTask | null };
const active = (status: string) => ["PENDING", "RUNNING", "WAITING"].includes(status);
const statuses: Record<string, string> = { PENDING: "Đang chờ worker", RUNNING: "Đang nạp dữ liệu và quét",
  WAITING: "Đang chờ thử lại", SUCCEEDED: "Đã có kết quả", FAILED: "Không hoàn tất", SKIPPED: "Đã bỏ qua" };
const reasons: Record<string, string> = {
  BACKFILL_YIELD_TO_SCHEDULE: "Đang nhường lượt xử lý cho lịch tự động; dữ liệu đã tải được giữ lại.",
  VNSTOCK_AUTH_NETWORK: "Chưa kết nối được dịch vụ đăng nhập của nguồn dữ liệu.",
  PROVIDER_API_KEY_MISSING: "Chưa cấu hình khóa kết nối Vnstock.",
  PROVIDER_BUDGET_EXHAUSTED: "Đã đạt giới hạn gọi nguồn dữ liệu; chờ hạn mức được mở lại.",
  PROVIDER_COOLDOWN: "Nguồn dữ liệu đang tạm nghỉ trước lần thử tiếp theo.",
  INGESTION_MANIFEST_NOT_READY: "Chưa tải đủ dữ liệu hợp lệ để quét.",
  TASK_OPERATOR_PAUSED: "Vận hành đang được tạm dừng trong cấu hình.",
  TASK_DEADLINE: "Đã hết thời gian xử lý yêu cầu này.",
  TASK_EXECUTION_DEADLINE: "Đã hết thời gian cho phép của lần xử lý.",
  TASK_ATTEMPTS_EXHAUSTED: "Đã hết số lần thử cho phép.",
};

function BackfillStatus({ id }: { id: string }) {
  const task = useResource<BackfillTask>(`admin/scheduled-tasks/${id}`, "admin");
  useEffect(() => {
    if (task.data && !active(task.data.status)) return;
    const timer = setInterval(() => { if (document.visibilityState === "visible") task.reload(); }, 5000);
    return () => clearInterval(timer);
  }, [task.data?.status, task.reload]);
  return <div className="mt-5 border-t border-[var(--border)] pt-4 text-sm leading-7" aria-live="polite">
    <ResourceState {...task} retry={task.reload}/>
    {task.data && <><p>Phiên {task.data.target_session} · {statuses[task.data.status] || task.data.status} · Lần chạy {task.data.attempt}</p>
      {task.data.reason && <p>Lý do: {reasons[task.data.reason] || "Không hoàn tất bước xử lý dữ liệu."} <small>({task.data.reason})</small></p>}
      {task.data.status === "WAITING" && <p>Thử lại lúc {stamp(task.data.next_attempt_at)}</p>}
      {active(task.data.status) && <p>Có thể đóng trang và quay lại sau. Hạn xử lý: {stamp(task.data.deadline)}.</p>}
      {task.data.status === "FAILED" && <p>Kiểm tra nguyên nhân và cấu hình, sau đó gửi lại yêu cầu chạy bù. Dữ liệu đã tải hợp lệ được tái sử dụng.</p>}
      {task.data.status === "SUCCEEDED" && <p>{task.data.result?.reused ? "Phiên đã có kết quả, không tính lại." : "Kết quả đã được lưu."} Trang screening giữ bản công bố mới nhất. <Link className="text-[var(--accent)] underline" href="/screener">Xem screening</Link></p>}
    </>}
  </div>;
}

export function ScreeningBackfill({ onAccepted }: { onAccepted: () => void }) {
  const options = useResource<Options>("admin/screening/backfill-options", "admin");
  const [target, setTarget] = useState(""), [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState<Error | null>(null), [taskId, setTaskId] = useState("");
  const [submission, setSubmission] = useState(0);
  const pending = useRef<{ payload: string; key: string } | null>(null);
  const selected = target || options.data?.sessions[0] || "";
  const id = taskId || options.data?.latest_task?.id;
  return <Panel title="Chạy bù screening"><div className={accountStyles.card}>
    <p>Nạp dữ liệu và quét phiên đã kết thúc. Yêu cầu chạy trên máy chủ, không cần giữ trang mở. Phiên cũ không thay thế bản công bố mới hơn.</p>
    <ResourceState {...options} retry={options.reload}/><ErrorNotice error={error}/>
    {options.data && <form className="mt-4 grid gap-3" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError(null);
      const body = { target_session: selected, reason: reason.trim() }, payload = JSON.stringify(body);
      if (pending.current?.payload !== payload) pending.current = { payload, key: crypto.randomUUID() };
      try {
        const result = await api<BackfillTask>("admin", "admin/screening/backfills", mutation("POST", body, pending.current.key));
        setTaskId(result.id); setSubmission(value => value + 1); pending.current = null; options.reload(); onAccepted();
      } catch (err) { setError(err as Error); } finally { setBusy(false); }
    }}>
      {!options.data.enabled && <p role="status">Chạy bù đang tắt. Bật vận hành, nạp dữ liệu, screening và kết nối Vnstock trong cấu hình.</p>}
      <fieldset disabled={busy || !options.data.enabled} className="grid min-w-0 gap-3">
        <Field label="Phiên cần chạy bù"><select required value={selected} onChange={event => setTarget(event.target.value)}>
          {!options.data.sessions.length && <option value="">Chưa có phiên đã kết thúc</option>}
          {options.data.sessions.map(day => <option key={day} value={day}>{day} · Kết phiên</option>)}
        </select></Field>
        <Reason value={reason} onChange={setReason}/>
        <button className={accountStyles.buttonPrimary} disabled={!selected || reason.trim().length < 10}>{busy ? "Đang gửi…" : "Chạy bù phiên đã chọn"}</button>
      </fieldset>
    </form>}
    {id && <BackfillStatus key={`${id}-${submission}`} id={id}/>}
  </div></Panel>;
}
