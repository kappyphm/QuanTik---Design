"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import {
  indices,
  sectors,
  stocks,
  format,
  signed,
  tone,
  getStock,
} from "@/lib/mock-data";
import { PageHeading, Panel, EmptyState } from "./ui";
import { Sparkline } from "./charts";
import { StockTable } from "./stock-table";
import { usePreferences } from "./preferences";
export function Dashboard() {
  const { watchlist } = usePreferences();
  const [tab, setTab] = useState("all"),
    [query, setQuery] = useState(""),
    [sector, setSector] = useState("all"),
    [selected, setSelected] = useState("FPT");
  const items = useMemo(
    () =>
      stocks.filter(
        (stock) =>
          (tab !== "watch" || watchlist.includes(stock.symbol)) &&
          (sector === "all" || stock.sector === sector) &&
          `${stock.symbol} ${stock.name}`
            .toUpperCase()
            .includes(query.toUpperCase()),
      ),
    [tab, watchlist, sector, query],
  );
  const stock = getStock(selected)!;
  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Thị trường, dòng tiền và cổ phiếu bạn quan tâm."
      >
        <Link className="button primary" href="/screener">
          Lọc cơ hội <ArrowUpRight size={17} />
        </Link>
      </PageHeading>
      <div className="index-grid">
        {indices.map((index) => (
          <article className="index-card" key={index.name}>
            <div>
              <span>{index.name}</span>
              <span className={`index-change ${tone(index.change)}`}>
                {signed(index.change)}
              </span>
            </div>
            <strong className="number">{format(index.value)}</strong>
            <div className="index-bottom">
              <span className={tone(index.points)}>
                {index.points > 0 ? "+" : ""}
                {format(index.points)} điểm
              </span>
              <Sparkline values={index.spark} positive={index.change >= 0} />
            </div>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <Panel
            title="Cổ phiếu"
            action={<span className="count-label">{items.length} mã</span>}
          >
            <div className="table-toolbar">
              <div
                className="segmented"
                role="group"
                aria-label="Danh sách cổ phiếu"
              >
                <button
                  className={tab === "all" ? "active" : ""}
                  aria-pressed={tab === "all"}
                  onClick={() => setTab("all")}
                >
                  Tất cả
                </button>
                <button
                  className={tab === "watch" ? "active" : ""}
                  aria-pressed={tab === "watch"}
                  onClick={() => setTab("watch")}
                >
                  Theo dõi <span>{watchlist.length}</span>
                </button>
              </div>
              <div className="table-controls">
                <label className="inline-search">
                  <Search size={16} />
                  <span className="sr-only">Tìm trong danh sách cổ phiếu</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm mã hoặc tên"
                  />
                </label>
                <label>
                  <span className="sr-only">Lọc nhóm ngành</span>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    <option value="all">Tất cả ngành</option>
                    {sectors.map((s) => (
                      <option key={s.name}>{s.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            {sector !== "all" && (
              <div className="active-filter">
                {sector}
                <button
                  aria-label="Xóa lọc ngành"
                  onClick={() => setSector("all")}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {items.length ? (
              <StockTable
                items={items}
                onSelect={setSelected}
                selected={selected}
              />
            ) : (
              <EmptyState
                title={
                  tab === "watch" && !watchlist.length
                    ? "Chưa có mã theo dõi"
                    : "Chưa có mã phù hợp"
                }
              >
                {tab === "watch" && !watchlist.length
                  ? "Bấm ngôi sao bên cạnh cổ phiếu để lưu vào danh sách."
                  : "Thử thay đổi từ khóa hoặc nhóm ngành."}
              </EmptyState>
            )}
          </Panel>
          <section
            className="selected-stock"
            aria-label={`Chi tiết ${stock.symbol}`}
          >
            <div className="selected-title">
              <div>
                <span className="muted">
                  {stock.exchange} · {stock.sector}
                </span>
                <h2>
                  {stock.symbol}
                  <span>{stock.name}</span>
                </h2>
              </div>
              <div className="selected-price">
                <strong className="number">{format(stock.price)}</strong>
                <span className={`number ${tone(stock.change)}`}>
                  {signed(stock.change)}
                </span>
              </div>
            </div>
            <div className="selected-content">
              <Sparkline values={stock.spark} positive={stock.change >= 0} />
              <div className="selected-stat">
                <span>Khối lượng</span>
                <b className="number">{format(stock.volume, 1)} triệu CP</b>
              </div>
              <div className="selected-stat">
                <span>Dòng tiền CMF</span>
                <b className={`number ${tone(stock.cmf)}`}>
                  {format(stock.cmf)}
                </b>
              </div>
              <div className="selected-actions">
                <Link
                  className="button secondary"
                  href={`/charts?symbol=${stock.symbol}`}
                >
                  Biểu đồ
                </Link>
                <Link
                  className="button primary"
                  href={`/analysis?symbol=${stock.symbol}`}
                >
                  Phân tích <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        </div>
        <Panel
          title="Dòng tiền theo ngành"
          className="sector-panel"
          action={<span className="muted">Tỷ đồng</span>}
        >
          <div className="sector-list">
            {[...sectors]
              .sort((a, b) => b.flow - a.flow)
              .map((s) => (
                <button
                  key={s.name}
                  className={sector === s.name ? "selected" : ""}
                  onClick={() => setSector(sector === s.name ? "all" : s.name)}
                  aria-pressed={sector === s.name}
                >
                  <div className="sector-row">
                    <b>{s.name}</b>
                    <span className={`number ${tone(s.change)}`}>
                      {signed(s.change)}
                    </span>
                  </div>
                  <div className="sector-bar-row">
                    <div className="sector-bar">
                      <span
                        style={{
                          width: `${Math.max(8, (Math.abs(s.flow) / 1482) * 100)}%`,
                          background:
                            s.flow >= 0 ? "var(--positive)" : "var(--negative)",
                        }}
                      />
                    </div>
                    <span className={`number ${tone(s.flow)}`}>
                      {s.flow > 0 ? "+" : ""}
                      {format(s.flow, 0)}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
