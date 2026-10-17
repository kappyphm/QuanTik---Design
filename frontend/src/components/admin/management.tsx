"use client";
import { accountStyles } from "@/components/account/styles";
import { ScreeningHealth } from "./screening-health";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ScreeningBackfill } from "./screening-backfill";
import { api, mutation } from "@/lib/api/client";
import { money, stamp, paymentStatus, paymentReason } from "@/lib/api/contracts";
import { PageHeading, Panel } from "../ui";
import { Confirm, ErrorNotice, Field, PagedTable, Reason, ResourceState, useResource, type Column, type Row } from "../account/common";
import type { AdminOrder } from "./billing";
const date = (key: string, label: string): Column => ({ key, label, render: v => stamp(v as number | string | null) });
const amount: Column = { key: "amount_vnd", label: "Số tiền", render: v => money(Number(v)) };
const jobs: Column[] = [{ key: "id", label: "Mã yêu cầu" }, { key: "symbol", label: "Mã CK" }, { key: "target_session", label: "Phiên" }, { key: "status", label: "Trạng thái", render: v => String(v) }, { key: "reason", label: "Lý do", render: v => v ? String(v) : "—" }, date("compute_started_at", "Bắt đầu tính")];
const subscriptions: Column[] = [{ key: "id", label: "Mã kỳ gói" }, { key: "account_id", label: "Tài khoản" }, { key: "plan_id", label: "Phiên bản gói" }, { key: "order_id", label: "Đơn", render: v => v ? <Link className="text-[var(--accent)] underline" href={`/admin/orders?order_id=${encodeURIComponent(String(v))}`}>{String(v)}</Link> : "Cấp khi đăng ký" }, date("valid_from", "Bắt đầu"), date("valid_until", "Kết thúc")];
export function UsersPage() {
    const [selected, setSelected] = useState<Row | null>(null), [reason, setReason] = useState("");
    const [review, setReview] = useState(false), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0), [error, setError] = useState<Error | null>(null), [notice, setNotice] = useState("");
    const [tab, setTab] = useState("subscriptions");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("");
    return <><PageHeading title="Người dùng" description="Quản lý trạng thái tài khoản và tra cứu các kỳ gói, yêu cầu phân tích."/><ErrorNotice error={error}/>{notice && <p className="account-notice [padding:16px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-left-width:3px] [border-left-style:solid] [border-left-color:var(--accent)] [border-radius:4px] [line-height:1.7] [margin:16px_0] [overflow-wrap:anywhere] [&_small]:block [&_small]:[font-size:11px]" role="status">{notice}</p>}<form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setFilter(search.trim()); setSelected(null); }}><Field label="Tìm theo tên, email hoặc mã tài khoản"><input value={search} maxLength={120} onChange={e => setSearch(e.target.value)}/></Field><button className="mb-2 min-h-10 rounded-[4px] border border-[var(--border)] px-4">Tìm người dùng</button></form><Panel title="Danh sách tài khoản"><div className={accountStyles.card}><PagedTable path={"admin/users" + (filter ? "?q=" + encodeURIComponent(filter) : "")} revision={revision} columns={[{ key: "display_name", label: "Tên khách hàng" }, { key: "email", label: "Email" }, { key: "phone_number", label: "Số điện thoại" }, { key: "date_of_birth", label: "Ngày sinh" }, { key: "age", label: "Tuổi" }, { key: "id", label: "Mã tài khoản", render: v => <details><summary>Xem mã</summary><code>{String(v)}</code></details> }, { key: "enabled", label: "Trạng thái", render: v => v ? "Đang hoạt động" : "Đã khóa" }]} action={row => <button className={accountStyles.buttonSecondary} disabled={busy || review} onClick={() => { setSelected(row); setReason(""); setReview(false); setError(null); setNotice(""); }}>Quản lý</button>}/></div></Panel>
    {selected && <Panel title="Quản lý tài khoản"><div className={accountStyles.card}><p className="mb-3 font-semibold">{String(selected.display_name || "Khách hàng")} · {String(selected.email || "Chưa cập nhật email")}</p><code className="account-id [overflow-wrap:anywhere] [font-size:12px]">{String(selected.id)}</code><p>{selected.enabled ? "Tài khoản đang hoạt động." : "Tài khoản đang bị khóa."}</p><form className="account-form grid [gap:18px] [margin:22px_0] [&_fieldset]:[border-width:0] [&_fieldset]:[padding:0] [&_fieldset]:[margin:0] [&_fieldset]:grid [&_fieldset]:[gap:18px] [&_fieldset]:min-w-0" onSubmit={e => {
                e.preventDefault();
                if (reason.trim().length >= 10)
                    setReview(true);
            }}><fieldset disabled={busy || review}><Reason value={reason} onChange={setReason}/><button className={accountStyles.buttonSecondary}>{selected.enabled ? "Khóa tài khoản" : "Mở tài khoản"}</button></fieldset></form>
      {review && <Confirm title={selected.enabled ? "Khóa tài khoản này?" : "Mở lại tài khoản này?"} busy={busy} onCancel={() => setReview(false)} onConfirm={async () => {
                    setBusy(true);
                    setError(null);
                    try {
                        const result = await api<{
                            enabled: boolean;
                        }>("admin", `admin/users/${selected.id}/state`, mutation("POST", { enabled: !selected.enabled, reason: reason.trim() }));
                        setSelected({ ...selected, enabled: result.enabled });
                        setRevision(v => v + 1);
                        setReview(false);
                        setReason("");
                        setNotice(result.enabled ? "Đã mở tài khoản. Người dùng cần đăng nhập lại; phiên cũ không được khôi phục." : "Đã khóa tài khoản và thu hồi phiên. Các yêu cầu đang hoạt động sẽ được hệ thống xử lý dừng và giải phóng lượt.");
                    }
                    catch (err) {
                        setError(err as Error);
                    }
                    finally {
                        setBusy(false);
                    }
                }}><p>{reason}</p><p>{selected.enabled ? "Các phiên hiện tại sẽ bị thu hồi." : "Người dùng cần đăng nhập mới để tiếp tục."}</p></Confirm>}
      <div className="segmented account-actions inline-flex items-center flex-wrap [gap:4px] [margin:18px_0] [flex-shrink:0] [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:[gap:8px] [&_button]:[border-width:0] [&_button]:[border-radius:4px] [&_button]:[padding:8px_12px] [&_button]:[background:none] [&_button]:[color:var(--muted)] [&_button]:[font-size:14px] [&_button]:[font-weight:500] [&_button]:[min-height:38px] [&_button]:whitespace-nowrap [&_button:hover]:[background:var(--raised)] [&_span]:[font-size:13px] [&_span]:[opacity:0.9]"><button aria-pressed={tab === "subscriptions"} onClick={() => setTab("subscriptions")}>Các kỳ gói</button><button aria-pressed={tab === "jobs"} onClick={() => setTab("jobs")}>Yêu cầu phân tích</button></div>
      <PagedTable path={`admin/${tab}?account_id=${encodeURIComponent(String(selected.id))}`} columns={tab === "jobs" ? jobs : subscriptions}/>
      {/* BE-GAP USER-01: verified profiles are read-only; role editing and per-customer quota detail have no API. */}
    </div></Panel>}
  </>;
}
export function AdminPaymentsPage({ subscription = false }: {
    subscription?: boolean;
}) {
    const [status, setStatus] = useState("");
    return <><PageHeading title={subscription ? "Các kỳ gói" : "Giao dịch thanh toán"}>{!subscription && <Link className={accountStyles.buttonSecondary} href="/admin/reconciliation">Đối soát giao dịch</Link>}</PageHeading>{!subscription && <Field label="Trạng thái"><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option>{["APPLIED", "RECONCILIATION"].map(v => <option key={v} value={v}>{paymentStatus(v)}</option>)}</select></Field>}<Panel title={subscription ? "Kỳ sử dụng" : "Giao dịch đã ghi nhận"}><div className={accountStyles.card}><PagedTable path={subscription ? "admin/subscriptions" : `admin/payments${status ? `?status=${status}` : ""}`} columns={subscription ? subscriptions : [{ key: "id", label: "Mã giao dịch" }, { key: "order_id", label: "Mã đơn", render: v => v ? <Link className="text-[var(--accent)] underline" href={`/admin/orders?order_id=${encodeURIComponent(String(v))}`}>{String(v)}</Link> : "Chưa khớp đơn" }, amount, { key: "status", label: "Trạng thái", render: paymentStatus }, { key: "reason", label: "Lý do", render: paymentReason }, date("received_at", "Ghi nhận lúc")]}/></div></Panel></>;
}
export function ReconciliationPage() {
    const [selected, setSelected] = useState<Row | null>(null), [orderId, setOrderId] = useState(""), [reason, setReason] = useState("");
    const [review, setReview] = useState(false), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0), [error, setError] = useState<Error | null>(null), [notice, setNotice] = useState("");
    return <><PageHeading title="Đối soát thanh toán" description="Ghép giao dịch cần xử lý với mã đơn. Máy chủ kiểm tra điều kiện trước khi cấp gói."/><ErrorNotice error={error}/>{notice && <p className="account-notice positive [padding:16px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-left-width:3px] [border-left-style:solid] [border-left-color:var(--accent)] [border-radius:4px] [line-height:1.7] [margin:16px_0] [overflow-wrap:anywhere] [&_small]:block [&_small]:[font-size:11px] [.terminal_&]:[color:var(--positive)]" role="status">{notice}</p>}<Panel title="Giao dịch cần đối soát"><div className={accountStyles.card}><PagedTable path="admin/reconciliation" revision={revision} columns={[{ key: "id", label: "Mã giao dịch" }, amount, { key: "reason", label: "Lý do" }, { key: "references", label: "Tham chiếu" }, date("received_at", "Ghi nhận lúc")]} action={row => <button className={accountStyles.buttonSecondary} disabled={busy} onClick={() => { setSelected(row); setOrderId(""); setReason(""); setReview(false); setError(null); }}>Đối soát</button>}/></div></Panel>{selected && <Panel title="Ghép giao dịch"><div className={accountStyles.card}><p>{String(selected.id)} · {money(Number(selected.amount_vnd))}</p><form className="account-form grid [gap:18px] [margin:22px_0] [&_fieldset]:[border-width:0] [&_fieldset]:[padding:0] [&_fieldset]:[margin:0] [&_fieldset]:grid [&_fieldset]:[gap:18px] [&_fieldset]:min-w-0" onSubmit={e => {
                e.preventDefault();
                if (reason.trim().length >= 10)
                    setReview(true);
            }}><fieldset disabled={busy || review}><Field label="Mã đơn hàng"><input required minLength={36} maxLength={36} value={orderId} onChange={e => setOrderId(e.target.value)}/></Field><Reason value={reason} onChange={setReason}/><button className={accountStyles.buttonPrimary}>Xem lại đối soát</button></fieldset></form>{review && <ReconciliationConfirm orderId={orderId} amount={Number(selected.amount_vnd)} title="Áp dụng giao dịch vào đơn?" busy={busy} onCancel={() => setReview(false)} onConfirm={async () => {
                    setBusy(true);
                    setError(null);
                    try {
                        const payment = await api<{ status: string }>("admin", `admin/reconciliation/${selected.id}/apply`, mutation("POST", { order_id: orderId, reason: reason.trim() }));
                        if (payment.status !== "APPLIED") throw new Error("Giao dịch chưa được áp dụng. Kiểm tra trạng thái đơn và tài khoản trước khi thử lại.");
                        setNotice("Đã áp dụng giao dịch và cập nhật quyền sử dụng theo kết quả máy chủ.");
                        setSelected(null);
                        setRevision(v => v + 1);
                    }
                    catch (err) {
                        setError(err as Error);
                        setReview(false);
                        setRevision(v => v + 1);
                    }
                    finally {
                        setBusy(false);
                    }
                }}><p>Giao dịch {String(selected.id)} · {money(Number(selected.amount_vnd))} → đơn {orderId}.</p><p>{reason}</p></ReconciliationConfirm>}</div></Panel>}</>;
}
export function AuditPage() {
    const [action, setAction] = useState(""), [filter, setFilter] = useState("");
    return <><PageHeading title="Nhật ký quản trị"/><form className={accountStyles.actions} onSubmit={e => { e.preventDefault(); setFilter(action); }}><Field label="Loại hành động"><input value={action} onChange={e => setAction(e.target.value)} placeholder="Ví dụ: integration.updated"/></Field><button className={accountStyles.buttonSecondary}>Lọc</button></form><Panel title="Lịch sử thao tác"><div className={accountStyles.card}><PagedTable path={`admin/audit${filter ? `?action=${encodeURIComponent(filter)}` : ""}`} columns={[{ key: "actor_id", label: "Người thực hiện" }, { key: "action", label: "Hành động" }, date("occurred_at", "Thời điểm"), { key: "details", label: "Chi tiết", render: v => <details><summary>Xem</summary><pre>{JSON.stringify(v, null, 2)}</pre></details> }]}/></div></Panel></>;
}
export function TasksPage() {
    const [revision, setRevision] = useState(0);
    useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === "visible") setRevision(value => value + 1); }, 30000); return () => clearInterval(timer); }, []);
    const [status, setStatus] = useState(""), [kind, setKind] = useState("");
    const query = new URLSearchParams();
    if (status)
        query.set("status", status);
    if (kind)
        query.set("kind", kind);
    return <><PageHeading title="Tác vụ theo lịch" description="Theo dõi trạng thái thực thi và nguyên nhân. Thời gian hiển thị theo giờ Việt Nam."/><ScreeningHealth/><ScreeningBackfill onAccepted={() => setRevision(value => value + 1)}/><div className="account-form-grid grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))] [gap:18px] [margin:15px_0]"><Field label="Loại tác vụ"><select value={kind} onChange={e => setKind(e.target.value)}><option value="">Tất cả</option>{["INGEST", "SCREEN", "BACKFILL", "SNAPSHOT", "TRAIN"].map(v => <option key={v} value={v}>{v === "BACKFILL" ? "Chạy bù screening" : v}</option>)}</select></Field><Field label="Trạng thái"><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option>{["PENDING", "RUNNING", "WAITING", "SUCCEEDED", "FAILED", "SKIPPED"].map(v => <option key={v}>{v}</option>)}</select></Field></div><Panel title="Danh sách tác vụ"><div className={accountStyles.card}><PagedTable path={`admin/scheduled-tasks?${query}`} revision={revision} columns={[{ key: "id", label: "Mã tác vụ" }, { key: "kind", label: "Loại" }, { key: "target_session", label: "Phiên" }, { key: "slot", label: "Ca" }, { key: "status", label: "Trạng thái" }, { key: "attempt", label: "Lần chạy" }, date("scheduled_at", "Lịch chạy"), date("next_attempt_at", "Thử lại lúc"), { key: "reason", label: "Lý do" }, { key: "result", label: "Kết quả" }]}/></div></Panel></>;
}
export function JobsPage() {
    const [status, setStatus] = useState("");
    return <><PageHeading title="Yêu cầu phân tích" description="Yêu cầu đã được tiếp nhận sẽ được xử lý và tính vào hạn mức ngày."/>
      <Field label="Trạng thái"><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option>{["QUEUED", "WAITING_DATA", "RUNNING", "RETRY_WAIT", "SUCCEEDED", "FAILED", "CANCELLED"].map(value => <option key={value}>{value}</option>)}</select></Field>
      <Panel title="Danh sách yêu cầu"><div className="p-5"><PagedTable path={"admin/jobs" + (status ? "?status=" + status : "")} columns={[{ key: "account_id", label: "Tài khoản" }, ...jobs]}/></div></Panel>
    </>;
}

function ReconciliationConfirm(props: React.ComponentProps<typeof Confirm> & { orderId: string; amount: number }) {
    const preview = useResource<AdminOrder>("admin/orders/" + encodeURIComponent(props.orderId), "admin");
    const blocked = !preview.data || !!preview.error || preview.loading || preview.data.amount_vnd !== props.amount || ["PAID", "CANCELLED"].includes(preview.data.status);
    return <Confirm {...props} disabled={blocked}>
      {props.children}
      <ResourceState {...preview} retry={preview.reload}/>
      {preview.data && <div className="my-4 rounded-[4px] border border-[var(--border)] p-4 leading-7">
        <p>Khách: {preview.data.customer.display_name || preview.data.customer.id} · {preview.data.customer.email || "Chưa cập nhật email"}</p>
        <p>Gói: {preview.data.plan.name} · {money(preview.data.amount_vnd)} · {preview.data.reference}</p>
        {blocked && !preview.loading && <p role="alert">Đơn không phù hợp để ghép giao dịch này. Kiểm tra số tiền và trạng thái đơn.</p>}
      </div>}
    </Confirm>;
}
