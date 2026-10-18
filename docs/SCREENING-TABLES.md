# Screening tables and detail modal

The screening page displays two full-width tables: five best stocks and five
stocks with the highest distribution scores. Each keeps symbol/exchange, price,
1D/5D/20D changes, session/average volume, volume ratio, distance to the 20-day
high, all three screening scores/counts and data status. There is no full-market
pagination, page-size selector or filtering UI. Groups rank independently and
may contain the same stock.

Clicking a symbol opens the wide centered modal with assessment, adjusted signal,
VNINDEX context, investor/broker notes and chart/Quant links. A modal stays pinned
to the publication selected at opening. Both tables update together; refresh
failure preserves the previous publication and its date/stale notice.

## Backend dependency

Requires the rich top-five contract in
[kappyphm/quantik-server commit b011676](https://github.com/kappyphm/quantik-server/commit/b011676):

- `GET /api/v1/screenings/latest`
- `GET /api/v1/screenings/{run_id}/results?group=OVERALL|DISTRIBUTION`
  returns `run_id`, `group`, `items` (max five per group).
- `GET /api/v1/screenings/{run_id}/symbols/{symbol}` returns modal data only for
  symbols in either top-five selection. The proxy allowlist includes this GET.

Both backend and frontend are deployed as release
`20261018-screening-tables-01` at https://quantik.io.vn/screener.
Frontend application source: `7584b94`. The production rollout reused the existing
backend runtime and changed only API/view contracts; no schema migration or
ranking engine change was needed.

## Validation

TypeScript, production build, six proxy boundary checks and ten desktop/mobile
screening browser cases passed. The separate real proxy/FastAPI/SQLite harness
uses an 80-symbol isolated universe to verify two five-row tables and modal access.

Actual production verification at 1440px/390px passed against the existing live
publication for 16/10/2026: two five-row tables, modal details, no pagination, no
horizontal overflow or JS errors, anonymous denial and denial for detail requests
outside both selections. The temporary audited session was revoked and Quant
quota counters were unchanged. This release does not create a new publication or
claim that the older publication is current; the page retains its date/stale state.
