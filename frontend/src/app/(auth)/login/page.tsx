import { Suspense } from "react";
import { Login } from "@/components/account/login";
export default function Page() { return <Suspense fallback={<p>Đang tải…</p>}><Login /></Suspense>; }
