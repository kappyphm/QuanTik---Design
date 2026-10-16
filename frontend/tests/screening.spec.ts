import { test, expect, type Page } from "@playwright/test";

const criterion = { state: "TRUE", reason_codes: [], minimum_bars: 20, detail: "Khối lượng / trung bình 20 phiên = 1,8" };
const metrics = { score: 71.4, true_count: 5, false_count: 2, unavailable_count: 0, coverage_ratio: 1, ranking_eligible: true, criteria: { S2_vol_spike: criterion } };
const item = (symbol: string) => ({ symbol, exchange: "HOSE", overall_score: 71.4, ranking_eligible: true, groups: { STRONG: metrics, ACCUMULATION: metrics, DISTRIBUTION: { ...metrics, criteria: { D2_long_upper_shadow: { ...criterion, state: "UNAVAILABLE", minimum_bars: 1 } }, unavailable_count: 1 } },
  assessment: { status: "UNAVAILABLE" }, price_summary: { close: 58000, pct_change_1d: 0.02 }, volume_context: { observed_at: "2026-10-16T04:45:00Z", input_mode: "PROVISIONAL_DAILY" }, ranks: { OVERALL: 1 }, warnings: ["CORPORATE_ACTION_ADJUSTMENT_UNVERIFIED"], rejection_reasons: [] });
async function fixture(page: Page, mode = "ready") {
  const state = { mode, calls: [] as string[], results: [] as string[], mutations: [] as string[] };
  await page.route("**/api/v1/**", async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.slice(8);
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    state.calls.push(path);
    if (path === "auth/refresh") return json({ access_token: "screening-fixture", expires_in: 900 });
    if (path === "me") return json({ id: "screening-user", role: "user", display_name: "Khách kiểm thử", email: "screening@example.test" });
    if (request.method() !== "GET") { state.mutations.push(path); return json({}, 400); }
    if (path === "screenings/latest") {
      if (state.mode === "unpaid") return json({ code: "SCREENING_SUBSCRIPTION_REQUIRED" }, 403);
      if (state.mode === "network") return json({ code: "BACKEND_UNAVAILABLE" }, 502);
      if (state.mode === "waiting") return json({ code: "SCREENING_NOT_READY", latest_attempt: { id: "attempt", target_session: "2026-10-16", slot: "AM", status: "FAILED", reason: "TASK_DEADLINE" } }, 503);
      const pm = url.searchParams.get("slot") === "PM";
      return json({ id: state.mode === "new" ? "new-run" : pm ? "pm-run" : "am-run", target_session: "2026-10-16", slot: pm ? "PM" : "AM", status: "READY", published_at: 1792123200,
        stale: state.mode === "stale", stale_reasons: state.mode === "stale" ? ["EXPECTED_SLOT_UNPUBLISHED"] : [], calendar_status: "READY", latest_attempt: null,
        summary: { expected_symbols: 1519, ready_symbols: 1500, history_coverage_ratio: 1500/1519, input_mode: "PROVISIONAL_DAILY", source_mode: "LIVE_SCREENING_VALIDATED", validation_scope: "SCREENING_ONLY" } });
    }
    const match = path.match(/^screenings\/(.+)\/results$/);
    if (match) {
      state.results.push(match[1]);
      const group = url.searchParams.get("group"), more = url.searchParams.has("cursor");
      return json({ run_id: match[1], group, items: [item(more ? "HPG" : match[1] === "new-run" ? "VCB" : match[1] === "pm-run" ? "MBB" : "FPT")], next_cursor: group === "OVERALL" && !more ? "5" : null });
    }
    return json({ code: "NOT_FOUND" }, 404);
  });
  return state;
}

test("Screening: vào thẳng kết quả, dữ liệu đúng đơn vị và phân trang theo run", async ({ page }) => {
  const state = await fixture(page);
  await page.goto("/screener");
  await expect(page.getByRole("heading", { name: "Mã nổi bật", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quét toàn sàn", exact: true })).toHaveCount(0);
  await expect(page.getByText(/58\.000/).first()).toBeVisible();
  await expect(page.getByText("2%", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Xem thêm", exact: true }).click();
  await expect(page.getByRole("heading", { name: /HPG/ })).toBeVisible();
  await page.getByText("Xem tiêu chí và lý do", { exact: true }).first().click();
  await expect(page.getByText("Khối lượng đột biến", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Chưa đủ dữ liệu", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/HMM|Monte Carlo|GARCH/)).toHaveCount(0);
  await expect(page.locator('a[href^="/analysis?"]')).toHaveCount(0);
  expect(state.results.every(id => id === "am-run")).toBeTruthy();
  expect(state.mutations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBeTruthy();
});

test("Screening: đổi ca và bản công bố không trộn kết quả kỳ trước", async ({ page }) => {
  const state = await fixture(page);
  await page.goto("/screener");
  await expect(page.getByRole("heading", { name: /FPT/ }).first()).toBeVisible();
  await page.getByLabel("Ca công bố", { exact: true }).selectOption("PM");
  await expect(page.getByRole("heading", { name: /MBB/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /FPT/ })).toHaveCount(0);
  state.mode = "new";
  await page.getByRole("button", { name: "Cập nhật kết quả", exact: true }).click();
  await expect(page.getByRole("heading", { name: /VCB/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /MBB/ })).toHaveCount(0);
});

test("Screening: cần gói thì dẫn mua, không tải kết quả", async ({ page }) => {
  const state = await fixture(page, "unpaid"); await page.goto("/screener");
  await expect(page.getByRole("heading", { name: "Cần gói phân tích còn hiệu lực", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem các gói phân tích", exact: true })).toHaveAttribute("href", "/plans");
  expect(state.results).toEqual([]);
});

test("Screening: chưa có công bố hiện trạng thái chờ và nguyên nhân", async ({ page }) => {
  await fixture(page, "waiting"); await page.goto("/screener");
  await expect(page.getByRole("heading", { name: "Chưa có kết quả được công bố", exact: true })).toBeVisible();
  await expect(page.getByText(/Ca quét đã quá hạn xử lý/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /FPT/ })).toHaveCount(0);
});

test("Screening: bản cũ vẫn xem được khi ca mới chưa công bố hoặc lỗi mạng", async ({ page }) => {
  const state = await fixture(page, "stale"); await page.goto("/screener");
  await expect(page.getByText(/Chưa có kết quả cho ca dự kiến gần nhất/)).toBeVisible();
  state.mode = "network";
  await page.getByRole("button", { name: "Cập nhật kết quả", exact: true }).click();
  await expect(page.getByText(/Chưa cập nhật được trạng thái mới/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /FPT/ }).first()).toBeVisible();
});
