"use client";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { indices, sectors, stocks, format, signed, tone } from "@/lib/mock-data";
import { PageHeading, Panel, EmptyState, Modal } from "./ui";
import { ChartSurface } from "./chart-workspace";
import { StockTable } from "./stock-table";
import { usePreferences } from "./preferences";

export function Dashboard() {
  const { watchlist } = usePreferences();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [exchange, setExchange] = useState("all");
  const [depth, setDepth] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [statistics, setStatistics] = useState(false);
  const [foreign, setForeign] = useState(false);
  const items = stocks.filter((stock) =>
    (tab !== "watch" || watchlist.includes(stock.symbol)) &&
    (sector === "all" || stock.sector === sector) &&
    (exchange === "all" || stock.exchange === exchange) &&
    `${stock.symbol} ${stock.name}`.toUpperCase().includes(query.toUpperCase()),
  );

  return (
    <>
      <PageHeading title="Dashboard" />
      <div className="index-grid">
        {indices.map((index) => (
          <article className="index-card" key={index.name}>
            <div><span>{index.name}</span><span className="number muted">{signed(index.change)}</span></div>
            <strong className="number muted">{format(index.value)}</strong>
          </article>
        ))}
      </div>
      <div className="dashboard-stack">
        <Panel title="Bảng điện" action={<span className="count-label">Snapshot mẫu · {items.length} mã</span>}>
          <div className="table-toolbar">
            <div className="segmented" role="group" aria-label="Danh sách cổ phiếu">
              <button className={tab === "all" ? "active" : ""} aria-pressed={tab === "all"} onClick={() => setTab("all")}>Tất cả</button>
              <button className={tab === "watch" ? "active" : ""} aria-pressed={tab === "watch"} onClick={() => setTab("watch")}>Theo dõi <span>{watchlist.length}</span></button>
            </div>
            <div className="table-controls">
              <label className="inline-search">
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">Tìm trong danh sách cổ phiếu</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã hoặc tên" />
              </label>
              <label><span className="sr-only">Lọc sàn</span><select value={exchange} onChange={(event) => setExchange(event.target.value)}><option value="all">Tất cả sàn</option>{[...new Set(stocks.map((stock) => stock.exchange))].map((name) => <option key={name}>{name}</option>)}</select></label>
              <label><span className="sr-only">Lọc nhóm ngành</span><select value={sector} onChange={(event) => setSector(event.target.value)}><option value="all">Tất cả ngành</option>{sectors.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
            </div>
          </div>
          <div className="board-options" role="group" aria-label="Cột bảng điện">
            <label><input type="checkbox" checked={depth} onChange={(event) => setDepth(event.target.checked)} />Ba mức giá</label>
            <label><input type="checkbox" checked={statistics} onChange={(event) => setStatistics(event.target.checked)} />Thống kê</label>
            <label><input type="checkbox" checked={foreign} onChange={(event) => setForeign(event.target.checked)} />Nước ngoài</label>
          </div>
          {sector !== "all" && <div className="active-filter">{sector}<button aria-label="Xóa lọc ngành" onClick={() => setSector("all")}><X size={14} /></button></div>}
          {items.length ? <StockTable items={items} depth={depth} statistics={statistics} foreign={foreign} onSelect={setSelected} /> : <EmptyState title="Chưa có mã phù hợp" />}
        </Panel>
        <Panel title="Dòng tiền theo ngành" className="sector-panel" action={<span className="count-label">Toàn thị trường · Snapshot mẫu</span>}>
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Bảng nhóm ngành; cuộn ngang để xem đủ cột">
            <table className="sector-table">
              <thead><tr><th>Nhóm ngành</th><th>Số mã</th><th>Tăng / Giảm / Đứng</th><th>Thay đổi TB</th><th>GTGD (tỷ ₫)</th><th>Tỷ trọng GTGD</th><th>Độ phủ GTGD</th><th>Điểm TB</th></tr></thead>
              <tbody>{sectors.map((item) => <tr key={item.name} className={sector === item.name ? "selected" : ""}>
                <td><button className="sector-name" aria-pressed={sector === item.name} onClick={() => setSector(sector === item.name ? "all" : item.name)}>{item.name}</button></td>
                <td className="number muted">{format(item.count, 0)}</td>
                <td className="number muted">{format(item.up, 0)} / {format(item.down, 0)} / {format(item.flat, 0)}</td>
                <td className={`number ${tone(item.change)}`}>{signed(item.change)}</td>
                <td className="number muted">{format(item.value)}</td>
                <td className="number muted">{format(item.share)}%</td>
                <td className="number muted">{item.covered}/{item.count}</td>
                <td className="number muted">{format(item.score)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </div>
      {selected && <Modal title={`Biểu đồ ${selected}`} onClose={() => setSelected(null)} className="chart-dialog"><ChartSurface key={selected} symbol={selected} onSymbolChange={setSelected} /></Modal>}
    </>
  );
}
