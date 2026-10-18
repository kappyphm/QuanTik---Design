# Quant request integration

`/analysis?symbol=FPT` and the chart sidebar use the same authenticated request
panel. GET analyses/options supplies completed sessions, eligible symbols and
readiness. Subscription, daily budget and active-job limits come from BE. Sizing
is optional, entered as VND and a percentage risk, converted to a ratio once.

Submitting opens a review of symbol/session/sizing. A single idempotency key is
retained after uncertain network/server errors. Repeating the same request can
retrieve an accepted job even if its daily budget has since reached zero.
Known client rejections clear the pending submission identity. New accepted
requests use a new identity. There is no cancellation or automatic POST replay.

Full-page URLs include job=ID; reopening retrieves ownership-checked status and
report from BE. Status polls every5seconds while visible until terminal; options,
entitlement and history refresh every30seconds. Full-page history includes all
symbols; the chart sidebar scopes history to its symbol. Both list newest first
and paginate without resetting the user's page on a timed refresh.
Sidebar reports link to the exact same job on the full page. Tokens and private
reports are never saved to browser storage. Expired authentication removes the
private panel through the shared session guard.

Real reports use the16-section API contract, BE decision/commentary/gates, VND
prices, returned close/volatility/Monte Carlo quantile series and explicit
unavailable sections. Day of data, collection time and analysis time are distinct.
The result layout follows kappyphm/quantik-react at40166c6: data lineage, trade
summary, synthesis, model navigation and five-part module explanations, then
research charts. QuantReport accepts only AnalysisReport; its former sample
renderer has been removed. There is no old-report conversion or backfill.

The research contract supplies P05/P25/P50/P75/P95 cones, terminal-return
histograms, dated HMM labels, historical drawdown, normalized factors and risk
metrics from the exact run. Browser SVG charts also show returned GARCH forecasts
and closing prices. Prices stay in VND; HMM current probabilities are percentages
and historical labels never become invented posterior probabilities. Chart data
tables, hover readouts and a recent-history filter support inspection. R:R and
upside/downside are display arithmetic with an ordered SL/entry/TP guard.
No browser model fitting or sample data fills missing model results.

Tests use temporary/route fixtures only. Production build, proxy boundary checks
and desktop/mobile browser scenarios verify submission, uncertain outcomes,
readiness/entitlement denial, private report failures, session expiry, persisted
job URLs, sizing, full/sidebar rendering and pagination stability. They do not
constitute live-market/model acceptance. Current provider certification remains
screening-only; Quant stays unavailable until its data/model prerequisites pass.

Backend contract and unresolved data acceptance:
quantik-server/docs/saas-plan/18-quant-request-integration.md.
