import { test, expect, type Page, type Route } from "@playwright/test";

const accountId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const orderId = "33333333-3333-4333-8333-333333333333";
const plan = { id: planId, name: "Gói kiểm thử", price_vnd: 150000, duration_days: 30, analysis_quota: 25, active_limit: 2, available: true, currency: "VND", features: { screening: true, analysis: true } };
const token = { access_token: "fixture-access-only", expires_in: 900 };
async function fixture(page: Page, options: { user?: boolean; admin?: boolean } = {}) {
  const origin = String(test.info().project.use.baseURL || "http://127.0.0.1:3107");
  if (options.admin) await page.context().addCookies([{ name: "quantik_admin_gate", value: "fixture-access-only", domain: new URL(origin).hostname, path: "/admin", httpOnly: true, sameSite: "Strict" }]);
  const state = { user: options.user ?? false, admin: options.admin ?? false, paid: false, creates: 0, keys: [] as string[], failOrder: false, revision: 2, patches: [] as Record<string, unknown>[], conflict: false, enabled: true, userChanges: [] as unknown[], applies: [] as unknown[], plans: [plan] };
  const unknown: string[] = [];
  await page.route("**/api/v1/**", async (route: Route) => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.replace("/api/v1/", ""), method = request.method();
    const json = (value: unknown, status = 200, headers: Record<string, string> = {}) => route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(value) });
    const gate = { "set-cookie": "quantik_admin_gate=fixture-access-only; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=900" };
    if (path === "auth/refresh" || path === "admin/auth/refresh") return json(state[path.startsWith("admin") ? "admin" : "user"] ? token : { code: "UNAUTHENTICATED" }, state[path.startsWith("admin") ? "admin" : "user"] ? 200 : 401, path.startsWith("admin") && state.admin ? gate : {});
    if (path === "admin/auth/login") { state.admin = request.postDataJSON().password === "fixture-password"; return json(state.admin ? token : { code: "UNAUTHENTICATED" }, state.admin ? 200 : 401, state.admin ? gate : {}); }
    if (path.endsWith("auth/logout")) { state[path.startsWith("admin") ? "admin" : "user"] = false; return route.fulfill({ status: 204, headers: path.startsWith("admin") ? { "set-cookie": "quantik_admin_gate=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0" } : {} }); }
    if (path === "plans") return json({ payments_enabled: true, items: state.plans.filter(p => p.available) });
    if (path === "me") return json({ id: accountId, role: "user", display_name: "Người dùng QuanTik", email: "customer@example.test" });
    if (path === "admin/me") return json({ id: "fixture-admin", role: "admin", username: "operator" });
    if (path === "me/entitlements") return json({ active: state.paid, remaining: state.paid ? 25 : 0, active_limit: state.paid ? 2 : 0, valid_until: null, cancel_after_compute_consumes: true });
    if (path === "me/usage") return json({ buckets: [] });
    if (path === "subscription") return json({ items: [], next_cursor: null });
    if (path === "orders" && method === "POST") {
      state.creates++; state.keys.push(request.headers()["idempotency-key"]);
      if (state.failOrder && state.creates === 1) return json({ code: "BACKEND_UNAVAILABLE" }, 502);
      return json(order(), 201);
    }
    if (path === `orders/${orderId}`) return json(order());
    if (path === `orders/${orderId}/cancel`) return state.paid ? json({ code: "PAID_ORDER_CANNOT_CANCEL" }, 409) : json({ ...order(), status: "CANCELLED" });
    if (path === "orders" || path === "payments") return json({ items: [], next_cursor: null });
    if (path === "admin/integrations/sepay") {
      if (method === "PATCH") { state.patches.push(request.postDataJSON()); if (state.conflict) return json({ code: "INTEGRATION_REVISION_CONFLICT" }, 409); state.revision++; }
      return json({ provider: "sepay", revision: state.revision, source: "ADMIN_DATABASE", encryption_ready: true, updated_at: null, bank_code: "TPBANK", account_number: "000123456", account_name: "QUANTIK", transfer_prefix: "", requires_transfer_prefix: false, payments_enabled: false, webhook_api_key_configured: true, configuration_complete: true, missing_fields: [] });
    }
    if (path === "admin/integrations/vnstock") return json({ provider: "vnstock", revision: 0, source: "ENVIRONMENT", encryption_ready: true, updated_at: null, api_key_configured: false, scheduled_provider_enabled: false });
    if (path === "admin/users") return json({ items: [{ id: accountId, enabled: state.enabled }], next_cursor: null });
    if (path === `admin/users/${accountId}/state`) { state.userChanges.push(request.postDataJSON()); state.enabled = request.postDataJSON().enabled; return json({ id: accountId, enabled: state.enabled }); }
    if (path === "admin/plans") {
      if (method === "POST") { const created = { ...request.postDataJSON(), id: "new-plan", available: false, currency: "VND" }; state.plans.push(created); return json(created, 201); }
      return json({ items: state.plans, next_cursor: null });
    }
    if (path === `admin/plans/${planId}/availability`) return json({ ...plan, available: request.postDataJSON().available });
    if (path.startsWith("admin/configs/")) {
      const id = "a".repeat(64), previous = "b".repeat(64);
      const payload = { enabled: true, ingestion_enabled: false, screening_enabled: true, snapshots_enabled: true, training_enabled: true, auto_promote: true, retry_seconds: 300, maximum_attempts: 36, task_timeout_seconds: 28800, history_calendar_days: 1900 };
      if (path.endsWith("/activate")) { state.applies.push(request.postDataJSON()); return json({ code: "CONFIG_ACTIVATION_CONFLICT" }, 409); }
      if (path.endsWith("/versions")) return json({ id, kind: "OPERATIONS", payload: request.postDataJSON().payload, created_at: 1792000000 }, 201);
      return json({ active_version: previous, items: [{ id, kind: "OPERATIONS", payload, created_at: 1792000000 }], next_cursor: null, runtime_gates: { scheduled_provider_enabled: false } });
    }
    if (["admin/orders", "admin/jobs", "admin/subscriptions", "admin/payments", "admin/reconciliation", "admin/audit", "admin/scheduled-tasks"].includes(path)) return json({ items: [], next_cursor: null });
    unknown.push(`${method} ${path}`); return json({ code: "UNHANDLED_FIXTURE" }, 500);
  });
  function order() { return { id: orderId, plan_id: planId, amount_vnd: 150000, reference: "QTKFIXTURE", status: state.paid ? "PAID" : "PENDING", created_at: Math.floor(Date.now() / 1000), expires_at: Math.floor(Date.now() / 1000) + 1800, paid_at: state.paid ? Math.floor(Date.now() / 1000) : null, bank: "TPBANK", account_number: "000123456", account_name: "QUANTIK", transfer_content: "QTKFIXTURE", qr_url: null }; }
  return { state, unknown };
}

