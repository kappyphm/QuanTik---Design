import { test, expect, type Page } from "@playwright/test";
const item = (symbol: string) => ({ symbol, exchange: "HOSE", score: 75, price_vnd: 58000, change_ratio: 0.02, recommendation: "Theo dõi" });
async function fixture(page: Page, mode = "ready") {
  const state = { mode, calls: [] as string[], results: [] as string[], mutations: [] as string[] };
  await page.route("**/api/v1/**", async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.slice(8);
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    state.calls.push(path);
    if (path === "auth/refresh") return json({ access_token: "screening-fixture", expires_in: 900 });
    if (path === "me") return json({ id: "screening-user", role: "user", display_name: "Khách kiểm thử", email: "screening@example.test" });
    if (request.method() !== "GET") { state.mutations.push(path); return json({},400); }
    if (path === "screenings/latest") {
      if (state.mode === "unpaid") return json({ code: "SCREENING_SUBSCRIPTION_REQUIRED" },403);
      if (state.mode === "network") return json({ code: "BACKEND_UNAVAILABLE" },502);
      if (state.mode === "waiting") return json({ code: "SCREENING_NOT_READY", latest_attempt: { reason: "TASK_DEADLINE" } },503);
      return json({ id: state.mode === "new" ? "new-run" : "ready-run", target_session: "2026-10-16", published_at: 1792123200, stale: state.mode === "stale", refresh_after_seconds: 60 });
    }
    const match = path.match(/^screenings\/(.+)\/results$/);
    if (match) {
      state.results.push(match[1]);
      expect(url.searchParams.get("limit")).toBe("5");
      expect(url.searchParams.has("cursor")).toBeFalsy();
      const group = url.searchParams.get("group");
      expect(["OVERALL","DISTRIBUTION"]).toContain(group);
      const first = match[1] === "new-run" ? "VCB" : "FPT";
      return json({ run_id: match[1], group, items: [first,"HPG","MBB","SSI","VNM","SHOULD_NOT_SHOW"].map(item), next_cursor: null });
    }
    return json({ code: "NOT_FOUND" },404);
  });
  return state;
}

test("Screening: tự tải kết quả, chỉ 5 mã mỗi nhóm và không lộ nội bộ", async ({ page }) => {
  const state = await fixture(page); await page.goto("/screener");
  await expect(page.getByRole("heading",{ name: /Khai mở góc nhìn/ })).toBeVisible();
  await expect(page.getByRole("button",{ name: /Kích hoạt quét|Quét lại/ })).toHaveCount(0);
  const best = page.locator("section.panel").filter({ has: page.getByRole("heading",{ name:"5 mã nổi bật",exact:true }) });
  const avoid = page.locator("section.panel").filter({ has: page.getByRole("heading",{ name:"5 mã nên tránh",exact:true }) });
  await expect(best.locator("article")).toHaveCount(5); await expect(avoid.locator("article")).toHaveCount(5);
  await expect(page.getByText(/58\.000/).first()).toBeVisible();
  await expect(page.getByText("2%",{ exact:true }).first()).toBeVisible();
  await expect(page.getByText("SHOULD_NOT_SHOW")).toHaveCount(0);
  await expect(page.getByLabel("Ca công bố",{ exact:true })).toHaveCount(0);
  await expect(page.getByText(/Tiêu chí|trọng số|VNSTOCK|TASK_DEADLINE|Độ phủ|Ca sáng|Ca chiều/)).toHaveCount(0);
  await expect(page.getByRole("button",{ name:"Xem thêm",exact:true })).toHaveCount(0);
  expect(state.mutations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBeTruthy();
});

test("Screening: cập nhật không trộn bản công bố", async ({ page }) => {
  await page.clock.install();
  const state=await fixture(page); await page.goto("/screener");
  await expect(page.getByRole("heading",{ name:/FPT/ }).first()).toBeVisible();
  state.mode="new";
  await page.clock.fastForward(61000);
  await expect(page.getByRole("heading",{ name:/VCB/ }).first()).toBeVisible();
  await expect(page.getByRole("heading",{ name:/FPT/ })).toHaveCount(0);
});

test("Screening: gói hết hiệu lực dẫn mua và không tải danh sách", async ({ page }) => {
  const state=await fixture(page,"unpaid"); await page.goto("/screener");
  await expect(page.getByRole("heading",{ name:"Cần gói phân tích còn hiệu lực",exact:true })).toBeVisible();
  await expect(page.getByRole("link",{ name:"Xem các gói phân tích",exact:true })).toHaveAttribute("href","/plans");
  expect(state.results).toEqual([]);
});

test("Screening: chờ dữ liệu không lộ nguyên nhân vận hành", async ({ page }) => {
  await fixture(page,"waiting"); await page.goto("/screener");
  await expect(page.getByRole("heading",{ name:"Chưa có kết quả được công bố",exact:true })).toBeVisible();
  await expect(page.getByText(/TASK_DEADLINE|quá hạn xử lý|Lần xử lý gần nhất/)).toHaveCount(0);
});

test("Screening: giữ ngày dữ liệu và bản cũ khi cập nhật lỗi", async ({ page }) => {
  await page.clock.install();
  const state=await fixture(page,"stale"); await page.goto("/screener");
  await expect(page.getByText("Dữ liệu ngày 16/10/2026",{ exact:true })).toBeVisible();
  await expect(page.getByText(/Đang hiển thị kết quả gần nhất/)).toBeVisible();
  state.mode="network"; await page.clock.fastForward(61000);
  await expect(page.getByRole("heading",{ name:/FPT/ }).first()).toBeVisible();
});
