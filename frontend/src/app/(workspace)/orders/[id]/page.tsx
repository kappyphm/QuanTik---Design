import { OrderPage } from "@/components/account/customer";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const configured = process.env.QUANTIK_SUPPORT_URL;
  const supportHref = configured && /^(https:\/\/|mailto:)/.test(configured) ? configured : undefined;
  return <OrderPage id={(await params).id} supportHref={supportHref}/>;
}
