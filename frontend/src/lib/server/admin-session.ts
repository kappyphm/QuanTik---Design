import { cache } from "react";
import { cookies } from "next/headers";
import { ADMIN_GATE_COOKIE, verifyAdminAccess } from "./admin-access";

export const hasAdminSession = cache(async () => {
  const value = (await cookies()).get(ADMIN_GATE_COOKIE)?.value;
  return verifyAdminAccess(value);
});
