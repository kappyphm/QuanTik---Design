"use client";
import { accountStyles } from "@/components/account/styles";
import { useEffect, useState } from "react";
import { api, mutation } from "@/lib/api/client";
import { stamp, type Integration } from "@/lib/api/contracts";
import { Panel, PageHeading } from "../ui";
import { Confirm, ErrorNotice, Field, Reason, ResourceState, useResource } from "../account/common";
import { useUnsavedChanges } from "../account/unsaved";
import { BillingReadiness } from "./billing";
export function IntegrationsPage() {
    return <><PageHeading title="Cấu hình tích hợp" description="Quản lý thông tin kết nối và trạng thái dịch vụ."/><BillingReadiness/><div className="account-config-stack grid [gap:24px]"><IntegrationForm provider="sepay"/><IntegrationForm provider="vnstock"/></div></>;
}
function IntegrationForm({ provider }: {
    provider: "sepay" | "vnstock";
}) {
    const result = useResource<Integration>(`admin/integrations/${provider}`, "admin");
    const [draft, setDraft] = useState<Record<string, string | boolean>>({});
    const [mode, setMode] = useState("keep"), [secret, setSecret] = useState(""), [reason, setReason] = useState("");
    const [review, setReview] = useState<Record<string, unknown> | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState<Error | null>(null), [saved, setSaved] = useState(false);
    useEffect(() => {
        if (!result.data)
            return;
        const data = result.data;

        setDraft({ bank_code: data.bank_code || "", account_number: data.account_number || "", account_name: data.account_name || "", transfer_prefix: data.transfer_prefix || "", requires_transfer_prefix: !!data.requires_transfer_prefix, payments_enabled: !!data.payments_enabled });
        setMode("keep");
        setSecret("");
        setReason("");
        setReview(null);
    }, [result.data]);
    const data = result.data;
    const bankDirty = !!data && provider === "sepay" && Object.entries(draft).some(([key, value]) => value !== (data[key as keyof Integration] ?? (typeof value === "boolean" ? false : "")));
    useUnsavedChanges(!!data && (!!reason || mode !== "keep" || bankDirty));
    async function save() {
        if (!review || busy)
            return;
        setBusy(true);
        setError(null);
        try {
            await api("admin", `admin/integrations/${provider}`, mutation("PATCH", review));
            setSecret("");
            setMode("keep");
            setReview(null);
            setSaved(true);
            window.dispatchEvent(new Event("quantik-billing-updated"));
            result.reload();
        }
        catch (err) {
            setError(err as Error);
            setReview(null);
            setSecret("");
            setMode("keep");
        }
        finally {
            setBusy(false);
        }
    }
    const configured = provider === "sepay" ? data?.webhook_api_key_configured : data?.api_key_configured;
    return <Panel title={provider === "sepay" ? "SePay · nhận thanh toán" : "Vnstock · dữ liệu thị trường"}><div className={accountStyles.card}><ResourceState {...result} retry={result.reload}/><ErrorNotice error={error}/>{saved && <p className="account-notice positive [padding:16px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-left-width:3px] [border-left-style:solid] [border-left-color:var(--accent)] [border-radius:4px] [line-height:1.7] [margin:16px_0] [overflow-wrap:anywhere] [&_small]:block [&_small]:[font-size:11px] [.terminal_&]:[color:var(--positive)]" role="status">Đã lưu cấu hình. Trạng thái đã lưu không xác nhận kết nối dịch vụ thực tế.</p>}{data && <>
    <dl className={accountStyles.facts}><div><dt>Nguồn cấu hình</dt><dd>{data.source === "ADMIN_DATABASE" ? "Quản trị" : "Môi trường"}</dd></div><div><dt>Phiên bản cập nhật</dt><dd>{data.revision}</dd></div><div><dt>Khóa bảo vệ cấu hình</dt><dd>{data.encryption_ready ? "Sẵn sàng" : "Chưa sẵn sàng"}</dd></div><div><dt>Khóa dịch vụ</dt><dd>{configured ? "Đã cấu hình" : "Chưa cấu hình"}</dd></div><div><dt>Cập nhật lúc</dt><dd>{stamp(data.updated_at)}</dd></div></dl>
    {provider === "sepay" && <p className="account-notice [padding:16px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-left-width:3px] [border-left-style:solid] [border-left-color:var(--accent)] [border-radius:4px] [line-height:1.7] [margin:16px_0] [overflow-wrap:anywhere] [&_small]:block [&_small]:[font-size:11px]">{data.configuration_complete ? "Thông tin thanh toán đã đủ trường bắt buộc." : `Còn thiếu: ${(data.missing_fields || []).join(", ") || "Chưa xác định"}`}</p>}
    {provider === "sepay" && <div className="my-4 space-y-2 rounded-[4px] border border-[var(--border)] p-4 text-sm leading-7"><p>Đơn còn chờ: {data.pending_orders ?? 0} · Giao dịch cần đối soát: {data.reconciliation_count ?? 0}.</p><p>Giao dịch mới nhận gần nhất: {stamp(data.last_payment_received_at)}.</p>{!!data.pending_orders && <p className="text-[var(--accent)]">Đổi tài khoản/khóa cần đồng bộ cấu hình phía SePay. Ngừng nhận đơn mới vẫn tiếp nhận giao dịch của đơn cũ; không xóa khóa khi còn đơn chờ.</p>}</div>}
    {provider === "vnstock" && <p className="account-notice [padding:16px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-left-width:3px] [border-left-style:solid] [border-left-color:var(--accent)] [border-radius:4px] [line-height:1.7] [margin:16px_0] [overflow-wrap:anywhere] [&_small]:block [&_small]:[font-size:11px]">Quyền chạy nguồn dữ liệu theo lịch: {data.scheduled_provider_enabled ? "Đã bật" : "Chưa bật"}. Lưu key không tự đăng nhập hay chạy nạp dữ liệu.</p>}
    <form className="account-form grid [gap:18px] [margin:22px_0] [&_fieldset]:[border-width:0] [&_fieldset]:[padding:0] [&_fieldset]:[margin:0] [&_fieldset]:grid [&_fieldset]:[gap:18px] [&_fieldset]:min-w-0" onSubmit={e => {
                e.preventDefault();
                setSaved(false);
                setError(null);
                const changes: Record<string, unknown> = {};
                if (provider === "sepay")
                    for (const [key, value] of Object.entries(draft))
                        if (value !== (data[key as keyof Integration] ?? (typeof value === "boolean" ? false : "")))
                            changes[key] = value;
                const field = provider === "sepay" ? "webhook_api_key" : "api_key";
                if (mode === "replace")
                    changes[field] = secret;
                if (mode === "clear")
                    changes[field] = null;
                if (!Object.keys(changes).length) {
                    setError(new Error("Chưa có thay đổi để lưu."));
                    return;
                }
                if (reason.trim().length < 10) {
                    setError(new Error("Lý do cần ít nhất 10 ký tự có nội dung."));
                    return;
                }
                setReview({ ...changes, expected_revision: data.revision, reason: reason.trim() });
            }}>
      <fieldset disabled={busy || !!review || !data.encryption_ready || result.loading}>
        {provider === "sepay" && <div className="account-form-grid grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))] [gap:18px] [margin:15px_0]">{[["bank_code", "Mã ngân hàng"], ["account_number", "Số tài khoản"], ["account_name", "Tên chủ tài khoản"], ["transfer_prefix", "Tiền tố nội dung chuyển khoản"]].map(([key, label]) => <Field key={key} label={label}><input maxLength={key === "bank_code" ? 32 : key === "account_number" ? 64 : key === "account_name" ? 200 : 50} value={String(draft[key] ?? "")} onChange={e => setDraft(v => ({ ...v, [key]: e.target.value }))}/></Field>)}<label className="account-check flex [gap:10px] items-center [font-size:12px] [min-height:44px] [&_input]:[accent-color:var(--accent)] [&_input]:[width:18px] [&_input]:[height:18px]"><input type="checkbox" checked={!!draft.requires_transfer_prefix} onChange={e => setDraft(v => ({ ...v, requires_transfer_prefix: e.target.checked }))}/>Bắt buộc tiền tố chuyển khoản</label><label className="account-check flex [gap:10px] items-center [font-size:12px] [min-height:44px] [&_input]:[accent-color:var(--accent)] [&_input]:[width:18px] [&_input]:[height:18px]"><input type="checkbox" checked={!!draft.payments_enabled} onChange={e => setDraft(v => ({ ...v, payments_enabled: e.target.checked }))}/>Mở thanh toán</label></div>}
        <Field label={provider === "sepay" ? "Khóa webhook" : "API key"}><select value={mode} onChange={e => { setMode(e.target.value); setSecret(""); }}><option value="keep">Giữ nguyên</option><option value="replace">Đặt / thay khóa</option><option value="clear">Xóa khóa</option></select></Field>
        {mode === "replace" && <Field label="Khóa mới"><input type="password" autoComplete="new-password" required minLength={provider === "sepay" ? 16 : 8} maxLength={4096} value={secret} onChange={e => setSecret(e.target.value)}/></Field>}
        {mode === "clear" && <p className="negative [.terminal_&]:[color:var(--negative)]">Khóa sẽ bị xóa. Với SePay đang hoạt động, cần tắt thanh toán và xử lý xong đơn chờ/giao dịch cần đối soát.</p>}
        <Reason value={reason} onChange={setReason}/><button className={accountStyles.buttonPrimary}>Kiểm tra thay đổi</button>
      </fieldset>
    </form>
    {review && <Confirm title="Áp dụng cấu hình tích hợp?" busy={busy} onCancel={() => { setReview(null); }} onConfirm={() => void save()}><p>Cập nhật {provider === "sepay" ? "SePay" : "Vnstock"} từ phiên bản {data.revision}.</p><p>{String(review.reason)}</p>{"payments_enabled" in review && <p>Thanh toán: {review.payments_enabled ? "Mở" : "Đóng"}.</p>}{mode !== "keep" && <p>Khóa dịch vụ: {mode === "clear" ? "Xóa" : "Thay mới"}.</p>}</Confirm>}
    <button className={accountStyles.buttonSecondary} disabled={busy || result.loading} onClick={() => {
                if ((!reason && mode === "keep" && !bankDirty) || window.confirm("Tải lại sẽ bỏ nội dung đang sửa. Tiếp tục?")) {
                    setError(null);
                    setSaved(false);
                    result.reload();
                }
            }}>Tải lại cấu hình</button>
    {/* BE-GAP CFG-01/CFG-02: no reveal/test-connection/secret-rollback or runtime gate write API. */}
  </>}</div></Panel>;
}
