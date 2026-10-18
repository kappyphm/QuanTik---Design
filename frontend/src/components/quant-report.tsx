"use client";
import type { AnalysisReport } from "@/lib/api/analysis";
import { LiveQuantReport } from "./quant-live-report";

export function QuantReport({ result, compact = false, showAction = true }: {
  result: AnalysisReport; compact?: boolean; showAction?: boolean;
}) {
  return <LiveQuantReport report={result} compact={compact} showAction={showAction}/>;
}