test("Mua gói: retry giữ Idempotency-Key, mở lại đơn và nhận thanh toán từ BE", async ({ page }) => {
  const { state, unknown } = await fixture(page, { user: true }); state.failOrder = true;
  await page.goto("/plans");
  await page.getByRole("button", { name: "Chọn gói", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.locator(".account-notice[role=alert]")).toContainText("Chưa kết nối");
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));
  await expect(page.getByText("000123456", { exact: false }).first()).toBeVisible();
  expect(state.keys).toHaveLength(2); expect(state.keys[0]).toBeTruthy(); expect(state.keys[0]).toBe(state.keys[1]);
  await page.reload(); await expect(page.getByRole("button", { name: "Kiểm tra thanh toán" })).toBeVisible();
  state.paid = true; await page.getByRole("button", { name: "Kiểm tra thanh toán" }).click();
  await expect(page.getByText("Đã thanh toán", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hủy đơn", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => Object.values(localStorage).join(" "))).not.toContain("fixture-access-only");
  await expect(page.getByText(/Gói hiện tại còn 25 lượt/)).toBeVisible();
  await page.screenshot({ path: `test-results/billing/${test.info().project.name}-paid.png`, fullPage: true });
  expect(unknown).toEqual([]);
});

test("Admin login: sai mật khẩu, đăng nhập thành công và logout thu hồi giao diện", async ({ page }) => {
  const { unknown } = await fixture(page);
  await page.goto("/admin/login");
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill("operator");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".account-notice[role=alert]")).toContainText("mật khẩu không đúng");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Quản trị QuanTik", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất quản trị" }).click();
  await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  expect(unknown).toEqual([]);
});

