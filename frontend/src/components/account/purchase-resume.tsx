"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clearPurchase, readPurchase } from "@/lib/purchase-intent";

export function PurchaseResume() {
  const [intent, setIntent] = useState<ReturnType<typeof readPurchase>>(null);
  useEffect(() => { setIntent(readPurchase()); }, []);
  if (!intent) return null;
  return <aside className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-[var(--accent)] p-4 text-sm">
    <p>{intent.kind === "order" ? "Bạn có đơn thanh toán đang xem trước khi đăng nhập." : "Bạn đang chọn gói phân tích trước khi đăng nhập."}</p>
    <div className="flex gap-4"><Link className="text-[var(--accent)] underline" href={intent.kind === "order" ? `/orders/${intent.id}` : `/plans?selected=${intent.id}`}>Tiếp tục mua gói</Link>
    <button className="text-[var(--muted)]" onClick={() => { clearPurchase(); setIntent(null); }}>Bỏ qua</button></div>
  </aside>;
}
