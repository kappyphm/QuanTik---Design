"use client";
import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight, CircleHelp } from "lucide-react";
import { sheetColumns, sheetGroups, type SheetColumn } from "@/content/screening-sheet";
import { analysisMessages } from "@/lib/api/analysis";
import type { ScreeningItem } from "@/lib/api/screening";
import TermHint from "./term-hint";
import styles from "./screener.module.css";

const nf = (value: number, digits = 2) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
const actionLabels: Record<string, string> = { BUY_NOW: "Mua ngay", BUY_SETUP: "Canh mua", WATCH: "Theo dõi", AVOID: "Tránh", SELL: "Bán" };
const textKeys = new Set(["gate_reasons", "data_quality_flags", "commentary"]);
const mergedKeys = new Set(["gross_forecast_pct", "roundtrip_cost_pct", "data_quality_score", "data_quality_flags", "adv20_value_vnd", "capacity_shares", "gap_abs_p95_pct", "trade_model_agreement_pct"]);
const visibleColumns = sheetColumns.filter(c => !mergedKeys.has(c.key));
const combined: Partial<Record<SheetColumn["key"], SheetColumn["key"][]>> = {
  net_forecast_pct: ["gross_forecast_pct", "roundtrip_cost_pct"],
  data_quality_status: ["data_quality_score", "data_quality_flags"],
  liquidity_tier: ["adv20_value_vnd", "capacity_shares", "gap_abs_p95_pct"],
  agreement_pct: ["trade_model_agreement_pct"],
};
const columnOf = (key: SheetColumn["key"]) => sheetColumns.find(c => c.key === key)!;
const shortLabels: Partial<Record<SheetColumn["key"], string>> = {
  gross_forecast_pct: "Gộp", roundtrip_cost_pct: "Phí", data_quality_score: "Điểm", data_quality_flags: "Cảnh báo",
  adv20_value_vnd: "GTGD TB20", capacity_shares: "Sức chứa", gap_abs_p95_pct: "Gap 95%", trade_model_agreement_pct: "Kế hoạch",
};

function valueOf(item: ScreeningItem, column: SheetColumn) {
  const value = item[column.key];
  if (value == null || value === "") return null;
  if (column.format === "boolean") return typeof value === "boolean" ? value : null;
  if (["number", "pct", "price", "billions", "sessions"].includes(column.format)) {
    return typeof value === "number" && Number.isFinite(value) && (column.format !== "price" || value > 0) ? value : null;
  }
  return typeof value === "string" || Array.isArray(value) && value.every(v => typeof v === "string") ? value : null;
}
function display(value: NonNullable<ReturnType<typeof valueOf>>, column: SheetColumn) {
  if (typeof value === "boolean") return value ? "Đã đạt" : "Chưa đạt";
  if (Array.isArray(value)) return value.length ? value.map(v => analysisMessages[v] || v).join(" · ") : column.key === "data_quality_flags" ? "Không có cảnh báo" : "Không có điều kiện chặn";
  if (typeof value === "number") {
    const n = column.format === "billions" ? value / 1e9 : value;
    return nf(n, ["price", "sessions"].includes(column.format) || column.key === "capacity_shares" ? 0 : 2) + (column.format === "pct" ? "%" : column.format === "sessions" ? " phiên" : "");
  }
  return column.key === "action" ? actionLabels[value] || value : value;
}
function Cell({ item, column }: { item: ScreeningItem; column: SheetColumn }) {
  const value = valueOf(item, column);
  if (value == null) return <span className={styles.missing} aria-label="Chưa có dữ liệu">—</span>;
  const content = display(value, column);
  if (textKeys.has(column.key)) return <details className={styles.cellDetail}><summary>{column.key === "commentary" ? "Đọc nhận xét" : column.key === "gate_reasons" ? "Xem điều kiện" : "Xem cảnh báo"}<span>{content}</span></summary><p>{content}</p></details>;
  const badge = column.key === "action" || column.key === "gate_pass" || column.key === "data_quality_status";
  const favorable = value === true || value === "BUY_NOW" || value === "PASS";
  const adverse = value === false || value === "AVOID" || value === "FAIL" || value === "SELL";
  const numericTone = typeof value === "number" && ["net_forecast_pct", "ensemble_return_pct", "gross_forecast_pct", "annual_return_pct", "sector_return_20d_pct"].includes(column.key);
  const tone = favorable || numericTone && Number(value) > 0 ? styles.positive : adverse || numericTone && Number(value) < 0 ? styles.negative : "";
  return <span className={`${badge ? styles.badge : ""} ${tone} ${column.key === "score" ? styles.quantScore : ""}`}>{content}</span>;
}

function Value({ item, column }: { item: ScreeningItem; column: SheetColumn }) {
  return <div data-sheet-key={column.key}><Cell item={item} column={column}/></div>;
}
function CombinedCell({ item, column }: { item: ScreeningItem; column: SheetColumn }) {
  const children = combined[column.key];
  if (!children) return <Value item={item} column={column}/>;
  return <div className={styles.compactCell}>
    <Value item={item} column={column}/>
    {children.map(key => <div key={key} className={key === "data_quality_flags" ? styles.compactFlags : styles.compactLine}>
      {key !== "data_quality_flags" && <span>{shortLabels[key]}{key === "adv20_value_vnd" ? " (tỷ)" : key === "capacity_shares" ? " (cp)" : ""}</span>}
      <Value item={item} column={columnOf(key)}/>
    </div>)}
  </div>;
}

