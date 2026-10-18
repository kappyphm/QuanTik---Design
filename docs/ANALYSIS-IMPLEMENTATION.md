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
No browser model calculations, fabricated raw simulation paths or surfaces fill
missing fields. Original sample visual components remain separate renderers;
the customer request path no longer loads a sample report.

Tests use temporary/route fixtures only. Production build, proxy boundary checks
and desktop/mobile browser scenarios verify submission, uncertain outcomes,
readiness/entitlement denial, private report failures, session expiry, persisted
job URLs, sizing, full/sidebar rendering and pagination stability. They do not
constitute live-market/model acceptance. Current provider certification remains
screening-only; Quant stays unavailable until its data/model prerequisites pass.

Backend contract and unresolved data acceptance:
quantik-server/docs/saas-plan/18-quant-request-integration.md.
