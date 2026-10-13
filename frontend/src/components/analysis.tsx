"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Check, Info, Star } from "lucide-react";
import {
  stocks,
  models,
  getStock,
  getAnalysis,
  format,
  signed,
  tone,
  type Model,
} from "@/lib/mock-data";
import { PageHeading, Panel, Modal, EmptyState } from "./ui";
import { ForecastChart, VolatilityChart } from "./charts";
import { usePreferences } from "./preferences";
export function AnalysisPage() {
  const router = useRouter(),
    params = useSearchParams();
  const symbol = (params.get("symbol") ?? "FPT").toUpperCase();
  const stock = getStock(symbol),
    data = getAnalysis(symbol);
  const { watchlist, toggleWatch } = usePreferences();
  const [visible, setVisible] = useState(models.map((m) => m.id));
  const [help, setHelp] = useState<Model | null>(null);
  if (!stock || !data)
    return (
      <>
        <PageHeading
          title={`Phân tích ${symbol}`}
          description="Mã này chưa có trong bộ dữ liệu mẫu."
        />
        <EmptyState title="Chưa có kết quả minh họa">
          <Link href="/dashboard" className="text-link">
            Chọn một mã trong Dashboard →
          </Link>
        </EmptyState>
      </>
    );
  const more = (id: string) => (
    <button
      className="icon-button small"
      aria-label={`Giải thích ${models.find((m) => m.id === id)?.name}`}
      onClick={() => setHelp(models.find((m) => m.id === id)!)}
    >
      <Info size={18} />
    </button>
  );
  return (
    <>
      <PageHeading
        title="Phân tích Quant"
        description="Đọc từng lớp bằng chứng trước khi ra quyết định."
      >
        <label>
          <span className="sr-only">Chọn mã phân tích</span>
          <select
            className="symbol-select"
            value={symbol}
            onChange={(e) =>
              router.replace(`/analysis?symbol=${e.target.value}`)
            }
          >
            {stocks.map((s) => (
              <option key={s.symbol}>{s.symbol}</option>
            ))}
          </select>
        </label>
        <Link className="button secondary" href={`/charts?symbol=${symbol}`}>
          Biểu đồ <ArrowUpRight size={17} />
        </Link>
      </PageHeading>
      <section className="analysis-stock">
        <div>
          <div className="stock-line">
            <h2>{symbol}</h2>
            <span>{stock.name}</span>
            <span className="exchange-label">{stock.exchange}</span>
          </div>
          <div className="analysis-price">
            <strong className="number">{format(stock.price)}</strong>
            <span className={`number ${tone(stock.change)}`}>
              {signed(stock.change)}
            </span>
            <span className="muted">Nghìn đồng</span>
          </div>
        </div>
        <button
          className={`button secondary ${watchlist.includes(symbol) ? "is-saved" : ""}`}
          aria-pressed={watchlist.includes(symbol)}
          onClick={() => toggleWatch(symbol)}
        >
          <Star
            size={17}
            fill={watchlist.includes(symbol) ? "currentColor" : "none"}
          />
          {watchlist.includes(symbol) ? "Đang theo dõi" : "Theo dõi"}
        </button>
      </section>
      <section className="action-card" aria-labelledby="action-title">
        <span className="action-marker" />
        <div>
          <h2 id="action-title">HÀNH ĐỘNG</h2>
          <p>{data.action}</p>
        </div>
      </section>
      <div className="model-selector">
        <span>Hiển thị mô hình</span>
        <div role="group" aria-label="Chọn mô hình hiển thị">
          {models.map((model) => (
            <button
              key={model.id}
              className={visible.includes(model.id) ? "active" : ""}
              aria-pressed={visible.includes(model.id)}
              onClick={() =>
                setVisible((items) =>
                  items.includes(model.id)
                    ? items.filter((id) => id !== model.id)
                    : [...items, model.id],
                )
              }
            >
              {visible.includes(model.id) && <Check size={14} />} {model.name}
            </button>
          ))}
        </div>
      </div>
      {!visible.length && (
        <EmptyState title="Chọn mô hình để xem bằng chứng">
          Bạn có thể bật từng mô hình ở thanh bên trên.
        </EmptyState>
      )}
      {visible.includes("monte") && (
        <Panel
          title="Monte Carlo · Phân phối giá"
          action={more("monte")}
          className="forecast-panel"
        >
          <div className="forecast-headline">
            <div>
              <span className="muted">Giá trung vị sau 20 phiên</span>
              <strong className="number">
                {format(data.forecast[20].p50)}
                <span className="muted"> nghìn đồng</span>
              </strong>
            </div>
            <div className="chart-legend">
              <span>
                <i className="legend-median" />
                Trung vị
              </span>
              <span>
                <i className="legend-inner" />
                25–75%
              </span>
              <span>
                <i className="legend-outer" />
                10–90%
              </span>
            </div>
          </div>
          <ForecastChart data={data.forecast} />
          <p className="chart-caption">
            Khoảng giá theo phân vị, không phải một đường giá chắc chắn.
          </p>
        </Panel>
      )}
      <div className="model-grid">
        {visible.includes("garch") && (
          <Panel title="GARCH · Biến động" action={more("garch")}>
            <div className="model-number">
              <strong className="number">
                {format(data.conditionalVolatility.at(-1)!)}%
              </strong>
              <span className="muted">Biến động có điều kiện</span>
            </div>
            <VolatilityChart values={data.conditionalVolatility} />
            <p className="model-caption">
              Biến động cao hơn đồng nghĩa cần thu hẹp mức phơi nhiễm.
            </p>
          </Panel>
        )}
        {visible.includes("hmm") && (
          <Panel title="HMM · Trạng thái" action={more("hmm")}>
            <div className="regime-main">
              <strong>
                {
                  [...data.regimes].sort(
                    (a, b) => b.probability - a.probability,
                  )[0].name
                }
              </strong>
              <span>Trạng thái có xác suất cao nhất</span>
            </div>
            <div className="regime-list">
              {data.regimes.map((regime, i) => (
                <div key={regime.name}>
                  <span>{regime.name}</span>
                  <div>
                    <i
                      style={{
                        width: `${regime.probability}%`,
                        background: [
                          "var(--positive)",
                          "var(--accent)",
                          "var(--negative)",
                        ][i],
                      }}
                    />
                  </div>
                  <b className="number">{regime.probability}%</b>
                </div>
              ))}
            </div>
            <p className="model-caption">
              Xác suất trạng thái không phải xác suất giao dịch thắng.
            </p>
          </Panel>
        )}
        {visible.includes("cmf") && (
          <Panel title="CMF · Dòng tiền" action={more("cmf")}>
            <div className="model-number">
              <strong className={`number ${tone(stock.cmf)}`}>
                {stock.cmf > 0 ? "+" : ""}
                {format(stock.cmf)}
              </strong>
              <span>
                {stock.cmf > 0
                  ? "Áp lực mua tương đối"
                  : "Áp lực bán tương đối"}
              </span>
            </div>
            <div className="cmf-gauge">
              <div />
              <span style={{ left: `${(stock.cmf + 1) * 50}%` }} />
            </div>
            <div className="gauge-labels">
              <span>−1</span>
              <span>0</span>
              <span>+1</span>
            </div>
            <p className="model-caption">
              CMF đối chiếu giá đóng cửa với khối lượng trong cửa sổ quan sát.
            </p>
          </Panel>
        )}
        {visible.includes("hurst") && (
          <Panel title="Hurst · Hành vi chuỗi" action={more("hurst")}>
            <div className="model-number">
              <strong className="number">{format(data.hurst)}</strong>
              <span>
                {data.hurst > 0.55
                  ? "Thiên về tính dai dẳng"
                  : data.hurst < 0.45
                    ? "Thiên về hồi quy"
                    : "Chưa phân biệt rõ"}
              </span>
            </div>
            <div className="hurst-scale">
              <span>Hồi quy</span>
              <span>Ngẫu nhiên</span>
              <span>Dai dẳng</span>
              <i style={{ left: `${data.hurst * 100}%` }} />
            </div>
            <p className="model-caption">
              H mô tả hành vi chuỗi và không tự chỉ ra chiều giá.
            </p>
          </Panel>
        )}
        {visible.includes("arx") && (
          <Panel title="ARX / Ridge · Kỳ vọng" action={more("arx")}>
            <div className="model-number">
              <strong className={`number ${tone(data.arx.expectedReturn)}`}>
                {signed(data.arx.expectedReturn)}
              </strong>
              <span>Lợi suất dự báo mẫu · 1 phiên</span>
            </div>
            <div className="arx-error">
              <span>Sai số RMSE</span>
              <b className="number">{format(data.arx.rmse)}%</b>
            </div>
            <p className="model-caption">
              Đọc kỳ vọng cùng sai số trước khi sử dụng một dự báo.
            </p>
          </Panel>
        )}
      </div>
      {!!visible.length && (
        <section className="reading-notes">
          <h2>Đọc kết quả đúng cách</h2>
          {models
            .filter((m) => visible.includes(m.id))
            .map((model) => (
              <details key={model.id}>
                <summary>
                  {model.name}
                  <span>{model.metric}</span>
                </summary>
                <div className="reading-grid">
                  <div>
                    <h3>Đầu vào</h3>
                    <p>{model.input}</p>
                  </div>
                  <div>
                    <h3>Đầu ra</h3>
                    <p>{model.output}</p>
                  </div>
                  <div>
                    <h3>Giới hạn</h3>
                    <p>{model.limit}</p>
                  </div>
                </div>
              </details>
            ))}
        </section>
      )}
      {help && (
        <Modal title={help.name} onClose={() => setHelp(null)}>
          <p>{help.description}</p>
          <h3>Đầu vào</h3>
          <p>{help.input}</p>
          <h3>Đầu ra</h3>
          <p>{help.output}</p>
          <h3>Giới hạn</h3>
          <p>{help.limit}</p>
        </Modal>
      )}
    </>
  );
}