test("Admin config: PATCH đúng revision, không gửi secret giữ nguyên; conflict không tự ghi đè", async ({ page }) => {
  const { state, unknown } = await fixture(page, { admin: true }); state.conflict = true;
  await page.goto("/admin/config/integrations");
  const panel = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "SePay · nhận thanh toán", exact: true }) });
  await panel.getByLabel("Tên chủ tài khoản", { exact: true }).fill("QUANTIK UPDATED");
  await panel.getByLabel("Lý do (10–500 ký tự)").fill("Cập nhật tên nhận tiền theo đối chiếu");
  await panel.getByRole("button", { name: "Kiểm tra thay đổi" }).click();
  await panel.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("người khác thay đổi");
  expect(state.patches).toEqual([{ account_name: "QUANTIK UPDATED", expected_revision: 2, reason: "Cập nhật tên nhận tiền theo đối chiếu" }]);
  expect(state.patches[0]).not.toHaveProperty("webhook_api_key");
  expect(state.patches).toHaveLength(1); expect(unknown).toEqual([]);
});

test("Người dùng: khóa có lý do, cập nhật trạng thái; không có sửa hồ sơ giả", async ({ page }) => {
  const { state, unknown } = await fixture(page, { admin: true });
  await page.goto("/admin/users");
  await page.getByRole("button", { name: "Quản lý", exact: true }).click();
  await page.getByLabel("Lý do (10–500 ký tự)").fill("Khóa theo yêu cầu kiểm tra tài khoản");
  await page.getByRole("button", { name: "Khóa tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByText("Tài khoản đang bị khóa.", { exact: true })).toBeVisible();
  expect(state.userChanges).toEqual([{ enabled: false, reason: "Khóa theo yêu cầu kiểm tra tài khoản" }]);
  expect(unknown).toEqual([]);
});

test("Vận hành: kích hoạt gửi expected_version và conflict yêu cầu review lại", async ({ page }) => {
  const { state, unknown } = await fixture(page, { admin: true });
  await page.goto("/admin/config/operations");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await page.getByLabel("Lý do (10–500 ký tự)").fill("Áp dụng cấu hình đã được kiểm tra");
  await page.getByRole("button", { name: "Xác nhận áp dụng", exact: true }).click();
  await expect(page.locator(".account-notice[role=alert]")).toContainText("Phiên bản đang áp dụng đã thay đổi");
  expect(state.applies).toEqual([{ expected_version: "b".repeat(64), reason: "Áp dụng cấu hình đã được kiểm tra" }]);
  expect(unknown).toEqual([]);
});

test("Customer không có phiên admin: chặn màn quản trị; mobile không tràn ngang", async ({ page }) => {
  const { unknown } = await fixture(page, { user: true });
  await page.goto("/admin/config/integrations");
  await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByLabel("Tên chủ tài khoản", { exact: true })).toHaveCount(0);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Người dùng QuanTik", exact: true })).toBeVisible();
  await expect(page.getByText("customer@example.test", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Quản trị", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  expect(unknown).toEqual([]);
});

test("Mở các màn mới với API fixture, giữ bố cục và chụp preview cấu hình", async ({ page }) => {
  const { unknown } = await fixture(page, { user: true, admin: true });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  for (const route of ["/admin", "/admin/orders", "/admin/plans", "/admin/payments", "/admin/subscriptions", "/admin/reconciliation", "/admin/jobs", "/admin/audit", "/admin/scheduled-tasks", "/admin/config/calendar", "/account/orders", "/account/payments"]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByText("Đang kiểm tra phiên đăng nhập…", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), route).toBeTruthy();
  }
  await page.goto("/admin/config/integrations");
  await expect(page.getByLabel("Tên chủ tài khoản", { exact: true })).toHaveValue("QUANTIK");
  await page.screenshot({ path: `test-results/account-admin/${test.info().project.name}/integrations.png`, fullPage: true });
  await page.getByRole("button", { name: "Chuyển chế độ sáng", exact: true }).click();
  await page.screenshot({ path: `test-results/account-admin/${test.info().project.name}/integrations-light.png`, fullPage: true });
  expect(errors).toEqual([]); expect(unknown).toEqual([]);
});

test("Đổi khóa tích hợp: chỉ gửi secret mới, xóa nội dung form sau lưu", async ({ page }) => {
  const { state, unknown } = await fixture(page, { admin: true });
  await page.goto("/admin/config/integrations");
  const panel = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "SePay · nhận thanh toán", exact: true }) });
  await panel.getByLabel("Khóa webhook", { exact: true }).selectOption("replace");
  await panel.getByLabel("Khóa mới", { exact: true }).fill("fixture-secret-not-real");
  await panel.getByLabel("Lý do (10–500 ký tự)").fill("Thay khóa theo quy trình kiểm thử");
  await panel.getByRole("button", { name: "Kiểm tra thay đổi" }).click();
  await panel.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(panel.getByText("Đã lưu cấu hình.", { exact: false })).toBeVisible();
  expect(state.patches).toEqual([{ webhook_api_key: "fixture-secret-not-real", expected_revision: 2, reason: "Thay khóa theo quy trình kiểm thử" }]);
  await expect(panel.getByLabel("Khóa mới", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain("fixture-secret-not-real");
  expect(unknown).toEqual([]);
});

