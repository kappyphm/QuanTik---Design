export const ADMIN_GATE_COOKIE = "quantik_admin_gate";
export function gateCookie(token: string, seconds: number, secure: boolean) {
  const age = Math.max(0, Math.min(900, Math.floor(seconds)));
  return `${ADMIN_GATE_COOKIE}=${encodeURIComponent(token)}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? "; Secure" : ""}`;
}
