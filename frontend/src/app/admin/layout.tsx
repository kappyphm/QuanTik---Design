import { AdminBoundary } from "@/components/admin/boundary";
import { hasAdminSession } from "@/lib/server/admin-session";
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: React.ReactNode }) {
  const verified = await hasAdminSession();
  // Do not send administrative children or render navigation until BE confirms the role.
  return <AdminBoundary verified={verified}>{verified ? children : null}</AdminBoundary>;
}
