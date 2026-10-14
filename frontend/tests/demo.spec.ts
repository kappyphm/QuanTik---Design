import { test, expect } from "@playwright/test";

test("Dữ liệu mẫu: mở nến và nạp kết quả Quant FPT trong sidebar", async ({ page }) => {
  const errors: string[] = [], apiCalls: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (/\/api\/|\/quant\/jobs/.test(request.url())) apiCalls.push(request.url()); });
  await page.goto("/dashboard");
  await expect(page.getByText("1.687,54", { exact: true })).toBeVisible();
  await page.getByPlaceholder("Tìm mã hoặc tên").fill("FPT");
  await page.getByRole("button", { name: "FPT", exact: true }).click();
  const chart = page.getByRole("dialog", { name: "Biểu đồ FPT", exact: true });
  await expect(chart.getByRole("img", { name: /48 phiên mẫu/ })).toBeVisible();
  const plot = await chart.getByRole("img").boundingBox();
  const panel = await chart.locator(".chart-quant").boundingBox();
  if (plot && panel && panel.y < plot.y + plot.height) {
    expect(plot.x + plot.width).toBeLessThanOrEqual(panel.x);
  }
  await chart.getByRole("img").hover({ position: { x: 250, y: 130 } });
  await chart.getByLabel("Khung thời gian", { exact: true }).selectOption("1M");
  await expect(chart.getByRole("img", { name: /12 phiên mẫu/ })).toBeVisible();
  await chart.getByRole("button", { name: "Chạy Quant FPT", exact: true }).click();
  const review = page.getByRole("dialog", { name: "Trước khi chạy Quant FPT", exact: true });
  await expect(review.getByText("20% mẫu", { exact: true })).toBeVisible();
  await review.getByRole("button", { name: "Chạy phân tích mẫu", exact: true }).click();
  await expect(chart.locator(".quant-action")).toContainText("THEO DÕI");
  await expect(chart.getByRole("status")).toHaveText("Mô phỏng");
  expect(errors).toEqual([]);
  expect(apiCalls).toEqual([]);
});

test("Dữ liệu mẫu: quét 10 mã và đổi mã Quant độc lập", async ({ page }) => {
  await page.goto("/screener");
  await expect(page.locator(".scan-item")).toHaveCount(0);
  await page.getByRole("button", { name: "Quét toàn sàn", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("10 mã · 2 nhóm");
  await page.getByRole("button", { name: "Quét lại", exact: true }).click();
  await expect(page.locator(".scan-item")).toHaveCount(0);
  await page.getByRole("button", { name: "Tiêu chí & trọng số", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Quét toàn sàn", exact: true }).click();
  await expect(page.locator(".scan-item")).toHaveCount(10);
  await page.goto("/analysis?symbol=HPG");
  await page.getByRole("button", { name: "Chạy Quant HPG", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Chạy phân tích mẫu", exact: true }).click();
  await expect(page.locator(".quant-action")).toContainText("THẬN TRỌNG");
  await page.getByLabel("Chọn mã phân tích", { exact: true }).fill("ZZZ");
  await page.getByRole("button", { name: "Chọn mã", exact: true }).click();
  await page.getByRole("button", { name: "Chạy Quant ZZZ", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Chạy phân tích mẫu", exact: true })).toBeDisabled();
});