test("Hủy đơn đua với thanh toán: phản ánh PAID và không tự đổi trạng thái", async ({ page }) => {
  const { state, unknown } = await fixture(page, { user: true });
  await page.goto(`/orders/${orderId}`);
  await page.getByRole("button", { name: "Hủy đơn", exact: true }).click();
  state.paid = true;
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.locator(".account-notice[role=alert]")).toContainText("không thể hủy");
  await expect(page.getByText("Đã thanh toán", { exact: true })).toBeVisible();
  expect(unknown).toEqual([]);
});

test("Admin: URL trực tiếp, cookie giả và HTML không JavaScript đều không lộ menu", async ({ page, browser }) => {
  await fixture(page);
  for (const route of ["/admin", "/admin/users", "/admin/config/integrations"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
    await expect(page.getByRole("navigation")).toHaveCount(0);
    await expect(page.locator(".terminal-sidebar")).toHaveCount(0);
    await expect(page.getByLabel("Tên chủ tài khoản", { exact: true })).toHaveCount(0);
  }
  const origin = String(test.info().project.use.baseURL);
  await page.context().addCookies([{ name: "quantik_admin_gate", value: "forged-admin", domain: new URL(origin).hostname, path: "/admin", httpOnly: true }]);
  await page.goto("/admin/config/integrations");
  await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const anonymous = await context.newPage();
  await anonymous.goto(origin + "/admin/users");
  await expect(anonymous.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
  await expect(anonymous.getByRole("navigation")).toHaveCount(0);
  await anonymous.screenshot({ path: `test-results/account-admin/${test.info().project.name}/admin-login-locked.png` });
  await context.close();
});

test("Khách hàng đã đăng nhập vào dashboard từ trang đăng nhập", async ({ page }) => {
  await fixture(page, { user: true });
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Quản trị", exact: true })).toHaveCount(0);
});


test("Quản lý gói: sao chép phiên bản, sửa quyền lợi, tạo đóng bán rồi mở bán", async ({ page }) => {
  const { state, unknown } = await fixture(page, { admin: true });
  await page.goto("/admin/plans");
  await page.getByRole("button", { name: "Tạo phiên bản từ gói này" }).click();
  await expect(page.getByLabel("Tên gói", { exact: true })).toHaveValue(plan.name);
  await page.getByLabel("Tên gói", { exact: true }).fill("Gói nâng cấp");
  await page.getByLabel("Giá (VND)", { exact: true }).fill("250000");
  await page.getByRole("button", { name: "Xem lại gói mới" }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo phiên bản gói mới" })).toBeVisible();
  expect(state.plans[0]).toEqual(plan);
  expect(state.plans[1]).toMatchObject({ name: "Gói nâng cấp", price_vnd: 250000, available: false });
  const row = page.locator("article").filter({ has: page.getByRole("heading", { name: "Gói nâng cấp", exact: true }) });
  await expect(row).toContainText("Đang đóng bán");
  let body: unknown;
  await page.route("**/api/v1/admin/plans/new-plan/availability", route => {
    body = route.request().postDataJSON(); state.plans[1].available = true;
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(state.plans[1]) });
  });
  await row.getByRole("button", { name: "Mở bán", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(row).toContainText("Đang mở bán");
  expect(body).toEqual({ available: true }); expect(unknown).toEqual([]);
  await page.screenshot({ path: `test-results/billing/${test.info().project.name}-plans.png`, fullPage: true });
});

test("Đơn hết thời gian: ngừng hiển thị thông tin chuyển khoản trước khi BE đổi trạng thái", async ({ page }) => {
  await fixture(page, { user: true });
  await page.route("**/api/v1/orders/" + orderId, route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ id: orderId, reference: "QTKEXPIRED", amount_vnd: 150000, status: "PENDING", created_at: 1, expires_at: 2, paid_at: null, bank: "TPBANK", account_number: "000123456", account_name: "QUANTIK", transfer_content: "QTKEXPIRED", qr_url: null }) }));
  await page.goto("/orders/" + orderId);
  await expect(page.getByText(/Đã hết thời gian chuyển khoản/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sao chép", exact: true })).toHaveCount(0);
  await expect(page.getByText("000123456")).toHaveCount(0);
});

test("Tài khoản: phân biệt kỳ hiện tại, sắp tới và đã kết thúc", async ({ page }) => {
  await fixture(page, { user: true }); const now = Math.floor(Date.now() / 1000);
  await page.route("**/api/v1/subscription*", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [
    { id: "past", plan_id: "Gói cũ", order_id: orderId, valid_from: now - 300, valid_until: now - 200 },
    { id: "current", plan_id: "Gói hiện tại", order_id: orderId, valid_from: now - 100, valid_until: now + 100 },
    { id: "next", plan_id: "Gói tiếp theo", order_id: orderId, valid_from: now + 100, valid_until: now + 200 }
  ], next_cursor: null }) }));
  await page.goto("/account");
  const panel = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "Các kỳ gói", exact: true }) });
  await expect(panel.getByRole("row").filter({ hasText: "Gói cũ" })).toContainText("Đã kết thúc");
  await expect(panel.getByRole("row").filter({ hasText: "Gói hiện tại" })).toContainText("Đang hiệu lực");
  await expect(panel.getByRole("row").filter({ hasText: "Gói tiếp theo" })).toContainText("Sắp tới");
});

