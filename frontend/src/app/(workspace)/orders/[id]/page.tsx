import { OrderPage } from "@/components/account/customer";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <OrderPage id={(await params).id} />; }
