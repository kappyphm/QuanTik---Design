"use client";
import Link from "next/link";
import { useState } from "react";
import type { Role } from "@/lib/api/contracts";
import { logout, useSession } from "./session";

export function SessionMenu({ role }: { role: Role }) {
  const session = useSession(role);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  if (session.state === "idle" || session.state === "loading") return <span className="text-xs text-[var(--muted)]">Đang xác thực…</span>;
  if (session.state !== "ready") return role === "user" ? <Link className="text-sm text-[var(--accent)]" href="/login">Đăng nhập</Link> : null;
  return <details className="relative text-sm"><summary className="max-w-40 cursor-pointer truncate">{role === "admin" ? session.profile?.username || "Quản trị" : session.profile?.display_name || "Tài khoản"}</summary>
    <div className="absolute right-0 z-50 mt-3 w-64 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg">
      {role === "user" && <><p className="mb-3 break-all text-xs text-[var(--muted)]">{session.profile?.email}</p><Link className="mb-3 block text-[var(--accent)]" href="/account">Tài khoản và gói sử dụng</Link></>}
      {error && <p role="alert" className="mb-3 text-[var(--negative)]">{error}</p>}
      <button disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await logout(role); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>{busy ? "Đang đăng xuất…" : "Đăng xuất"}</button>
    </div>
  </details>;
}
