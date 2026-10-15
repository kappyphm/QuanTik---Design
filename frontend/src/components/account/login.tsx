"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, raw } from "@/lib/api/client";
import { adminLogin, useSession } from "./session";
import { ErrorNotice, Field } from "./common";
export function Login({ admin = false }: {
    admin?: boolean;
}) {
    const router = useRouter(), query = useSearchParams();
    const session = useSession(admin ? "admin" : "user");
    const [busy, setBusy] = useState(false), [error, setError] = useState<Error | null>(null);
    const [username, setUsername] = useState(""), [password, setPassword] = useState("");
    useEffect(() => {
        if (session.state === "ready") {
            router.replace(admin ? "/admin" : "/dashboard");
            if (admin)
                router.refresh();
        }
    }, [session.state, admin, router]);
    async function submit() {
        setBusy(true);
        setError(null);
        try {
            if (admin) {
                await adminLogin(username, password);
                setPassword("");
            }
            else {
                const result = await raw<{
                    authorization_url: string;
                }>("auth/google/start");
                const url = new URL(result.authorization_url);
                if (url.origin !== "https://accounts.google.com")
                    throw new Error("Địa chỉ đăng nhập không hợp lệ.");
                location.assign(url.href);
            }
        }
        catch (err) {
            setPassword("");
            setError(admin && err instanceof ApiError && err.status === 401 ? new Error("Tên đăng nhập hoặc mật khẩu không đúng.") : err as Error);
        }
        finally {
            setBusy(false);
        }
    }
    if (session.state === "ready")
        return <p role="status">Đang mở {admin ? "khu vực quản trị" : "dashboard"}…</p>;
    return <section className="panel account-card account-login [padding:24px] min-w-0 [&_>_p]:[line-height:1.7] [&_>_p]:[margin:12px_0] [&_h1]:[font-size:clamp(24px,4vw,36px)] [&_h1]:[margin:14px_0] [&_h2]:[font-size:19px] [&_h2]:[margin:10px_0] [&_h3]:[font-size:16px] [max-width:560px] [margin:36px_auto] [.auth-stage_&]:[width:min(100%,_460px)] [.auth-stage_&]:[margin:0] [.auth-stage_&]:[padding:36px] [.auth-stage_&_h1]:[font-size:26px] [.auth-stage_&_>_p]:[color:var(--muted)] [.auth-stage_&_>_p]:[font-size:13px] max-[640px]:[.auth-stage_&]:[padding:26px_22px] [&_pre]:[white-space:pre-wrap] [&_pre]:[overflow-wrap:anywhere] [&_pre]:[max-height:400px] [&_pre]:overflow-auto [&_pre]:[font-size:11px] max-[640px]:[padding:18px] max-[640px]:[margin:15px_auto] [background:var(--surface)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:4px] overflow-hidden"><div className="auth-brand flex [gap:12px] items-center [margin-bottom:26px] [font-size:24px] [font-weight:600] [&_img]:[border-radius:4px] [&_>_span_>_span]:[color:var(--accent)]"><img src="/quantik-logo.jpg" width="38" height="38" alt=""/><span>Quan<span>Tik</span></span></div><h1>{admin ? "Đăng nhập quản trị" : "Đăng nhập hệ thống"}</h1><p>{admin ? "Dành cho tài khoản quản trị đã được cấp." : "Một tài khoản để truy cập thị trường và phân tích Quant."}</p>
    {query.has("error") && <p role="alert" className="account-notice negative [padding:16px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-left-width:3px] [border-left-style:solid] [border-left-color:var(--accent)] [border-radius:4px] [line-height:1.7] [margin:16px_0] [overflow-wrap:anywhere] [&_small]:block [&_small]:[font-size:11px] [.terminal_&]:[color:var(--negative)]">{query.get("error") === "backend" ? "Chưa kết nối được máy chủ đăng nhập." : "Đăng nhập Google chưa hoàn tất hoặc đã hết hạn. Vui lòng thử lại."}</p>}
    <ErrorNotice error={error}/>
    {session.state === "error" && <ErrorNotice error={session.error}/>}
    <form className="account-form grid [gap:18px] [margin:22px_0] [&_fieldset]:[border-width:0] [&_fieldset]:[padding:0] [&_fieldset]:[margin:0] [&_fieldset]:grid [&_fieldset]:[gap:18px] [&_fieldset]:min-w-0" onSubmit={e => { e.preventDefault(); void submit(); }}>
      {admin && <><Field label="Tên đăng nhập"><input autoComplete="username" maxLength={255} required value={username} onChange={e => setUsername(e.target.value)}/></Field><Field label="Mật khẩu"><input type="password" autoComplete="current-password" required maxLength={1024} value={password} onChange={e => setPassword(e.target.value)}/></Field></>}
      <button className="button primary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[color:#172016]! [.button&]:[background:var(--accent)] [.button&]:[border-color:var(--accent)] [.terminal[data-theme='light']_.button&]:[color:white]! [.button&:hover]:[background:color-mix(in_srgb,_var(--accent)_85%,_white)] [.button&:hover]:[transform:translateY(-1px)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" disabled={busy}>{busy ? "Đang kết nối…" : admin ? "Đăng nhập" : "Tiếp tục với Google"}</button>
    </form>
    {/* BE-GAP AUTH-01: no customer password/signup/profile APIs. */}
    {!admin && <Link className="text-link [.auth-stage_.account-login_&]:[font-size:12px] [.auth-stage_.account-login_&]:[color:var(--muted)]" href="/">← Về trang chủ</Link>}
  </section>;
}
