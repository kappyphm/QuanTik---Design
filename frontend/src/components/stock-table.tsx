"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { format, signed, tone, type Stock } from "@/lib/mock-data";
import { Sparkline } from "./charts";
import { usePreferences } from "./preferences";
type Sort = "symbol" | "price" | "change" | "volume" | "cmf";
export function StockTable({
  items,
  onSelect,
  selected,
}: {
  items: Stock[];
  onSelect?: (symbol: string) => void;
  selected?: string;
}) {
  const { watchlist, toggleWatch } = usePreferences();
  const [sort, setSort] = useState<Sort>("volume"),
    [direction, setDirection] = useState(-1);
  const [page, setPage] = useState(0);
  const itemKey = items.map((item) => item.symbol).join(",");
  useEffect(() => setPage(0), [itemKey, sort, direction]);
  const sorted = [...items].sort((a, b) =>
    typeof a[sort] === "string"
      ? direction * String(a[sort]).localeCompare(String(b[sort]))
      : direction * (Number(a[sort]) - Number(b[sort])),
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(items.length / 8) - 1),
  );
  const header = (key: Sort, label: string) => (
    <th
      aria-sort={
        sort === key ? (direction === 1 ? "ascending" : "descending") : "none"
      }
    >
      <button
        onClick={() => {
          if (sort === key) setDirection(-direction);
          else {
            setSort(key);
            setDirection(-1);
          }
        }}
      >
        {label}
        <ArrowDownUp size={13} />
      </button>
    </th>
  );
  return (
    <>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Bảng cổ phiếu; cuộn ngang để xem đủ cột"
      >
        <table className="stock-table">
          <thead>
            <tr>
              <th>
                <span className="sr-only">Theo dõi</span>
              </th>
              {header("symbol", "Cổ phiếu")}
              {header("price", "Giá")}
              {header("change", "Thay đổi")}
              {header("volume", "KL (triệu CP)")}
              {header("cmf", "CMF")}
              <th>30 phiên</th>
              <th>
                <span className="sr-only">Tín hiệu</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(currentPage * 8, currentPage * 8 + 8).map((stock) => (
              <tr
                key={stock.symbol}
                className={selected === stock.symbol ? "selected" : ""}
              >
                <td>
                  <button
                    className={`star-button ${watchlist.includes(stock.symbol) ? "saved" : ""}`}
                    aria-label={`${watchlist.includes(stock.symbol) ? "Bỏ theo dõi" : "Theo dõi"} ${stock.symbol}`}
                    aria-pressed={watchlist.includes(stock.symbol)}
                    onClick={() => toggleWatch(stock.symbol)}
                  >
                    <Star
                      size={17}
                      fill={
                        watchlist.includes(stock.symbol)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </td>
                <td className="stock-identity">
                  {onSelect ? (
                    <button
                      className="symbol-link"
                      onClick={() => onSelect(stock.symbol)}
                    >
                      {stock.symbol}
                    </button>
                  ) : (
                    <Link
                      className="symbol-link"
                      href={`/analysis?symbol=${stock.symbol}`}
                    >
                      {stock.symbol}
                    </Link>
                  )}
                  <span>{stock.name}</span>
                </td>
                <td className="number">{format(stock.price)}</td>
                <td className={`number ${tone(stock.change)}`}>
                  {signed(stock.change)}
                </td>
                <td className="number muted">{format(stock.volume, 1)}</td>
                <td className={`number ${tone(stock.cmf)}`}>
                  {format(stock.cmf)}
                </td>
                <td>
                  <Sparkline
                    values={stock.spark}
                    positive={stock.change >= 0}
                  />
                </td>
                <td>
                  <span
                    className={`signal ${stock.signal === "Thận trọng" ? "negative" : stock.signal === "Chờ xác nhận" ? "positive" : "muted"}`}
                  >
                    {stock.signal}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length > 8 && (
        <div className="table-pagination">
          <span>
            {currentPage * 8 + 1}–{Math.min(currentPage * 8 + 8, items.length)}{" "}
            / {items.length} mã
          </span>
          <div>
            <button
              className="icon-button small"
              disabled={currentPage === 0}
              aria-label="Trang trước"
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="icon-button small"
              disabled={(currentPage + 1) * 8 >= items.length}
              aria-label="Trang sau"
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
