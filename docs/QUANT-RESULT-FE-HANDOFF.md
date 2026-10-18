# Bàn giao FE: giao diện kết quả phân tích chuyên sâu

## Phạm vi và yêu cầu bắt buộc

Giao diện tham khảo: [quantik-react, commit 40166c6](https://github.com/kappyphm/quantik-react/tree/40166c669e33e8bbfd00e688c9f9947b11755be6).
Giữ cấu trúc: nguồn dữ liệu → kế hoạch vị thế → tổng hợp bằng chứng → giải thích từng mô hình → nhóm biểu đồ.
Dev FE có thể cải thiện bố cục, typography và tương tác, nhưng **phải tuân thủ API contract và data structure của BE đang triển khai**.
Không đổi tên field, đơn vị, ý nghĩa chỉ tiêu hoặc tự tính lại kết luận để phù hợp một thiết kế.
Nếu UI cần thêm dữ liệu, đề xuất thay đổi contract BE trước và cập nhật type/fixture/test cùng lúc.

Các nguồn chuẩn trong repo:

- `frontend/src/lib/api/analysis.ts`: AnalysisJob, AnalysisReport, ReportSection, QuantResearch.
- `frontend/src/components/quant-request.tsx`: admission, idempotency, polling và ownership-checked report fetch.
- `frontend/src/components/quant-live-report.tsx`: bố cục và nội dung báo cáo.
- `frontend/src/components/quant-research.tsx`: biểu đồ SVG và bảng đối chiếu dữ liệu.
- `frontend/src/lib/quant-reader.ts`: ánh xạ field, nội dung giải thích và định dạng.

BE tương ứng: `quantik-server/backend/src/service/reports.py`, `report_assembly.py`,
`quant/research.py`, `quant/baseline.py`, `quant/serialization.py`.
PR này thuộc repo FE; không chứa mã Python BE. Cần triển khai BE có trường `research` để điền đủ biểu đồ.

## API và luồng trạng thái

| API | Vai trò / điều kiện |
| --- | --- |
| `GET /api/v1/analyses/options` | Readiness, selected_session và danh sách mã hợp lệ từ BE |
| `POST /api/v1/analyses` | `{symbol, target_session, sizing?}`; dùng Idempotency-Key của request hiện tại |
| `GET /api/v1/analyses` | Lịch sử có phân trang; không tự POST khi mở trang |
| `GET /api/v1/analyses/{job_id}` | QUEUED/WAITING_DATA/RUNNING/RETRY_WAIT/SUCCEEDED/FAILED/CANCELLED |
| `GET /api/v1/reports/{report_id}` | Chỉ lấy khi job SUCCEEDED có report_id; BE kiểm quyền sở hữu |

Giữ nguyên cơ chế auth/proxy và xử lý hết phiên. Không lưu access/refresh token hoặc báo cáo riêng tư vào localStorage.
Không bỏ các gate gói, hạn mức, dữ liệu/model readiness. Đọc `decision.action`, `executable`,
`gate_pass`, `reason_codes` từ BE; không suy ra BUY từ forecast dương, score hoặc màu biểu đồ.
`showAction=false` chỉ ẩn khối trình bày hành động, không thay đổi dữ liệu báo cáo.

## Cấu trúc dữ liệu

`AnalysisReport.schema_version` là chuỗi `"1.0"`; `research.schema_version` là số `1`.
`sections` là object theo tên section, không phải mảng module của prototype.
Mỗi section có `status`, `reason_codes`, `metrics`, `units`.
Trạng thái section: `AVAILABLE | UNAVAILABLE | DISABLED`.
Field tùy chọn/null không được ép thành 0, 100% hoặc một trạng thái tích cực.

Các metrics giữ nesting của BE, ví dụ GARCH có **hai lớp garch**:

| Nội dung UI | Đường dẫn trên AnalysisReport |
| --- | --- |
| Quyết định cuối | `decision.action`, `decision.executable`, `decision.reason_codes` |
| Nhận định BE | `commentary.summary`, `commentary.detailed` |
| Sharpe / MaxDD / biến động năm | `sections.statistics.metrics.stats.{sharpe,max_dd_pct,ann_vol_pct}` |
| Chuỗi giá và ngày | `sections.statistics.metrics._price_close`, `_price_dates` |
| HMM hiện tại | `sections.hmm.metrics.hmm.{current,method,prob_pct,state_probs}` |
| GARCH | `sections.garch.metrics.garch.garch.{alpha,beta,persistence,current_vol_pct,forecast_vol}` |
| EGARCH | `sections.garch.metrics.garch.egarch` |
| Momentum / Hurst / LightGBM | `sections.directional_alpha.metrics.{momentum_alpha,hurst,lightgbm_cross_sectional,conditional_mr}` |
| Dự báo có hướng / độ phủ | `sections.agreement.metrics.fcast.{ensemble_ret_pct,agreement_pct,coverage_pct,support_pct}` |
| Monte Carlo / T-lock | `sections.simulation_risk.metrics.simulation_risk.{mc,lock_risk,horizon}` |
| CMF / xu hướng / RS | `sections.technical.metrics.flow.cmf`, `trend`, `alpha.cross_sectional` |
| Chi phí | `sections.costs.metrics.costs.{gross_forecast_pct,roundtrip_cost_pct,net_forecast_pct}` |
| Entry / SL / TP | `sections.trade_plan.metrics.sl.{entry,sl_swing,tp1,tp2}` |
| Quy mô | `sections.trade_plan.metrics.pos`, `sizing_mode` |

## Contract biểu đồ: research

`research` thuộc top-level report; không lấy từ dữ liệu demo hoặc giả định prototype `job.research` có cùng cấu trúc.
Các mảng có thể rỗng khi mô hình không có kết quả. Kiểm tra `schema_version`, `symbol`, `units` trước khi dùng.

| Field | Cấu trúc / ý nghĩa |
| --- | --- |
| `units` | `{price:"VND", return:"pct"}` |
| `observations`, `start`, `end` | Số nến và cửa sổ dữ liệu phân tích |
| `horizon_sessions`, `simulation_count` | Horizon và số kịch bản thực tế |
| `cone[]` | `{session,p05,p25,p50,p75,p95}`; session=1 là phiên dự báo đầu tiên |
| `distribution[]` | `{returnPct,probabilityPct,lowerPct?,upperPct?,count?}`; midpoint, tỷ lệ %, biên bin và số mẫu |
| `regime[]` | `{date,price,state}`; giá VND và nhãn BULL/BEAR/SIDEWAY của đúng ngày |
| `drawdown[]` | `{date,valuePct}`; phần trăm giảm từ đỉnh, giá trị không dương |
| `factors[]` | `{id,label,value,min,max}`; giá trị z chuẩn hóa và miền do BE cấp |
| `risk_metrics[]` | `{id,label,value,unit}`; VaR/CVaR mô phỏng và rủi ro T-lock đã tổng hợp |

Quy tắc hiển thị bắt buộc:

1. Giá là **VND**, không tự nhân/chia 1.000. Nếu đổi đơn vị hiển thị phải đổi toàn bộ trục, tooltip, bảng và nhãn nhất quán.
2. `_pct` và `probabilityPct` đã là phần trăm; HMM state_probs cũng là phần trăm. Không nhân 100 lần nữa.
3. `p05 ≤ p25 ≤ p50 ≤ p75 ≤ p95`. Không dùng `mc_path.lower/upper` cũ thay P05/P95: hai biên đó là P2.5/P97.5.
4. Cone là phân vị theo từng phiên, không phải các đường kịch bản độc lập. Histogram là phân phối **cuối kỳ**, không phải xác suất TP chạm trước SL.
5. HMM lịch sử hiện có nhãn cứng; không suy diễn xác suất lịch sử từ xác suất hiện tại. Fallback phải được ghi rõ.
6. GARCH forecast là biến động theo phiên, có thể tiến dần về mức ổn định; không tạo gợn để trông như giá cổ phiếu.
7. Radar dùng đúng `min/max` BE trả. Điểm chuẩn hóa không phải xác suất mua/thắng.
8. Chỉ tính R:R gộp, upside/downside ở FE khi `0 < SL < Entry < TP2`; không thay thế R:R sau chi phí hoặc forecast của BE.
9. Giữ các điểm theo thứ tự phiên. Không thêm smoothing/interpolation làm thay đổi giá, phân vị hoặc che dữ liệu thiếu.
10. Không đủ dữ liệu thì hiện trạng thái thiếu. Không nạp fixture/mock-data để lấp báo cáo thật; không tạo đường giả cho đẹp.

`target_session` là ngày giao dịch. `data_observed_at` là thời điểm thu thập;
`evaluated_at` là thời điểm phân tích. Timestamp hiển thị theo múi giờ ứng dụng;
không đổi ngày giao dịch bằng cách diễn giải nó như timestamp UTC.

## Kiểm chứng và lưu ý cho người nhận bàn giao

Đã chạy build/typecheck, 10 kịch bản desktop/mobile của `quant-report.spec.ts` và
kiểm tra lại luồng report sau điều chỉnh kích thước SVG.
Trên VPS, 6 báo cáo thật của FPT/IJC/MST được bổ sung aggregates sau khi tái lập
Monte Carlo bằng cùng cấu hình, seed, dữ liệu và runtime, đối chiếu median/lower/upper
với báo cáo đã lưu ở `rtol=1e-12, atol=1e-8`. Không đổi quyết định hoặc hạn mức.

FPT thực tế có 252 điểm giá (105 bước tăng, 141 bước giảm, 5 bước ngang),
233 nhãn HMM, 10 phiên phân vị và 37 bin histogram.
Ảnh HTTPS thực tế: [giá FPT desktop](images/quant-result-production-desktop-price.png),
[giá FPT mobile](images/quant-result-production-mobile-price.png).
Ảnh chỉ chứa biểu đồ; không chứa token hoặc thông tin tài khoản.

Fixture `frontend/tests/fixtures/analysis.ts` cố ý chỉ có ba điểm tăng đều để kiểm
tra wiring. Vì thế ảnh từ fixture có đường thẳng. Fixture này **không phải dữ liệu
thị trường**, không được dùng để đánh giá hình dạng giá hoặc làm fallback production.

Checklist khi dev FE sửa UI:

- Giữ contract/types và nesting trên; review mọi field mới với BE.
- Giữ nguyên auth, request idempotency, quota, job polling và report ownership.
- Kiểm tra các panel thiếu dữ liệu, model fallback/partial, số 0 hợp lệ và null.
- Đối chiếu bảng dữ liệu với điểm SVG/tooltip, đơn vị và ngày; kiểm tra trên mobile.
- Kiểm tra cùng báo cáo thật trên HTTPS; không nghiệm thu bằng ảnh fixture riêng lẻ.
- Không đưa raw `_mc_paths`, secrets hay dữ liệu cá nhân vào source hoặc screenshot.
- Không tự đổi model, horizon, số mẫu, trọng số, threshold hay status BE để khớp bố cục.

Không có yêu cầu migrate hoặc duy trì renderer báo cáo mẫu cũ. Không merge thay đổi
UI làm sai semantics của dữ liệu dù hình thức đã giống prototype.
