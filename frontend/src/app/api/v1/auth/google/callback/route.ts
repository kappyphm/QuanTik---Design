import { appOrigin, copyCookies, upstream } from "@/lib/server/api-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// BE-GAP AUTH-02: BE returns JSON; Next finishes the exchange without tokens in URLs.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const headers = new Headers({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  const redirect = (path: string) => {
    headers.set("Location", new URL(path, appOrigin(request)).href);
    return new Response(null, { status: 303, headers });
  };
  const state = query.get("state"), code = query.get("code");
  if (query.has("error") || !state || !code) return redirect("/login?error=google");
  const cookie = (request.headers.get("cookie") || "").split(";").map(v => v.trim())
    .filter(v => v.startsWith("quantik_oauth_browser=")).join("; ");
  try {
    const result = await upstream(`auth/google/callback?${new URLSearchParams({ state, code })}`, { headers: { Cookie: cookie } });
    if (!result.ok) return redirect("/login?error=google");
    const payload = await result.json();
    if (typeof payload.exchange_code !== "string") return redirect("/login?error=google");
    const exchange = await upstream("auth/exchange", { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ code: payload.exchange_code }) });
    if (!exchange.ok) return redirect("/login?error=google");
    copyCookies(result, headers);
    copyCookies(exchange, headers);
    return redirect("/dashboard");
  } catch {
    return redirect("/login?error=backend");
  }
}
