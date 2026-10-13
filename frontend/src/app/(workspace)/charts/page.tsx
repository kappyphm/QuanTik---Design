import {Suspense} from "react";
import {ChartWorkspace} from "@/components/chart-workspace";
export const metadata={title:"Biểu đồ"};
export default function Page(){return <Suspense fallback={<p role="status">Đang mở biểu đồ…</p>}><ChartWorkspace/></Suspense>;}
