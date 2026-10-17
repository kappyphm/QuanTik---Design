"use client";
import { useState, type ReactNode } from "react";
import type { Profile } from "@/lib/api/contracts";
import { api, mutation } from "@/lib/api/client";
import { useSession, loadSession } from "./session";
import { Field, ErrorNotice } from "./common";
import { accountStyles } from "./styles";

export function ProfileGate({ children }: { children: ReactNode }) {
  const session = useSession("user");
  return session.state === "ready" && session.profile?.profile_required
    ? <section className="mx-auto max-w-xl rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-6"><h1 className="text-2xl">Hoàn thiện tài khoản</h1><p className="my-4 text-sm leading-7">Bạn được cấp gói Free 30 ngày, tối đa 3 yêu cầu phân tích mỗi ngày. Bổ sung thông tin để bắt đầu sử dụng.</p><ProfileForm profile={session.profile}/></section>
    : children;
}

export function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved?: () => void }) {
  const [name, setName] = useState(profile.display_name || ""), [birth, setBirth] = useState(profile.date_of_birth || ""), [phone, setPhone] = useState(profile.phone_number || "");
  const [busy, setBusy] = useState(false), [error, setError] = useState<Error | null>(null);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const age = birth ? new Date(today).getUTCFullYear()-new Date(birth).getUTCFullYear()-(today.slice(5) < birth.slice(5) ? 1 : 0) : null;
  return <form className="grid gap-3" onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true); setError(null);
    try { await api<Profile>("user", "me/profile", mutation("PATCH", { display_name: name.trim(), date_of_birth: birth, phone_number: phone })); await loadSession("user"); onSaved?.(); }
    catch (error) { setError(error as Error); }
    finally { setBusy(false); }
  }}><fieldset disabled={busy} className="grid gap-3">
    <Field label="Họ và tên"><input required autoComplete="name" maxLength={255} value={name} onChange={event => setName(event.target.value)}/></Field>
    <Field label="Ngày tháng năm sinh"><input required type="date" autoComplete="bday" max={today} value={birth} onChange={event => setBirth(event.target.value)}/></Field>
    {age !== null && Number.isFinite(age) && <p className="text-sm text-[var(--muted)]">Tuổi: {age}</p>}
    <Field label="Số điện thoại"><input required type="tel" autoComplete="tel" maxLength={30} placeholder="0901234567 hoặc +84…" value={phone} onChange={event => setPhone(event.target.value)}/></Field>
    <p className="text-xs leading-6 text-[var(--muted)]">Số điện thoại do bạn cung cấp, chưa được xác minh bằng OTP. Email lấy từ tài khoản Google đã xác minh.</p>
    <ErrorNotice error={error}/><button className={accountStyles.buttonPrimary}>{busy ? "Đang lưu…" : "Lưu thông tin"}</button>
  </fieldset></form>;
}
