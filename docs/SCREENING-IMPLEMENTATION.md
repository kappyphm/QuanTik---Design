# Screening FE ↔ BE — 16/10/2026

## Implemented

- `/screener` opens the latest published results directly. No launch-scan/reset-to-intro step, no screening JSON fallback. Reads use the existing in-memory session + same-origin proxy.
- Explicit GET-only allowlist for latest and run/results. Both BE endpoints enforce active paid screening entitlement; FE prompts login or links plans when needed. Viewing does not consume daily analysis limits.
- Select latest/AM/PM; overview preserves two card columns, mapping overall ranks to prominent stocks and distribution ranks to risk warnings. Group tabs cover overall/strong/accumulation/distribution/all. Five rows per request, with load-more; a group can contain fewer than five or no eligible stocks.
- Each group is pinned to one publication ID. Changing slot or publication discards old pagination; late responses cannot overwrite a different view. ALL uses symbol order; ranked groups use BE rank order.
- Publication shows date/slot, AM provisional versus PM completed, timestamp, coverage and stale reasons. Before first publication it shows waiting/last-attempt information; transient errors retain the explicitly dated previous publication. Refresh reads existing results only, every60seconds when visible, and on tab return.
- Cards use real scores/prices/percentage ratios,21 TRUE/FALSE/UNAVAILABLE criteria and warnings. Missing data is not rendered as false. High distribution score is explicitly described as risk. No fabricated HMM/GARCH/Monte Carlo content is attached to screening results.
- The separate Quant page remains a simulation in its existing scope. Links from screening carry a visible explanation that opening it does not create an actual Quant request or report. Completing Quant requests is a separate flow; this task does not claim that integration.
- Admin scheduled tasks includes screening publication/attempt status, calendar, ingestion/environment switches and scheduler/worker health, with links to the relevant configuration pages.

## Backend and operational status

See quantik-server/docs/saas-plan/17-screening-integration.md for the source contract and workers. Provider validation is scoped to screening and does not certify corporate-action adjustment or unlock Quant/training.

Local Vnstock Golden authentication and live VCI universe/VNINDEX/FPT reads succeeded. Scheduler + INGEST/SCREEN processes are running locally; both ingestion gates were enabled and audited. The AM window was already over at implementation time; the first full-market live publication still requires a successful scheduled window, starting with PM16:00–17:30 on16/10/2026 Vietnam time. Until then, no-publication UI is expected. No sample results were seeded into the operational DB, and no VPS release was deployed.

## Checks

- Production webpack build and TypeScript passed.18Node checks passed, including GET-only proxy boundaries.
-10screening desktop/mobile scenarios checked:8passed first;2slot-change scenarios exposed a missing accessible select label, which was fixed and both passed on targeted rerun.
-4related desktop/mobile checks passed for anonymous screening and admin screens affected by the new health panel.
- Full browser → Next proxy → FastAPI → temporary SQLite check passed on1440px/390px. It used actual session refresh cookies, entitlement and screening endpoints with isolated synthetic data, asserting correct publication IDs and zero quota consumption. Screenshots were inspected; no horizontal overflow or JavaScript errors.

Reproduce the isolated end-to-end check after building FE, with the server repo beside the client and the shared venv installed:

```powershell
& "$HOME/.venv/Scripts/Activate.ps1"
node tools/screening-e2e.mjs
```

It uses ports3207/3208, ephemeral keys/database and an in-memory test refresh cookie; cleanup verifies the exact temporary directory. It never targets the operational database or calls Vnstock. Unit/UI fixtures cover states not yet witnessed on a full live-market cycle.
