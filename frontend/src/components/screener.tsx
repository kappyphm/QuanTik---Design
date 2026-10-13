"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { sectors, stocks } from "@/lib/mock-data";
import { PageHeading, Panel, EmptyState } from "./ui";
import { StockTable } from "./stock-table";
export function Screener() {
  const [group, setGroup] = useState("all"),
    [sector, setSector] = useState("all"),
    [minVolume, setMinVolume] = useState("0"),
    [flow, setFlow] = useState("all");
  const reset = () => {
    setGroup("all");
    setSector("all");
    setMinVolume("0");
    setFlow("all");
  };
  const items = stocks.filter(
    (s) =>
      (group === "all" ||
        s.signal ===
          (group === "opportunity" ? "Chờ xác nhận" : "Thận trọng")) &&
      (sector === "all" || s.sector === sector) &&
      s.volume >= Number(minVolume) &&
      (flow === "all" ||
        (flow === "positive" && s.cmf > 0) ||
        (flow === "negative" && s.cmf < 0)),
  );
  return (
    <>
      <PageHeading
        title="Lọc cổ phiếu"
        description="Tìm cơ hội và nhận diện rủi ro theo điều kiện bạn chọn."
      >
        <button className="button secondary" onClick={reset}>
          <RotateCcw size={16} />
          Đặt lại
        </button>
      </PageHeading>
      <div className="screener-summary">
        <button
          className={group === "all" ? "active" : ""}
          aria-pressed={group === "all"}
          onClick={() => setGroup("all")}
        >
          <span>Toàn bộ</span>
          <strong>{stocks.length}</strong>
        </button>
        <button
          className={group === "opportunity" ? "active" : ""}
          aria-pressed={group === "opportunity"}
          onClick={() => setGroup("opportunity")}
        >
          <span>Chờ xác nhận</span>
          <strong className="positive">
            {stocks.filter((s) => s.signal === "Chờ xác nhận").length}
          </strong>
        </button>
        <button
          className={group === "caution" ? "active" : ""}
          aria-pressed={group === "caution"}
          onClick={() => setGroup("caution")}
        >
          <span>Cần thận trọng</span>
          <strong className="negative">
            {stocks.filter((s) => s.signal === "Thận trọng").length}
          </strong>
        </button>
      </div>
      <Panel title="Điều kiện lọc">
        <div className="filter-grid">
          <label>
            Nhóm ngành
            <select value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="all">Tất cả ngành</option>
              {sectors.map((s) => (
                <option key={s.name}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Khối lượng tối thiểu
            <select
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
            >
              <option value="0">Không giới hạn</option>
              <option value="2">2 triệu cổ phiếu</option>
              <option value="5">5 triệu cổ phiếu</option>
              <option value="10">10 triệu cổ phiếu</option>
            </select>
          </label>
          <label>
            Dòng tiền CMF
            <select value={flow} onChange={(e) => setFlow(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="positive">CMF dương</option>
              <option value="negative">CMF âm</option>
            </select>
          </label>
        </div>
      </Panel>
      <Panel
        title="Kết quả"
        className="mt-5"
        action={<span className="count-label">{items.length} mã phù hợp</span>}
      >
        {items.length ? (
          <StockTable items={items} />
        ) : (
          <EmptyState title="Không có mã đáp ứng điều kiện">
            Thử giảm ngưỡng khối lượng hoặc thay đổi nhóm ngành.
          </EmptyState>
        )}
      </Panel>
    </>
  );
}
