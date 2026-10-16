import { test, expect, type Page } from "@playwright/test";

async function stubTradingView(page: Page) {
  await page.route("https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js", route => route.fulfill({
    contentType: "application/javascript",
    body: `(() => { const script = document.currentScript; const config = JSON.parse(script.textContent); const frame = document.createElement("iframe"); frame.title = "TradingView"; frame.dataset.symbol = config.symbol; frame.dataset.interval = config.interval; frame.src = "about:blank"; script.parentElement.querySelector(".tradingview-widget-container__widget").append(frame); })();`,
  }));
}

test("Home giữ nội dung và dẫn đến đăng nhập hệ thống", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Nghe một mã/ })).toBeVisible();
  await page.locator(".home-live-heading button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.route("**/api/v1/auth/refresh", route => route.fulfill({ status: 401, contentType: "application/json", body: '{"code":"UNAUTHENTICATED"}' }));
  await page.getByRole("button", { name: "Đăng nhập hệ thống" }).click();
  await expect(page).toHaveURL(/login/);
  await expect(page.getByRole("heading", { name: "Đăng nhập hệ thống" })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Khu vực quản trị" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Dashboard hợp nhất bảng điện, nhóm ngành và Theo dõi", async ({ page }) => {
  await page.goto("/dashboard");
  const board = page.getByRole("region", { name: "Bảng cổ phiếu; cuộn ngang để xem đủ cột" });
  await expect(board.locator("tbody tr")).toHaveCount(8);
  await page.screenshot({ path: `test-results/ui/${test.info().project.name}/dashboard.png`, fullPage: true });
  await page.getByPlaceholder("Tìm mã hoặc tên").fill("SSI");
  await expect(board.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Theo dõi SSI", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /^Theo dõi 4$/ }).click();
  await expect(board.getByRole("button", { name: "SSI", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Bỏ theo dõi SSI", exact: true }).click();
  await expect(board.getByRole("button", { name: "SSI", exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Tất cả", exact: true }).click();
  await page.getByRole("button", { name: "Công nghệ Thông tin", exact: true }).click();
  await expect(board.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Xóa lọc ngành" }).click();
  const positions = await page.locator(".dashboard-stack > section").evaluateAll(elements => elements.map(el => el.getBoundingClientRect().top));
  expect(positions.length).toBe(2);
  expect(positions[1]).toBeGreaterThan(positions[0]);
  await expect(page.locator(".selected-stock")).toHaveCount(0);
});

test("Bấm mã mở TradingView cùng Quant, mở/thu sidebar và toàn màn hình", async ({ page }) => {
  await stubTradingView(page);
  await page.goto("/dashboard");
  await page.getByPlaceholder("Tìm mã hoặc tên").fill("FPT");
  await page.getByRole("button", { name: "FPT", exact: true }).click();
  const chart = page.getByRole("dialog", { name: "Biểu đồ FPT", exact: true });
  await expect(chart).toBeVisible();
  await chart.getByLabel("Nguồn biểu đồ", { exact: true }).selectOption("TradingView");
  const frame = chart.locator("iframe");
  await expect(frame).toHaveAttribute("data-symbol", "HOSE:FPT");
  await chart.getByLabel("Khung thời gian", { exact: true }).selectOption("1W");
  await expect(chart.locator("iframe")).toHaveAttribute("data-interval", "W");
  await chart.getByRole("button", { name: "Thu phân tích", exact: true }).click();
  await expect(chart.getByRole("complementary")).toHaveCount(0);
  await chart.getByRole("button", { name: "Mở phân tích bên chart", exact: true }).click();
  await chart.getByRole("button", { name: "Chạy Quant FPT", exact: true }).click();
  const review = page.getByRole("dialog", { name: "Trước khi chạy Quant FPT", exact: true });
  await expect(review.getByText("Sharpe", { exact: true })).toBeVisible();
  await expect(review.getByRole("button", { name: "Chạy phân tích mẫu" })).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("button", { name: "Chạy Quant FPT", exact: true })).toBeFocused();
  await chart.getByRole("link", { name: "Mở Quant toàn màn hình" }).click();
  await expect(page).toHaveURL(/analysis\?symbol=FPT/);
});

test("Quét toàn sàn yêu cầu đăng nhập và không có nút phát động quét", async ({ page }) => {
  await page.goto("/screener");
  await expect(page.getByRole("heading", { name: "Cần đăng nhập", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quét toàn sàn", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Quét lại", exact: true })).toHaveCount(0);
});

test("Theme và các trang giữ bố cục trong màn hình desktop/mobile", async ({ page, isMobile }) => {
  await stubTradingView(page);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Chuyển chế độ sáng" }).click();
  await page.reload();
  await expect(page.locator(".terminal")).toHaveAttribute("data-theme", "light");
  for (const route of ["/", "/dashboard", "/screener", "/analysis?symbol=FPT", "/charts?symbol=FPT"]) {
    await page.goto(route);
    const sizes = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(sizes.scroll, route).toBeLessThanOrEqual(sizes.width + 1);
  }
  if (isMobile) {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await page.getByRole("link", { name: "Quét toàn sàn", exact: true }).click();
    await expect(page).toHaveURL(/screener/);
    await expect(page.getByRole("button", { name: "Mở menu", exact: true })).toHaveAttribute("aria-expanded", "false");
  }
});