test("Hủy đơn chờ thanh toán: máy chủ xác nhận rồi ngừng hướng dẫn chuyển khoản", async ({ page }) => {
  await fixture(page, { user: true }); let cancelled = false;
  await page.route(new RegExp("/api/v1/orders/" + orderId + "(?:/cancel)?$"), route => {
    if (route.request().url().endsWith("/cancel")) cancelled = true;
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ id: orderId, reference: "QTKCANCEL", status: cancelled ? "CANCELLED" : "PENDING", amount_vnd: 150000, expires_at: Math.floor(Date.now()/1000)+1800, created_at: 1, bank: "TPBANK", account_number: "000123456", account_name: "QUANTIK", transfer_content: "QTKCANCEL", qr_url: null }) });
  });
  await page.goto("/orders/" + orderId);
  await page.getByRole("button", { name: "Hủy đơn", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByText("Đã hủy", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sao chép", exact: true })).toHaveCount(0);
});


test("Đối soát: review số tiền, đơn và lý do trước khi áp dụng; tải lại danh sách", async ({ page }) => {
  await fixture(page, { admin: true }); let applied = false; let body: unknown;
  await page.route("**/api/v1/admin/reconciliation?*", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: applied ? [] : [{ id: "late-transfer", amount_vnd: 150000, reason: "ORDER_CLOSED_OR_LATE", references: ["QTKLATE"], received_at: 1792000000 }], next_cursor: null }) }));
  await page.route("**/api/v1/admin/reconciliation/late-transfer/apply", route => {
    applied = true; body = route.request().postDataJSON();
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ id: "late-transfer", status: "APPLIED" }) });
  });
  await page.goto("/admin/reconciliation");
  await page.getByRole("button", { name: "Đối soát", exact: true }).click();
  await page.getByLabel("Mã đơn hàng", { exact: true }).fill(orderId);
  await page.getByLabel("Lý do (10–500 ký tự)").fill("Đã đối chiếu giao dịch đến muộn với ngân hàng");
  await page.getByRole("button", { name: "Xem lại đối soát" }).click();
  expect(applied).toBe(false);
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã áp dụng giao dịch" })).toBeVisible();
  expect(body).toEqual({ order_id: orderId, reason: "Đã đối chiếu giao dịch đến muộn với ngân hàng" });
  await expect(page.getByRole("button", { name: "Đối soát", exact: true })).toHaveCount(0);
});

