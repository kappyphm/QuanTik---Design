"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownUp, ChartCandlestick, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { format, signed, tone, type Stock } from "@/lib/mock-data";
import { usePreferences } from "./preferences";
import TermHint from "./term-hint";

export function StockTable({ items, depth = false, statistics = false, foreign = false, onSelect }: {
  items: Stock[];
  depth?: boolean;
  statistics?: boolean;
  foreign?: boolean;
  onSelect?: (symbol: string) => void;
}) {
  const { watchlist, toggleWatch } = usePreferences();
  const [direction, setDirection] = useState(1);
  const [page, setPage] = useState(0);
  const itemKey = items.map((item) => item.symbol).join(",");
  useEffect(() => setPage(0), [itemKey, direction]);
  const sorted = [...items].sort((a, b) => direction * a.symbol.localeCompare(b.symbol));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(items.length / 8) - 1));
  const levels = depth ? [2, 1, 0] : [0];
  const cell = (value: number | null, className = "muted", digits = 2) => <td className={`number ${className}`}>{format(value, digits)}</td>;

  return (
    <>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Bảng cổ phiếu; cuộn ngang để xem đủ cột">
        <table className="stock-table price-board">
          <thead>
            <tr className="board-groups">
              <th rowSpan={2}><span className="sr-only">Theo dõi</span></th>
              <th rowSpan={2} aria-sort={direction === 1 ? "ascending" : "descending"}><button onClick={() => setDirection(-direction)}>Mã <ArrowDownUp size={13} /></button></th>
              <th rowSpan={2}><TermHint id="ref">TC</TermHint></th><th rowSpan={2}><TermHint id="ceil">Trần</TermHint></th><th rowSpan={2}><TermHint id="floor">Sàn</TermHint></th>
              <th colSpan={levels.length} scope="colgroup"><TermHint id="bid">Dư mua</TermHint></th><th colSpan={3} scope="colgroup"><TermHint id="matched">Khớp lệnh</TermHint></th><th colSpan={levels.length} scope="colgroup"><TermHint id="ask">Dư bán</TermHint></th>
              <th rowSpan={2}>Tổng KL</th><th rowSpan={2}><TermHint id="liquidity">GTGD (triệu ₫)</TermHint></th>
              {statistics && <th colSpan={3} scope="colgroup">Thống kê</th>}
              {foreign && <th colSpan={3} scope="colgroup">Nước ngoài</th>}
              <th rowSpan={2}><TermHint id="quant_score">Quant</TermHint></th><th rowSpan={2}><span className="sr-only">Biểu đồ</span></th>
            </tr>
            <tr>
              {levels.map((level) => <SlotHeading key={`bid${level}`} level={level} />)}
              <th>Giá</th><th>KL</th><th>%</th>
              {[...levels].reverse().map((level) => <SlotHeading key={`ask${level}`} level={level} />)}
              {statistics && <><th>Mở</th><th>Cao</th><th>Thấp</th></>}
              {foreign && <><th>Mua</th><th>Bán</th><th>Room</th></>}
            </tr>
          </thead>
          <tbody>{sorted.slice(currentPage * 8, currentPage * 8 + 8).map((stock) => <tr key={stock.symbol}>
            <td><button className={`star-button ${watchlist.includes(stock.symbol) ? "saved" : ""}`} aria-label={`${watchlist.includes(stock.symbol) ? "Bỏ theo dõi" : "Theo dõi"} ${stock.symbol}`} aria-pressed={watchlist.includes(stock.symbol)} onClick={() => toggleWatch(stock.symbol)}><Star size={17} fill={watchlist.includes(stock.symbol) ? "currentColor" : "none"} /></button></td>
            <td className="stock-identity">{onSelect ? <button className="symbol-link" title={stock.name} onClick={() => onSelect(stock.symbol)}>{stock.symbol}</button> : <Link className="symbol-link" href={`/charts?symbol=${stock.symbol}`} title={stock.name}>{stock.symbol}</Link>}<span>{stock.exchange}</span></td>
            {cell(stock.reference, "neutral")}{cell(stock.ceiling, "ceiling")}{cell(stock.floor, "floor")}
            {levels.map((level) => <QuoteCells key={`bid${level}`} quote={stock.bid[level]} reference={stock.reference} />)}
            {cell(stock.price, tone(stock.change))}{cell(stock.matchedVolume, "muted", 0)}<td className={`number ${tone(stock.change)}`}>{signed(stock.change)}</td>
            {[...levels].reverse().map((level) => <QuoteCells key={`ask${level}`} quote={stock.ask[level]} reference={stock.reference} />)}
            {cell(stock.volume, "muted", 0)}{cell(stock.value)}
            {statistics && <>{cell(stock.open)}{cell(stock.high)}{cell(stock.low)}</>}
            {foreign && <>{cell(stock.foreignBuy, "muted", 0)}{cell(stock.foreignSell, "muted", 0)}{cell(stock.foreignRoom, "muted", 0)}</>}
            <td><Link className="text-link number" aria-label={`Phân tích ${stock.symbol}`} href={`/analysis?symbol=${stock.symbol}`}>{format(stock.quantScore, 0)}</Link></td>
            <td>{onSelect ? <button className="icon-button small" aria-label={`Biểu đồ ${stock.symbol}`} onClick={() => onSelect(stock.symbol)}><ChartCandlestick size={17} /></button> : <Link className="icon-button small" aria-label={`Biểu đồ ${stock.symbol}`} href={`/charts?symbol=${stock.symbol}`}><ChartCandlestick size={17} /></Link>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {items.length > 8 && <div className="table-pagination"><span>{currentPage * 8 + 1}–{Math.min(currentPage * 8 + 8, items.length)} / {items.length} mã</span><div><button className="icon-button small" disabled={currentPage === 0} aria-label="Trang trước" onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18} /></button><button className="icon-button small" disabled={(currentPage + 1) * 8 >= items.length} aria-label="Trang sau" onClick={() => setPage(currentPage + 1)}><ChevronRight size={18} /></button></div></div>}
    </>
  );
}
function SlotHeading({ level }: { level: number }) {
  return <th>Giá {level + 1} / KL {level + 1}</th>;
}
function QuoteCells({ quote, reference }: { quote: Stock["bid"][number]; reference: number | null }) {
  const color = quote?.price == null || reference === null ? "muted" : quote.price > reference ? "positive" : quote.price < reference ? "negative" : "neutral";
  return <td className="order-quote"><span className={`number ${color}`}>{format(quote?.price ?? null)}</span><span className="number muted">{format(quote?.volume ?? null, 0)}</span></td>;
}
