import {Suspense} from "react";
import {AnalysisPage} from "@/components/analysis";
export const metadata={title:"Phân tích Quant"};
export default function Page(){return <Suspense fallback={<p role="status">Đang mở phân tích…</p>}><AnalysisPage/></Suspense>;}
