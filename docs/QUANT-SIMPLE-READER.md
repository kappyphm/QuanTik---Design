# Quant: a simpler report with interactive visuals

The default reader answers everyday questions before showing model names or
diagnostics. Sixteen initially expanded model sections are replaced by a short
conclusion and four illustrated cards: current price/trend, simulated price
ranges, historical/forecast risk and the backend's conditional trade levels.
Each chart explains what its axes, colors and values mean in plain Vietnamese.

The original commentary is under “Đọc nhận định đầy đủ”.
“Xem phân tích chuyên sâu” lazily opens the original sixteen module readers,
all collapsed, plus research charts/tables, warnings and version details. The
full page and compact chart sidebar share the reader; compact cards stay in a
single column. Request submission, idempotency, quota and report access are
unchanged. No backend or API schema changes are required.

## Data semantics

- Scenario 3D projects the five reported P05/P25/P50/P75/P95 curves from
  `research.cone`. Height is VND price, the horizontal axis is the reported
  session and depth separates percentile layers. Connecting those aggregates
  does not create individual Monte Carlo paths. A session slider selects an
  existing report point; the 2D view uses the same aggregate values.
- The HMM 3D scene uses `hmm.state_probs` only when all three probabilities are
  finite, in 0–100 and total approximately 100. A fallback never gets invented
  probability bars. Classification confidence is explicitly distinguished from
  the probability of a profitable trade.
- P05–P95 contains approximately 90% of simulated outcomes at a given session.
  It is conditional on model assumptions, and the median is not a guaranteed
  price. Historical drawdown is labelled historical; forecast volatility is
  described as magnitude, not price direction.
- Section UNAVAILABLE/DISABLED, nested `available=false`/errors and invalid
  numeric data cannot become primary metrics. Missing/invalid/wrong-unit or
  cross-symbol research never falls back to demo data. Positive and ordered
  percentile prices and strictly increasing sessions are checked before plotting.
- BUY_NOW with executable=false reads “Chờ hoàn tất điều kiện”. Forecasts and
  probabilities never override the backend action. Entry/stop/target levels are
  conditional; reference sizing remains explicitly labelled.

## Interaction

SVG scenes use a 3D projection with mouse/touch dragging, arrow keys, a native
rotation slider and reset. There is no autoplay, animation loop, rendering
dependency or fabricated GARCH surface. ResizeObserver keeps the geometry within
the page/sidebar; CSS theme colors support dark/light mode. Vertical touch
scrolling remains available. The scene requires no new provider call or model
run and does not consume an additional Quant request.

## Verification scope

Existing report/browser fixtures exercise the simple default, advanced disclosure,
both 3D models, rotation, selected-session values, 2D alternative, reopened report
URLs, missing/invalid research, fallback probabilities, disabled metrics and a
non-executable BUY_NOW. Existing request/idempotency/access checks are retained.
The sidebar case verifies the same reader without mixing sample price candles
with report data. Browser fixtures verify UI behavior, not model/live-market
acceptance. This change has not been deployed to production.

The final Linux production image (`quantik-web:quant-simple-preview`) built
successfully, including TypeScript checks. Six focused browser checks against
that image passed across desktop/mobile: the full report, compact sidebar and
unavailable/fallback/non-executable cases. They also cover rotation, synchronized
2D/3D session selection, advanced disclosure and light/dark rendering. The
earlier full 16-case report/sidebar suite passed before the final layout refinements.
Native Windows builds intermittently exhausted Node's native allocator during
worker/tracing finalization; the final validation used Linux with two build
workers. No system memory settings or repository build configuration changed.
