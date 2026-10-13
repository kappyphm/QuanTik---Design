import { test, expect } from "@playwright/test";

test("Home cũ giữ nội dung, mở mô hình và dẫn đến Dashboard", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Nghe một mã/ }),
  ).toBeVisible();
  await page.locator(".home-live-heading button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Mở Terminal" }).click();
  await expect(page).toHaveURL(/dashboard/);
  expect(errors).toEqual([]);
});

test("Dashboard hợp nhất, tìm kiếm, lọc ngành và Theo dõi được lưu", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByPlaceholder("Tìm mã hoặc tên").fill("SSI");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Theo dõi SSI", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /^Theo dõi 4$/ }).click();
  await expect(
    page.getByRole("button", { name: "SSI", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Bỏ theo dõi SSI", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "SSI", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Tất cả", exact: true }).click();
  await page.getByRole("button", { name: /Công nghệ/ }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "FPT", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa lọc ngành" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(8);
  await page.getByRole("button", { name: "Trang sau" }).click();
  await expect(page.locator(".table-pagination")).toContainText("9–16");
});

test("Phân tích và biểu đồ đổi mô hình, mã và khung thời gian", async ({
  page,
}) => {
  await page.goto("/analysis?symbol=FPT");
  await expect(
    page.getByRole("heading", { name: "HÀNH ĐỘNG", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Monte Carlo · Phân phối giá" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Monte Carlo", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Monte Carlo · Phân phối giá" }),
  ).not.toBeVisible();
  await page
    .getByRole("button", { name: "Giải thích HMM", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Giải thích HMM", exact: true }),
  ).toBeFocused();
  await page.goto("/charts?symbol=HPG");
  await expect(page.getByRole("img", { name: /65 kỳ/ })).toBeVisible();
  await page.getByRole("button", { name: "1W", exact: true }).click();
  await expect(page.getByRole("img", { name: /65 kỳ/ })).not.toBeVisible();
  await page.getByRole("button", { name: "CMF +", exact: true }).click();
  await expect(page.getByRole("img", { name: /có CMF/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Biểu đồ đường", exact: true })
    .click();
  await expect(page.getByRole("img", { name: /đường giá/ })).toBeVisible();
  await page.getByLabel("Chọn mã biểu đồ").selectOption("MBB");
  await expect(page).toHaveURL(/symbol=MBB/);
  await page.goto("/analysis?symbol=ZZZ");
  await expect(
    page.getByRole("heading", { name: "Chưa có kết quả minh họa" }),
  ).toBeVisible();
});

test("Bộ lọc reset, theme và bố cục không làm tràn chiều ngang", async ({
  page,
  isMobile,
}) => {
  await page.goto("/screener");
  await page.getByRole("button", { name: /Cần thận trọng/ }).click();
  await page.getByLabel("Khối lượng tối thiểu").selectOption("10");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Đặt lại" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(8);
  await page.getByRole("button", { name: "Chuyển chế độ sáng" }).click();
  await page.reload();
  await expect(page.locator(".terminal")).toHaveAttribute(
    "data-theme",
    "light",
  );
  for (const route of [
    "/",
    "/dashboard",
    "/analysis?symbol=FPT",
    "/charts?symbol=FPT",
  ]) {
    await page.goto(route);
    const sizes = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(sizes.scroll, route).toBeLessThanOrEqual(sizes.width + 1);
  }
  if (isMobile) {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await page.getByRole("link", { name: "Lọc cổ phiếu", exact: true }).click();
    await expect(page).toHaveURL(/screener/);
    await expect(
      page.getByRole("button", { name: "Mở menu", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
  }
});
