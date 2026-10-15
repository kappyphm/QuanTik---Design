"use client";
import { Suspense, type ReactNode } from "react";
import { useSession } from "../account/session";
import { AuthSurface } from "../account/auth-surface";
import { Login } from "../account/login";
import { Shell } from "../shell";

export function AdminBoundary({ verified, children }: { verified: boolean; children: ReactNode }) {
  const session = useSession("admin");
  if (!verified || session.state === "anonymous" || session.state === "error") {
    return <AuthSurface><Suspense fallback={null}><Login admin /></Suspense></AuthSurface>;
  }
  if (session.state !== "ready") return <AuthSurface><p role="status">Đang xác thực…</p></AuthSurface>;
  return <Shell><div key={session.profile!.id}>{children}</div></Shell>;
}
