import { upstream } from "./api-proxy";

export { ADMIN_GATE_COOKIE, gateCookie } from "./admin-cookie";

// Never trust cookie presence or decoded claims. BE checks signature, role and revoked session.
export async function verifyAdminAccess(access: string | undefined) {
  if (!access || access.length > 8192) return false;
  try {
    const result = await upstream("admin/me", { headers: { Authorization: `Bearer ${access}` } });
    if (!result.ok) return false;
    const profile = await result.json();
    return profile.role === "admin" && typeof profile.id === "string";
  } catch { return false; }
}
