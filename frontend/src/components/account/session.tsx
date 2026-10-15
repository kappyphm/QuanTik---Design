"use client";
import Link from "next/link";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { accept, api, ApiError, authPath, forget, onExpired, raw, mutation } from "@/lib/api/client";
import type { Profile, Role } from "@/lib/api/contracts";
type Session = {
    state: "idle" | "loading" | "ready" | "anonymous" | "error";
    profile?: Profile;
    error?: Error;
};
const initial: Session = { state: "idle" };
const sessions: Record<Role, Session> = { user: initial, admin: initial };
const subscribers = new Set<() => void>();
const epochs: Record<Role, number> = { user: 0, admin: 0 };
let channel: BroadcastChannel | undefined;
function set(role: Role, value: Session) { sessions[role] = value; subscribers.forEach(fn => fn()); }
onExpired(role => { epochs[role]++; set(role, { state: "anonymous" }); });
function broadcast() {
    if (!channel && typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("quantik-session");
        channel.onmessage = event => {
            if (event.data === "user" || event.data === "admin")
                forget(event.data);
        };
    }
    return channel;
}
export async function loadSession(role: Role) {
    if (sessions[role].state === "loading")
        return;
    const epoch = ++epochs[role];
    set(role, { state: "loading" });
    try {
        const profile = await api<Profile>(role, role === "admin" ? "admin/me" : "me");
        if (epochs[role] !== epoch)
            return;
        if (profile.role !== role) {
            forget(role);
            return;
        }
        set(role, { state: "ready", profile });
    }
    catch (error) {
        if (epochs[role] !== epoch)
            return;
        set(role, { state: error instanceof ApiError && [401, 403].includes(error.status) ? "anonymous" : "error", error: error as Error });
    }
}
export function useSession(role: Role) {
    const session = useSyncExternalStore(fn => { subscribers.add(fn); return () => { subscribers.delete(fn); }; }, () => sessions[role], () => initial);
    useEffect(() => {
        broadcast();
        if (sessions[role].state === "idle")
            void loadSession(role);
    }, [role]);
    return session;
}
export async function adminLogin(username: string, password: string) {
    const result = await raw<{
        access_token: string;
        expires_in: number;
    }>("admin/auth/login", mutation("POST", { username, password }));
    accept("admin", result);
    epochs.admin++;
    set("admin", { state: "idle" });
    await loadSession("admin");
    broadcast()?.postMessage("admin");
    if (sessions.admin.state !== "ready")
        throw sessions.admin.error || new Error("Không xác nhận được phiên quản trị.");
}
export async function logout(role: Role) {
    await raw(`${authPath(role)}/logout`, mutation("POST"));
    forget(role);
    broadcast()?.postMessage(role);
}
export function Guard({ role = "user", children }: {
    role?: Role;
    children: ReactNode;
}) {
    const session = useSession(role);
    if (session.state === "idle" || session.state === "loading")
        return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
    if (session.state === "error")
        return <section className="panel account-card [padding:24px] min-w-0 [&_>_p]:[line-height:1.7] [&_>_p]:[margin:12px_0] [&_h1]:[font-size:clamp(24px,4vw,36px)] [&_h1]:[margin:14px_0] [&_h2]:[font-size:19px] [&_h2]:[margin:10px_0] [&_h3]:[font-size:16px] [&_pre]:[white-space:pre-wrap] [&_pre]:[overflow-wrap:anywhere] [&_pre]:[max-height:400px] [&_pre]:overflow-auto [&_pre]:[font-size:11px] max-[640px]:[padding:18px] [background:var(--surface)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:4px] overflow-hidden"><p role="alert">{session.error?.message}</p><button className="button secondary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[background:var(--surface)] [.button&]:[border-color:var(--border)] [.button&]:[color:var(--text)] [.button&:hover]:[background:var(--raised)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" onClick={() => void loadSession(role)}>Thử lại</button></section>;
    if (session.state !== "ready")
        return <section className="panel account-card [padding:24px] min-w-0 [&_>_p]:[line-height:1.7] [&_>_p]:[margin:12px_0] [&_h1]:[font-size:clamp(24px,4vw,36px)] [&_h1]:[margin:14px_0] [&_h2]:[font-size:19px] [&_h2]:[margin:10px_0] [&_h3]:[font-size:16px] [&_pre]:[white-space:pre-wrap] [&_pre]:[overflow-wrap:anywhere] [&_pre]:[max-height:400px] [&_pre]:overflow-auto [&_pre]:[font-size:11px] max-[640px]:[padding:18px] [background:var(--surface)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:4px] overflow-hidden"><h1>Cần đăng nhập</h1><p>{role === "admin" ? "Đăng nhập tài khoản quản trị để tiếp tục." : "Đăng nhập để quản lý tài khoản và mua gói phân tích."}</p><Link className="button primary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[color:#172016]! [.button&]:[background:var(--accent)] [.button&]:[border-color:var(--accent)] [.terminal[data-theme='light']_.button&]:[color:white]! [.button&:hover]:[background:color-mix(in_srgb,_var(--accent)_85%,_white)] [.button&:hover]:[transform:translateY(-1px)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" href={role === "admin" ? "/admin/login" : "/login"}>Đăng nhập</Link></section>;
    // Key prevents private view state being reused when the account changes.
    return <div key={session.profile!.id}>{children}</div>;
}
