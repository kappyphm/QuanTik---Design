"use client";
import { useRouter } from "next/navigation";
import HomePage from "@/components/home/home-page";
export default function Page() {
  const router = useRouter();
  return (
    <HomePage
      onNavigate={() => router.push("/dashboard")}
      onInspect={(symbol) =>
        router.push(`/analysis?symbol=${encodeURIComponent(symbol)}`)
      }
    />
  );
}