export function ScreeningSheet({ kind, title, description, items, loading, onSelect }: {
  kind: "opportunity" | "caution"; title: string; description: string; items: ScreeningItem[];
  loading: boolean; onSelect: (item: ScreeningItem) => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const goTo = (group: string) => {
    const frame = scroll.current;
    const target = frame?.querySelector<HTMLElement>(`[data-sheet-group="${group}"]`);
    const identity = frame?.querySelector<HTMLElement>("tbody th");
    if (frame && target) {
      const left = group === "overview" ? 0 : target.getBoundingClientRect().left - frame.getBoundingClientRect().left + frame.scrollLeft - frame.clientLeft - (identity?.offsetWidth ?? 0);
      frame.scrollTo({ left: Math.max(0, left), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  };
  return <section className={`${styles.tableSection} ${styles[kind]}`} aria-label={title}>
    <div className={styles.heading}><div><span className={styles.sheetEyebrow}>{kind === "opportunity" ? "CƠ HỘI TRONG PHIÊN" : "KIỂM SOÁT RỦI RO"}</span><h3>{title}</h3><p>{description}</p></div><span className={styles.rowCount}><b>{items.length.toString().padStart(2, "0")}</b> / 05 mã</span></div>
    <nav className={styles.sheetNav} aria-label={`Đi tới nhóm cột · ${title}`}>
      {sheetGroups.map(group => <button key={group.id} onClick={() => goTo(group.id)}><span>{group.index}</span>{group.label}</button>)}
    </nav>
    <div className={styles.tableFrame} aria-busy={loading}>
      <div ref={scroll} className={`${styles.scroll} ${styles.sheetScroll}`} tabIndex={0} role="region" aria-label={`${title} · cuộn ngang để xem đầy đủ`}>
        <table className={`${styles.table} ${styles.sheet}`}>
          <caption className={styles.srOnly}>{title}: 42 chỉ số theo sheet lọc cổ phiếu, thu gọn trong 34 cột. Bấm tiêu đề cột để xem định nghĩa và cách tính. Giá VND, tỷ suất phần trăm, GTGD tỷ VND.</caption>
          <colgroup><col className={styles.identityCol}/>{visibleColumns.slice(1).map(column => <col key={column.key} className={textKeys.has(column.key) || combined[column.key] ? styles.wideCol : styles.metricCol}/>)}</colgroup>
          <thead>
            <tr className={styles.groupRow}><th scope="col" rowSpan={2}><TermHint id="sheet-symbol" definition={sheetColumns[0].definition}>Mã <CircleHelp size={12}/></TermHint><span className={styles.unitNote}>DOANH NGHIỆP / QUANT</span></th>{sheetGroups.map(group => <th key={group.id} scope="colgroup" colSpan={visibleColumns.filter(c => c.group === group.id && c.key !== "symbol").length} data-sheet-group={group.id}><span>{group.index}</span> {group.label}</th>)}</tr>
            <tr className={styles.columnRow}>{visibleColumns.slice(1).map(column => <th key={column.key} scope="col"><TermHint id={column.definition.id} definition={column.definition}>{column.label} <CircleHelp size={11}/></TermHint>{combined[column.key] && <span className={styles.subHints}>{combined[column.key]!.map(key => <TermHint key={key} id={`sheet-${key}`} definition={columnOf(key).definition}>{shortLabels[key]}</TermHint>)}</span>}{column.format === "price" && <span className={styles.unitNote}>VND</span>}{column.key === "up_day_ratio_pct" && <span className={styles.unitNote}>TỶ LỆ PHIÊN TĂNG</span>}{column.key === "mc_volatility_source" && <span className={styles.unitNote}>NGUỒN / PHƯƠNG PHÁP</span>}</th>)}</tr>
          </thead>
          <tbody>{items.map((item, index) => <tr key={item.symbol}>
            <th scope="row"><div className={styles.identity}><div className={styles.symbolLine}><button className={styles.symbol} onClick={() => onSelect(item)}>{item.symbol}</button><span>{item.exchange || "—"}</span><small>{String(index + 1).padStart(2, "0")}</small></div><span className={styles.company}>{item.name || item.company_name || "Chưa có tên công ty"}</span><Link className={styles.quantAction} href={`/analysis?symbol=${encodeURIComponent(item.symbol)}`} aria-label={`Kích hoạt phân tích quant chi tiết ${item.symbol}`}>Phân tích Quant chi tiết <ArrowUpRight size={13}/></Link></div></th>
            {visibleColumns.slice(1).map(column => <td key={column.key} data-sheet-column={column.key} className={textKeys.has(column.key) || column.format === "text" ? styles.textCell : undefined}><CombinedCell item={item} column={column}/></td>)}
          </tr>)}</tbody>
        </table>
      </div>
      {!items.length && <p role="status" className={styles.empty}>Chưa có mã phù hợp trong nhóm này.</p>}
    </div>
    <div className={styles.sheetFooter}><span>34 cột · 42 chỉ số · Cuộn ngang để xem toàn bộ <span aria-hidden="true">↔</span></span><span><CircleHelp size={13}/> Bấm tên cột để xem định nghĩa & cách tính</span></div>
  </section>;
}
