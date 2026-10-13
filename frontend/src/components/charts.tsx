"use client";
import { useEffect, useId, useRef, useState } from "react";
import { format, type Analysis, type Candle } from "@/lib/mock-data";
function useChartWidth(initial: number) {
  const ref = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const resize = () => {
      const style = getComputedStyle(element);
      const measured =
        element.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      if (measured > 0) setWidth(Math.max(260, Math.round(measured)));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
export function Sparkline({
  values,
  positive = true,
}: {
  values: number[];
  positive?: boolean;
}) {
  const min = Math.min(...values),
    max = Math.max(...values);
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 140},${38 - ((v - min) / (max - min || 1)) * 32}`,
    )
    .join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 140 44" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "var(--positive)" : "var(--negative)"}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
export function ForecastChart({ data }: { data: Analysis["forecast"] }) {
  const id = useId().replace(/:/g, "");
  const { ref, width: w } = useChartWidth(760);
  const h = 290,
    left = 58,
    right = 24,
    top = 22,
    bottom = 42;
  const min = Math.min(...data.map((d) => d.p10)) * 0.99,
    max = Math.max(...data.map((d) => d.p90)) * 1.01;
  const x = (i: number) => left + (i / (data.length - 1)) * (w - left - right),
    y = (v: number) => top + ((max - v) / (max - min)) * (h - top - bottom);
  const band = (lo: "p10" | "p25", hi: "p90" | "p75") =>
    [
      ...data.map((d, i) => `${x(i)},${y(d[hi])}`),
      ...data
        .slice()
        .reverse()
        .map((d, j) => `${x(data.length - 1 - j)},${y(d[lo])}`),
    ].join(" ");
  return (
    <svg
      ref={ref}
      className="large-chart"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Khoảng phân vị giá Monte Carlo minh họa trong 20 phiên"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="var(--positive)" stopOpacity=".2" />
          <stop offset="1" stopColor="var(--positive)" stopOpacity=".025" />
        </linearGradient>
      </defs>
      {Array.from({ length: 5 }, (_, i) => {
        const v = min + ((max - min) * i) / 4;
        return (
          <g key={i}>
            <line
              x1={left}
              x2={w - right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeDasharray="3 5"
            />
            <text x={left - 10} y={y(v) + 4} textAnchor="end">
              {format(v, 1)}
            </text>
          </g>
        );
      })}
      <polygon points={band("p10", "p90")} fill={`url(#${id})`} />
      <polygon
        points={band("p25", "p75")}
        fill="var(--positive)"
        opacity=".15"
      />
      <polyline
        points={data.map((d, i) => `${x(i)},${y(d.p50)}`).join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
      />
      {(w < 450 ? [0, 10, 20] : [0, 5, 10, 15, 20]).map((i) => (
        <text
          key={i}
          x={x(i)}
          y={h - 15}
          textAnchor={i === 0 ? "start" : i === 20 ? "end" : "middle"}
        >
          {i === 0 ? "Hiện tại" : `${i} phiên`}
        </text>
      ))}
    </svg>
  );
}
export function VolatilityChart({ values }: { values: number[] }) {
  const id = useId().replace(/:/g, "");
  const { ref, width: w } = useChartWidth(500);
  const h = 155;
  const max = Math.max(...values) * 1.15;
  const points = values
    .map(
      (v, i) =>
        `${20 + (i / (values.length - 1)) * (w - 40)},${135 - (v / max) * 115}`,
    )
    .join(" ");
  return (
    <svg
      ref={ref}
      className="large-chart"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Biến động có điều kiện GARCH minh họa"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="var(--accent)" stopOpacity=".25" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[40, 80, 120].map((v) => (
        <line
          key={v}
          x1="20"
          x2={w - 20}
          y1={v}
          y2={v}
          stroke="var(--border)"
        />
      ))}
      <polygon points={`20,135 ${points} ${w - 20},135`} fill={`url(#${id})`} />
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
      />
    </svg>
  );
}
export function PriceChart({
  candles,
  type = "candles",
  cmf = false,
}: {
  candles: Candle[];
  type?: "candles" | "line";
  cmf?: boolean;
}) {
  const { ref, width: w } = useChartWidth(960);
  const h = cmf ? 520 : 410,
    left = 20,
    right = 65,
    top = 25,
    priceBottom = 280,
    volumeTop = 300,
    volumeBottom = 350;
  if (!candles.length) return null;
  const min = Math.min(...candles.map((c) => c.low)) * 0.985,
    max = Math.max(...candles.map((c) => c.high)) * 1.015;
  const step = (w - left - right) / candles.length,
    x = (i: number) => left + (i + 0.5) * step,
    y = (v: number) => top + ((max - v) / (max - min)) * (priceBottom - top),
    maxVolume = Math.max(...candles.map((c) => c.volume));
  return (
    <svg
      ref={ref}
      className="price-chart"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`Biểu đồ ${type === "candles" ? "nến" : "đường giá"} và khối lượng gồm ${candles.length} kỳ${cmf ? ", có CMF" : ""}`}
    >
      {Array.from({ length: 6 }, (_, i) => {
        const v = min + ((max - min) * i) / 5;
        return (
          <g key={i}>
            <line
              x1={left}
              x2={w - right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeDasharray="3 5"
            />
            <text x={w - right + 12} y={y(v) + 4}>
              {format(v)}
            </text>
          </g>
        );
      })}
      {type === "line" ? (
        <polyline
          points={candles.map((c, i) => `${x(i)},${y(c.close)}`).join(" ")}
          fill="none"
          stroke="var(--positive)"
          strokeWidth="2.5"
        />
      ) : (
        candles.map((c, i) => {
          const color =
            c.close >= c.open ? "var(--positive)" : "var(--negative)";
          return (
            <g key={c.date}>
              <line
                x1={x(i)}
                x2={x(i)}
                y1={y(c.high)}
                y2={y(c.low)}
                stroke={color}
              />
              <rect
                x={x(i) - step * 0.29}
                y={Math.min(y(c.open), y(c.close))}
                width={step * 0.58}
                height={Math.max(1.5, Math.abs(y(c.open) - y(c.close)))}
                fill={color}
              >
                <title>{`${c.date} · O ${c.open} · H ${c.high} · L ${c.low} · C ${c.close}`}</title>
              </rect>
            </g>
          );
        })
      )}
      <text x={left} y={volumeTop + 10}>
        Khối lượng
      </text>
      {candles.map((c, i) => (
        <rect
          key={c.date}
          x={x(i) - step * 0.3}
          y={volumeBottom - (c.volume / maxVolume) * 36}
          width={step * 0.6}
          height={(c.volume / maxVolume) * 36}
          fill={c.close >= c.open ? "var(--positive)" : "var(--negative)"}
          opacity=".4"
        />
      ))}
      {cmf && (
        <g>
          <text x={left} y="390">
            CMF
          </text>
          <line
            x1={left}
            x2={w - right}
            y1="440"
            y2="440"
            stroke="var(--border)"
            strokeDasharray="3 5"
          />
          <polyline
            points={candles
              .map((c, i) => `${x(i)},${440 - c.cmf * 70}`)
              .join(" ")}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
          />
        </g>
      )}
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const index = Math.round((candles.length - 1) * fraction);
        return (
          <text
            key={fraction}
            x={x(index)}
            y={h - 18}
            textAnchor={
              fraction === 0 ? "start" : fraction === 1 ? "end" : "middle"
            }
          >
            {candles[index].date.slice(5).replace("-", "/")}
          </text>
        );
      })}
    </svg>
  );
}
