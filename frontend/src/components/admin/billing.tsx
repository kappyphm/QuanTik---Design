"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, mutation } from "@/lib/api/client";
import { money, stamp, dailyLimit, paymentStatus, paymentReason, type Page, type Plan, type Order } from "@/lib/api/contracts";
import { PageHeading, Panel } from "../ui";
import { Confirm, ErrorNotice, Field, PagedTable, ResourceState, DataTable, useResource, type Row } from "../account/common";
import { useUnsavedChanges } from "../account/unsaved";
import { useSession } from "../account/session";
import { orderStatus } from "../account/customer";

const button = "inline-flex min-h-10 items-center justify-center rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm hover:bg-[var(--raised)] disabled:opacity-50";
const primary = "inline-flex min-h-10 items-center justify-center rounded-[4px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm text-[#172016] hover:brightness-110 disabled:opacity-50";
const notice = "my-5 rounded-[4px] border border-[var(--border)] p-4 text-sm leading-7";
type Draft = Pick<Plan, "name" | "price_vnd" | "duration_days" | "active_limit"> & { daily_request_limit: number; replaces_plan_id: string | null };
const defaults: Draft = { name: "", price_vnd: 100000, duration_days: 30, daily_request_limit: 20, active_limit: 1, replaces_plan_id: null };

export function BillingReadiness({ revision = 0 }: { revision?: number }) {
    const catalog = useResource<{ payments_enabled: boolean; items: Plan[] }>("plans", "public", revision);
    useEffect(() => {
        const refresh = () => catalog.reload();
        window.addEventListener("quantik-billing-updated", refresh);
        window.addEventListener("focus", refresh);
        return () => { window.removeEventListener("quantik-billing-updated", refresh); window.removeEventListener("focus", refresh); };
    }, [catalog.reload]);
    return <aside className={notice} aria-label="Tình trạng mở bán">
      <strong>Thiết lập bán gói</strong>
      <ResourceState {...catalog} retry={catalog.reload}/>
      {catalog.data && <ol className="mt-2 grid gap-2 sm:grid-cols-2">
        <li>1. Nhận thanh toán: <strong>{catalog.data.payments_enabled ? "Đã bật" : "Đang tắt"}</strong>. <Link className="text-[var(--accent)] underline" href="/admin/config/integrations">Cấu hình SePay</Link></li>
        <li>2. Gói công khai: <strong>{catalog.data.items.length} gói đang mở bán</strong>. <Link className="text-[var(--accent)] underline" href="/admin/plans">Quản lý danh mục</Link></li>
      </ol>}
      {catalog.data && !catalog.data.items.length && <p className="mt-2">Chưa có gói hiển thị cho khách. Nếu đã tạo gói, chọn <strong>Mở bán</strong> ở gói bên dưới. Bật SePay chỉ mở phương thức thanh toán, không tự công bố gói.</p>}
    </aside>;
}

