"use client";
import type { Role } from "./contracts";
const messages: Record<string, string> = {
  UNAUTHENTICATED: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", LOGIN_RATE_LIMITED: "Đăng nhập sai nhiều lần. Vui lòng thử lại sau.",
  BACKEND_UNAVAILABLE: "Chưa kết nối được máy chủ. Vui lòng thử lại.", GOOGLE_NOT_CONFIGURED: "Đăng nhập Google chưa được cấu hình.",
  INVALID_ORIGIN: "Địa chỉ ứng dụng chưa khớp cấu hình kết nối.", PAYMENTS_DISABLED: "Thanh toán hiện đang tạm đóng.",
  PAYMENT_CONFIGURATION_MISSING: "Thông tin nhận thanh toán chưa đầy đủ.", PLAN_UNAVAILABLE: "Gói này hiện chưa được mở bán.",
  PENDING_ORDER_LIMIT: "Bạn đang có nhiều đơn chờ thanh toán. Hãy mở lại đơn hiện có.", PAID_ORDER_CANNOT_CANCEL: "Đơn đã thanh toán nên không thể hủy.",
  IDEMPOTENCY_CONFLICT: "Yêu cầu trùng mã nhưng khác nội dung. Hãy kiểm tra lại.", INTEGRATION_REVISION_CONFLICT: "Cấu hình vừa được người khác thay đổi. Tải lại trước khi sửa tiếp.",
  CONFIG_ACTIVATION_CONFLICT: "Phiên bản đang áp dụng đã thay đổi. Tải lại và kiểm tra trước khi kích hoạt.",
  INVALID_CONFIG: "Cấu hình không đúng yêu cầu. Kiểm tra dữ liệu và nguồn tham chiếu.", INVALID_REQUEST: "Thông tin gửi lên chưa hợp lệ.",
  NOT_FOUND: "Không tìm thấy dữ liệu hoặc bạn không có quyền truy cập.", PAYMENT_DOES_NOT_MATCH: "Giao dịch không khớp với đơn đã chọn.",
};
export class ApiError extends Error {
  constructor(public status: number, public code: string, public requestId?: string) { super(messages[code] || `Không thể hoàn tất thao tác (${code}).`); }
}
export async function raw<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  let response: Response;
  try { response = await fetch(`/api/v1/${path}`, { ...init, headers, credentials: "same-origin", cache: "no-store" }); }
  catch { throw new ApiError(0, "BACKEND_UNAVAILABLE"); }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.code || "REQUEST_FAILED", data.request_id || response.headers.get("x-request-id"));
  return data as T;
}
type Token = { access_token: string; expires_in: number };
const tokens: Partial<Record<Role, { value: string; until: number }>> = {};
const generations: Record<Role, number> = { user: 0, admin: 0 };
const refreshing: Partial<Record<Role, Promise<string>>> = {};
const listeners = new Set<(role: Role) => void>();
export function onExpired(listener: (role: Role) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function forget(role: Role) { generations[role]++; delete tokens[role]; listeners.forEach(fn => fn(role)); }
function store(role: Role, token: Token) { tokens[role] = { value: token.access_token, until: Date.now() + token.expires_in * 1000 - 20000 }; }
export function accept(role: Role, token: Token) { generations[role]++; store(role, token); }
export function authPath(role: Role) { return role === "admin" ? "admin/auth" : "auth"; }
export async function refresh(role: Role): Promise<string> {
  if (refreshing[role]) return refreshing[role]!;
  const generation = generations[role];
  const work = async () => {
    try {
      const result = await raw<Token>(`${authPath(role)}/refresh`, { method: "POST" });
      if (generation !== generations[role]) throw new ApiError(401, "UNAUTHENTICATED");
      store(role, result); return result.access_token;
    } catch (error) {
      if (generation === generations[role] && error instanceof ApiError && (error.status === 401 || error.status === 403)) forget(role);
      throw error;
    }
  };
  // Serialize refresh rotation across same-origin tabs; tokens remain in memory only.
  const run = async (): Promise<string> => {
    if (typeof navigator !== "undefined" && navigator.locks) return await navigator.locks.request(`quantik-refresh-${role}`, work);
    return await work();
  };
  refreshing[role] = run().finally(() => { delete refreshing[role]; });
  return refreshing[role]!;
}
export async function api<T>(role: Role, path: string, init: RequestInit = {}): Promise<T> {
  const token = tokens[role];
  const access = token && token.until > Date.now() ? token.value : await refresh(role);
  const send = (value: string) => raw<T>(path, { ...init, headers: { ...Object.fromEntries(new Headers(init.headers)), Authorization: `Bearer ${value}` } });
  try { return await send(access); }
  catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const next = await refresh(role);
    try { return await send(next); } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) forget(role);
      throw retryError;
    }
  }
}
export function mutation(method: "POST" | "PATCH", body?: unknown, key?: string): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body), headers: key ? { "Idempotency-Key": key } : undefined };
}