test("Gói đóng bán: admin thấy bước thiếu, mở bán xong khách thấy gói từ API", async ({ page }) => {
  const { state } = await fixture(page, { admin: true, user: true });
  state.plans[0] = { ...plan, available: false };
  await page.route("**/api/v1/admin/plans/" + planId + "/availability", route => {
    state.plans[0].available = route.request().postDataJSON().available;
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(state.plans[0]) });
  });
  await page.goto("/plans");
  await expect(page.getByRole("heading", { name: "Gói dịch vụ đang được cập nhật" })).toBeVisible();
  await page.goto("/admin/plans");
  await expect(page.getByLabel("Tình trạng mở bán")).toContainText("0 gói đang mở bán");
  const card = page.locator("article").filter({ has: page.getByRole("heading", { name: plan.name, exact: true }) });
  await expect(card).toContainText("khách chưa thấy");
  await card.getByRole("button", { name: "Mở bán", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByLabel("Tình trạng mở bán")).toContainText("1 gói đang mở bán");
  await page.goto("/plans");
  await expect(page.getByRole("heading", { name: plan.name, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chọn gói", exact: true })).toBeEnabled();
});

test("Đơn admin: lọc, xem khách/giao dịch/kỳ gói và mở từ liên kết trực tiếp", async ({ page }) => {
  const { unknown } = await fixture(page, { admin: true }); let status = "";
  const record = { id: orderId, reference: "QTKADMIN", status: "PAID", amount_vnd: 150000, created_at: 1792000000, expires_at: 1792001800, paid_at: 1792000010, bank: "TPBANK", account_number: "000123456", account_name: "QUANTIK", transfer_content: "QTKADMIN", qr_url: null, account_id: accountId, display_name: "Khách mua gói", email: "buyer@example.test", plan_name: plan.name };
  await page.route("**/api/v1/admin/orders?*", route => {
    status = new URL(route.request().url()).searchParams.get("status") || "";
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [record], next_cursor: null }) });
  });
  await page.route("**/api/v1/admin/orders/" + orderId, route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...record, customer: { id: accountId, display_name: record.display_name, email: record.email }, plan, payments: [{ id: "bank-123", status: "APPLIED", amount_vnd: 150000, received_at: 1792000010 }], subscription: { id: "period-123", bucket_id: "bucket-123", valid_from: 1792000010, valid_until: 1794592010 } }) }));
  await page.goto("/admin/orders");
  await page.getByLabel("Trạng thái đơn", { exact: true }).selectOption("PAID");
  await page.getByRole("button", { name: "Lọc đơn hàng" }).click();
  await expect(page.getByRole("row").filter({ hasText: "QTKADMIN" })).toContainText("buyer@example.test");
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  const detail = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "Chi tiết đơn hàng", exact: true }) });
  await expect(detail).toContainText("bank-123"); await expect(detail).toContainText("period-123");
  expect(status).toBe("PAID"); expect(unknown).toEqual([]);
  await page.screenshot({ path: "test-results/billing/" + test.info().project.name + "-admin-orders.png", fullPage: true });
  await page.goto("/admin/orders?order_id=" + orderId);
  await expect(page.getByRole("heading", { name: "Chi tiết đơn hàng", exact: true })).toBeVisible();
});

test("Danh mục công khai vẫn hiện gói khi refresh phiên khách trả 401", async ({ page }) => {
  await fixture(page);
  let publicRequests = 0;
  page.on("request", request => { if (new URL(request.url()).pathname === "/api/v1/plans") publicRequests++; });
  await page.goto("/plans");
  await expect(page.getByRole("heading", { name: plan.name, exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng nhập để mua", exact: true })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Phiên đăng nhập" })).toHaveCount(0);
  expect(publicRequests).toBeGreaterThan(0);
});