export function AdminPlansPage() {
    const session = useSession("admin");
    const createIntent = useRef<{ fingerprint: string; key: string } | null>(null);
    const [revision, setRevision] = useState(0), [cursor, setCursor] = useState("");
    const result = useResource<Page<Plan>>(`admin/plans?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, "admin", revision);
    const [draft, setDraft] = useState<Draft>(defaults), [review, setReview] = useState(false);
    const [toggle, setToggle] = useState<Plan | null>(null), [busy, setBusy] = useState(false);
    const [error, setError] = useState<Error | null>(null), [message, setMessage] = useState("");
    const [created, setCreated] = useState<Plan | null>(null);
    const editor = useRef<HTMLFormElement>(null);
    useUnsavedChanges(JSON.stringify(draft) !== JSON.stringify(defaults));
    async function save() {
        if (busy) return;
        setBusy(true); setError(null);
        try {
            if (toggle) {
                await api("admin", `admin/plans/${toggle.id}/availability`, mutation("POST", { available: !toggle.available, replace_existing: !!toggle.replaces_plan_id }));
                setMessage(toggle.available ? "Đã đóng bán. Đơn đã tạo và kỳ gói đã mua giữ nguyên." : "Đã mở bán. Khách hàng có thể xem gói tại trang Gói phân tích.");
                if (created?.id === toggle.id) setCreated(null);
            } else {
                const body = { ...draft, name: draft.name.trim(), features: { screening: true, analysis: true } };
                const fingerprint = JSON.stringify(body), storage = "quantik.plan.intent." + session.profile!.id;
                if (!createIntent.current) { try { createIntent.current = JSON.parse(sessionStorage.getItem(storage) || "null"); } catch { /* Optional metadata. */ } }
                if (createIntent.current?.fingerprint !== fingerprint) createIntent.current = { fingerprint, key: crypto.randomUUID() };
                try { sessionStorage.setItem(storage, JSON.stringify(createIntent.current)); } catch { /* In-memory fallback. */ }
                const plan = await api<Plan>("admin", "admin/plans", mutation("POST", body, createIntent.current!.key));
                createIntent.current = null;
                try { sessionStorage.removeItem(storage); } catch { /* Optional metadata. */ }
                setCreated(plan); setDraft(defaults); setCursor("");
                setMessage("Đã tạo phiên bản gói mới, đang đóng bán. Chọn Mở bán gói vừa tạo để công bố cho khách.");
            }
            setReview(false); setToggle(null); setRevision(v => v + 1);
        } catch (err) { setError(err as Error); }
        finally { setBusy(false); }
    }
    const edit = (plan?: Plan) => {
        setDraft(plan ? { name: plan.name, price_vnd: plan.price_vnd, duration_days: plan.duration_days, daily_request_limit: dailyLimit(plan), active_limit: plan.active_limit, replaces_plan_id: plan.id } : defaults);
        setError(null); setMessage(plan ? "Đã sao chép quyền lợi. Điều chỉnh rồi xác nhận tạo phiên bản mới." : "");
        editor.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        editor.current?.querySelector("input")?.focus({ preventScroll: true });
    };
    return <>
      <PageHeading title="Gói dịch vụ" description="Tạo gói → kiểm tra quyền lợi → mở bán để khách nhìn thấy.">
        <button className={primary} onClick={() => edit()}>Tạo gói mới</button>
      </PageHeading>
      <BillingReadiness revision={revision}/>
      <ErrorNotice error={error}/>
      {message && <div className={notice} role="status">{message}{created && <button className={`${primary} ml-3`} disabled={busy} onClick={() => setToggle(created)}>Mở bán gói vừa tạo</button>}</div>}
      <Panel title="Danh mục gói" action={<button className={button} disabled={result.loading || busy} onClick={() => setRevision(v => v + 1)}>Cập nhật</button>}>
        <div className="p-5"><ResourceState {...result} retry={result.reload}/>
          {result.data?.items.length === 0 && <p>Chưa tạo gói nào. Dùng form bên dưới để tạo gói đầu tiên.</p>}
          <div className="grid gap-4 lg:grid-cols-2">{result.data?.items.map(plan => <article key={plan.id} className="min-w-0 rounded-[4px] border border-[var(--border)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-lg font-semibold">{plan.name}</h3><span className={plan.available ? "text-[var(--positive)]" : "text-[var(--accent)]"}>{plan.available ? "Đang mở bán" : "Đang đóng bán · khách chưa thấy"}</span></div>
            {plan.replaces_plan_id && <p className="mt-2 text-xs text-[var(--muted)]">Phiên bản thay thế gói trước</p>}<p className="my-4 text-2xl text-[var(--accent)]">{money(plan.price_vnd)}</p>
            <p className="text-sm leading-7">{plan.duration_days} ngày · {dailyLimit(plan)} yêu cầu/ngày · {plan.active_limit} yêu cầu đồng thời</p>
            <details className="my-3 text-xs text-[var(--muted)]"><summary>Mã phiên bản</summary><code className="break-all">{plan.id}</code></details>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={plan.available ? button : primary} disabled={busy || review || !!toggle} onClick={() => setToggle(plan)}>{plan.available ? "Đóng bán" : "Mở bán"}</button>
              <button className={button} disabled={busy || review || !!toggle} onClick={() => edit(plan)}>Tạo phiên bản từ gói này</button>
              <Link className={button} href={`/admin/orders?plan_id=${encodeURIComponent(plan.id)}`}>Xem đơn của gói</Link>
            </div>
          </article>)}</div>
          <div className="mt-5 flex gap-3"><button className={button} disabled={!cursor || result.loading} onClick={() => setCursor("")}>Về đầu danh mục</button><button className={button} disabled={!result.data?.next_cursor || result.loading || !!result.error} onClick={() => setCursor(result.data!.next_cursor!)}>Trang sau</button></div>
        </div>
      </Panel>
      <Panel title="Tạo phiên bản gói" className="mt-5"><form ref={editor} className="p-5" onSubmit={e => { e.preventDefault(); if (draft.name.trim()) setReview(true); }}>
        <fieldset className="min-w-0" disabled={busy || review || !!toggle}>
          <Field label="Tên gói"><input required maxLength={100} value={draft.name} onChange={e => setDraft(v => ({ ...v, name: e.target.value }))}/></Field>
          <div className="grid gap-4 sm:grid-cols-2">{([["price_vnd", "Giá (VND)", 1000, 100000000], ["duration_days", "Thời hạn (ngày)", 1, 366], ["daily_request_limit", "Giới hạn yêu cầu/ngày", 1, 100000], ["active_limit", "Yêu cầu đồng thời", 1, 10]] as const).map(([key, label, min, max]) => <Field key={key} label={label}><input required type="number" step={1} min={min} max={max} value={draft[key]} onChange={e => setDraft(v => ({ ...v, [key]: Number(e.target.value) }))}/></Field>)}</div>
          <p className="my-4 text-sm text-[var(--muted)]">Bao gồm sàng lọc và phân tích Quant. Bản mới mặc định đóng bán. Khi mở bán phiên bản thay thế, bản cũ sẽ tự đóng bán. Quyền lợi đã mua được giữ nguyên.</p>
          <button className={primary}>Xem lại gói mới</button>
        </fieldset>
      </form></Panel>
      {(review || toggle) && <Confirm title={toggle ? `${toggle.available ? "Đóng" : "Mở"} bán gói ${toggle.name}?` : "Tạo phiên bản gói mới?"} busy={busy} onCancel={() => { setReview(false); setToggle(null); }} onConfirm={() => void save()}>
        {toggle ? <p>{toggle.name} · {money(toggle.price_vnd)}. {toggle.replaces_plan_id && !toggle.available && "Bản cũ sẽ tự đóng bán khi phiên bản này được mở. "}{toggle.available ? "Ngừng nhận đơn mới; các đơn và kỳ gói cũ giữ nguyên." : "Gói sẽ xuất hiện trên trang Gói phân tích của khách hàng."}</p> : <p>{draft.name} · {money(draft.price_vnd)} · {draft.duration_days} ngày · {draft.daily_request_limit} yêu cầu/ngày · {draft.active_limit} yêu cầu đồng thời.</p>}
      </Confirm>}
    </>;
}

export type AdminOrder = Order & { customer: { id: string; display_name: string | null; email: string | null }; plan: Plan; payments: Row[]; subscription: { id: string; bucket_id: string; valid_from: number; valid_until: number } | null };
export function AdminOrdersPage() {
    const initial = useSearchParams(), router = useRouter();
    const readFilters = () => ({ status: initial.get("status") || "", reference: initial.get("reference") || "", account_id: initial.get("account_id") || "", plan_id: initial.get("plan_id") || "" });
    const [draft, setDraft] = useState(readFilters);
    const filters = readFilters(), selected = initial.get("order_id");
    const cursor = initial.get("cursor") || "";
    const trail = useRef<string[]>([]);
    useEffect(() => { const index = trail.current.indexOf(cursor); if (index >= 0) trail.current = trail.current.slice(0, index); }, [cursor]);
    const urlKey = initial.toString();
    useEffect(() => { setDraft(readFilters()); }, [urlKey]);
    const navigate = (changes: Record<string, string | null>) => {
        const query = new URLSearchParams(initial);
        for (const [key, value] of Object.entries(changes)) { if (value) query.set(key, value); else query.delete(key); }
        router.push("/admin/orders" + (query.size ? "?" + query : ""), { scroll: false });
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value.trim()) params.set(key, value.trim());
    if (cursor) params.set("cursor", cursor);
    params.set("limit", "20");
    const orders = useResource<Page<Row>>(`admin/orders?${params}`, "admin");
    return <><PageHeading title="Đơn hàng" description="Tra cứu toàn bộ đơn, trạng thái thanh toán và kỳ gói được cấp."/>
      <form className="mb-5 grid gap-3 rounded-[4px] border border-[var(--border)] p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={e => { e.preventDefault(); trail.current = []; navigate({ ...draft, cursor: null, order_id: null }); }}>
        <Field label="Trạng thái đơn"><select value={draft.status} onChange={e => setDraft(v => ({ ...v, status: e.target.value }))}><option value="">Tất cả</option>{["PENDING", "PAID", "EXPIRED", "CANCELLED"].map(s => <option key={s} value={s}>{orderStatus(s)}</option>)}</select></Field>
        {([["reference", "Mã chuyển khoản"], ["account_id", "Mã tài khoản"], ["plan_id", "Mã phiên bản gói"]] as const).map(([key, label]) => <Field key={key} label={label}><input value={draft[key]} onChange={e => setDraft(v => ({ ...v, [key]: e.target.value }))}/></Field>)}
        <div className="flex gap-3"><button className={primary}>Lọc đơn hàng</button><button className={button} type="button" onClick={() => { const empty = { status: "", reference: "", account_id: "", plan_id: "" }; setDraft(empty); trail.current = []; navigate({ ...empty, cursor: null, order_id: null }); }}>Xóa lọc</button></div>
      </form>
      <Panel title="Danh sách đơn"><div className="p-5"><ResourceState {...orders} retry={orders.reload}/>{orders.data && <DataTable items={orders.data.items} columns={[
        { key: "reference", label: "Mã đơn" }, { key: "display_name", label: "Khách hàng" }, { key: "email", label: "Email" }, { key: "plan_name", label: "Gói" },
        { key: "amount_vnd", label: "Số tiền", render: v => money(Number(v)) }, { key: "status", label: "Trạng thái", render: v => orderStatus(String(v)) },
        { key: "created_at", label: "Tạo lúc", render: v => stamp(Number(v)) },
      ]} action={row => <button className={button} onClick={() => navigate({ order_id: String(row.id) })}>Xem chi tiết</button>}/>}<div className="mt-4 flex flex-wrap gap-3"><button className={button} disabled={orders.loading} onClick={orders.reload}>Cập nhật</button><button className={button} disabled={!cursor || orders.loading} onClick={() => navigate({ cursor: trail.current.pop() || null, order_id: null })}>{trail.current.length ? "Trang trước" : "Về đầu danh sách"}</button><button className={button} disabled={!orders.data?.next_cursor || orders.loading || !!orders.error} onClick={() => { trail.current.push(cursor); navigate({ cursor: orders.data!.next_cursor, order_id: null }); }}>Trang sau</button></div></div></Panel>
      {selected && <OrderInspection key={selected} id={selected} close={() => navigate({ order_id: null })}/>}
    </>;
}

function OrderInspection({ id, close }: { id: string; close: () => void }) {
    const panel = useRef<HTMLDivElement>(null);
    const result = useResource<AdminOrder>(`admin/orders/${encodeURIComponent(id)}`, "admin");
    const order = result.data;
    useEffect(() => { if (order) { panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); panel.current?.focus({ preventScroll: true }); } }, [id, !!order]);
    return <div ref={panel} tabIndex={-1}><Panel title="Chi tiết đơn hàng" className="mt-5" action={<button className={button} onClick={close}>Đóng chi tiết</button>}><div className="space-y-5 p-5">
      <ResourceState {...result} retry={result.reload}/>
      {order && <>
        <dl className="grid gap-4 break-words text-sm sm:grid-cols-2">
          <div><dt className="text-[var(--muted)]">Mã đơn / tham chiếu</dt><dd>{order.id}<br/>{order.reference}</dd></div>
          <div><dt className="text-[var(--muted)]">Trạng thái / số tiền</dt><dd>{orderStatus(order.status)} · {money(order.amount_vnd)}</dd></div>
          <div><dt className="text-[var(--muted)]">Khách hàng</dt><dd>{order.customer.display_name || "Chưa cập nhật tên"}<br/>{order.customer.email || "Chưa cập nhật email"}<br/>{order.customer.id}</dd></div>
          <div><dt className="text-[var(--muted)]">Quyền lợi đã mua</dt><dd>{order.plan.name} · {order.plan.duration_days} ngày · {dailyLimit(order.plan)} yêu cầu/ngày · {order.plan.active_limit} yêu cầu đồng thời</dd></div>
          <div><dt className="text-[var(--muted)]">Thông tin chuyển khoản của đơn</dt><dd>{order.bank} · {order.account_number}<br/>{order.account_name}<br/>{order.transfer_content}</dd></div>
          <div><dt className="text-[var(--muted)]">Thời gian</dt><dd>Tạo: {stamp(order.created_at)}<br/>Hạn: {stamp(order.expires_at)}<br/>Thanh toán: {stamp(order.paid_at)}</dd></div>
        </dl>
        <div><h3 className="mb-3 font-semibold">Kỳ gói được cấp</h3>{order.subscription ? <p>{stamp(order.subscription.valid_from)} → {stamp(order.subscription.valid_until)}<br/><span className="break-all text-xs">Mã kỳ: {order.subscription.id}</span></p> : <p>Đơn chưa được cấp kỳ gói.</p>}</div>
        <div><h3 className="mb-3 font-semibold">Giao dịch gắn với đơn</h3><DataTable items={order.payments} columns={[{ key: "id", label: "Mã giao dịch" }, { key: "amount_vnd", label: "Số tiền", render: v => money(Number(v)) }, { key: "status", label: "Trạng thái", render: paymentStatus }, { key: "reason", label: "Lý do", render: paymentReason }, { key: "received_at", label: "Ghi nhận", render: v => stamp(Number(v)) }]}/></div>
        <div className="flex flex-wrap gap-3"><button className={button} onClick={result.reload}>Cập nhật chi tiết</button><Link className={button} href="/admin/reconciliation">Mở đối soát giao dịch</Link></div>
      </>}
    </div></Panel></div>;
}
