"use client";
import { QuantRequestPanel } from "./quant-request";
export function QuantPanel({ symbol, compact = false }: { symbol: string; compact?: boolean }) {
  return <QuantRequestPanel symbol={symbol} compact={compact}/>;
}
