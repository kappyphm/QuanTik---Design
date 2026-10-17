import { test, expect } from "@playwright/test";

test("Tài khoản mới hoàn thiện hồ sơ trước khi vào dashboard", async ({ page }) => {
  let required = true;
  let payload: Record<string, unknown> | null = null;
  await page.route("**/api/v1/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path.endsWith("/auth/refresh")) body = { access_token: "onboarding-fixture", expires_in: 900 };
    if (path.endsWith("/me")) body = { id: "new-customer", role: "user", display_name: "Tên Google", email: "customer@example.test", profile_required: required };
    if (path.endsWith("/me/profile")) { payload = route.request().postDataJSON(); required = false; body = { ...payload, id: "new-customer", role: "user", profile_required: false }; }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Hoàn thiện tài khoản" })).toBeVisible();
  await page.getByLabel("Họ và tên").fill("Người dùng mới");
  await page.getByLabel("Ngày tháng năm sinh").fill("1995-03-15");
  await page.getByLabel("Số điện thoại").fill("0901234567");
  await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoàn thiện tài khoản" })).toHaveCount(0);
  expect(payload).toEqual({ display_name: "Người dùng mới", date_of_birth: "1995-03-15", phone_number: "0901234567" });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Hoàn thiện tài khoản" })).toHaveCount(0);
});
