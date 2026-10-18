"use client";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { refresh } from "@/lib/api/client";
import { useSession } from "../account/session";
import { AuthSurface } from "../account/auth-surface";
import { Login } from "../account/login";
import { Shell } from "../shell";

export function AdminBoundary({ verified, children }: { verified: boolean; children: ReactNode }) {
  const session = useSession("admin");
  if (!verified && session.state === "ready") return <RestoreAdminGate/>;
  if (!verified || session.state === "anonymous" || session.state === "error") {
    return <AuthSurface><Suspense fallback={null}><Login admin /></Suspense></AuthSurface>;
  }
  if (session.state !== "ready") return <AuthSurface><p role="status">Đang xác thực…</p></AuthSurface>;
  return <Shell><div key={session.profile!.id}>{children}</div></Shell>;
}

// The short access cookie may expire while the HttpOnly refresh session remains valid.
// Restore it once; never render admin content or repeatedly redirect to the login page.
function RestoreAdminGate() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0), [busy, setBusy] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setBusy(true); setError("");
    void refresh("admin").then(() => {
      if (active) router.refresh();
    }).catch(err => { if (active) setError((err as Error).message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [attempt, router]);
  return <AuthSurface><p role={error ? "alert" : "status"}>{error || "Đang xác minh lại quyền quản trị…"}</p>
    {!busy && <button className="mt-4 min-h-10 rounded-[4px] border border-[var(--border)] px-4" onClick={() => setAttempt(v => v + 1)}>Thử lại xác thực</button>}
  </AuthSurface>;
}
