export const runtime = "nodejs";

export async function GET() {
  try {
    const upstream = await fetch("https://trading.agr.vn/datafeed/instruments", {
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) throw new Error("AGR unavailable");
    const payload = await upstream.json();
    if (payload.s !== "ok" || !Array.isArray(payload.d) || !payload.d.length) throw new Error("Invalid AGR snapshot");
    return Response.json({ records: payload.d }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Không tải được bảng điện AGR. Đang thử kết nối lại." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
