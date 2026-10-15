# Kế hoạch bổ sung FE theo backend hiện tại

Ưu tiên mới: triển khai xác thực, quản lý người dùng, mua gói/thanh toán và admin config trước theo [kế hoạch nhóm ưu tiên](AUTH-USERS-BILLING-ADMIN-PLAN.md). Các đợt dưới đây giữ làm bản đồ tổng thể, không còn là thứ tự thực thi đầu tiên.

## Phạm vi và nguyên tắc

- Làm trên nhánh client `feat/backend-alignment`. Không sửa source, database, cấu hình hoặc API của quantik-server.
- Giữ tối đa giao diện, component, nội dung và tương tác đang có; cập nhật dữ liệu và luồng thay vì dựng lại.
- Dashboard giữ nguyên. Dữ liệu bảng điện dùng nguồn thị trường bên ngoài, độc lập backend Quantik; chưa chốt nhà cung cấp.
- Screener giữ phần giới thiệu, tự tải kết quả và đặt ngay bên dưới trong cùng trang. Bỏ bước bấm nút mới thấy kết quả.
- Quant bổ sung vòng đời yêu cầu theo BE; trang kết quả giữ tối đa cách bố trí và cách đọc hiện tại.
- Mock được giữ làm fixture/preview riêng. Luồng thật không tự fallback sang mock khi API lỗi hoặc chưa có dữ liệu.

## Các điểm BE chưa cung cấp hoặc không khớp FE

| Mã | Vị trí FE | Khoảng trống / khác biệt | Xử lý phía FE |
|---|---|---|---|
| GAP-01 | dashboard.tsx, stock-table.tsx | Không có endpoint bảng điện, chỉ số dashboard, depth 3 mức, nước ngoài và tổng hợp GTGD ngành tương đương UI | Giữ component; tạo MarketDataSource riêng. Trong lúc chưa nối provider, giữ khung và hiển thị chưa có dữ liệu. Demo chỉ ở chế độ preview rõ ràng |
| GAP-02 | chart-workspace.tsx, sample-chart.tsx | Không có API OHLCV cho nguồn Dữ liệu Quantik; chuỗi close trong report không thay thế OHLCV | Giữ TradingView và bộ chọn nguồn. Nguồn chưa nối hiển thị trạng thái chờ; nối nguồn thị trường bên ngoài khi có khả năng và quyền sử dụng phù hợp |
| GAP-03 | preferences.tsx | Không có API watchlist, đồng bộ theme/tùy chọn tài khoản | Giữ localStorage; nêu watchlist lưu trên thiết bị, chưa đồng bộ. Không tạo API ghi giả |
| GAP-04 | screener.tsx | Customer API không có thao tác kích hoạt quét thủ công; không trả hai danh sách cố định 5 tốt/5 tránh | Tự đọc published run; hiển thị nhóm OVERALL/STRONG/ACCUMULATION/DISTRIBUTION và ALL. Giữ hình thức thẻ, mở tiêu chí; không suy diễn DISTRIBUTION thành TRÁNH |
| GAP-05 | quant-model-visual.tsx, quant-plots.tsx | Report không trả raw Monte Carlo paths; chưa có hợp đồng tương đương toàn bộ surface/3D fixture | Giữ renderer phục vụ preview; luồng thật dùng quantile trajectories và series được trả. Góc nhìn thiếu dữ liệu giữ khung/thông báo, không sinh đường hoặc surface thay thế |
| GAP-06 | quant-report.tsx, factor-profile.ts | Điểm nhân tố quy đổi riêng và lời khuyến nghị demo không tương đương rec/action của BE | Giữ bố cục; dùng điểm, hành động, gates, reason_codes và commentary của BE. Raw metric có thể giữ, điểm trang trí không có mapping thì ghi chưa khả dụng |
| GAP-07 | quant-panel.tsx | Job API không có phần trăm tiến độ, ETA hoặc streaming | Dùng status/reason và polling có backoff; không dựng phần trăm giả. Dừng khi terminal hoặc mất quyền, giảm polling khi tab ẩn |
| GAP-08 | analysis.tsx | FE chưa có API lịch phiên customer chuyên biệt; instruments không phải nguồn lịch giao dịch | Cho chọn target_session, lấy phiên từ published screening khi có và ghi rõ. Không tự suy ngày giao dịch gần nhất bằng ngày lịch; xử lý lỗi/chờ dữ liệu theo BE |
| GAP-09 | auth mới | Google callback BE trả JSON, refresh/exchange kiểm Origin; không có CORS middleware được khai báo trong api.py | Thêm xử lý same-origin phía Next.js. Không yêu cầu BE đổi callback hay mở CORS. Kiểm chứng callback/cookie/Origin trước các luồng nghiệp vụ |

Khi thi công, đặt comment `BE-GAP GAP-xx` sát adapter hoặc nhánh render liên quan: mô tả dữ liệu thiếu, nguồn dự kiến và trạng thái UI. Chỉ đánh dấu khoảng trống có bằng chứng; không rải TODO vào mọi component. Tài liệu này là danh mục theo dõi chung.

## Kiến trúc bổ sung phía client

- `lib/api/`: request, lỗi có code/request_id, DTO và mapping theo response hiện có; giữ units và availability.
- Route handlers phía Next.js: proxy có allowlist tới Quantik; upstream URL cấu hình server-side, không tạo open proxy. Không expose /internal/metrics.
- Auth customer/admin tách biệt. Chuyển tiếp đúng cookie/path và Set-Cookie; không lưu token trong localStorage. Request mutation từ browser phải được kiểm own-origin trước khi chuyển tiếp Origin phù hợp upstream.
- Google callback cần handler riêng: gọi callback BE với browser cookie, exchange trên server theo contract rồi chuyển cookie và redirect về ứng dụng. Không đưa access token/exchange code vào URL hoặc log. Sau redirect, FE khôi phục access bằng refresh.
- Cấu hình upstream Origin phải khớp BE đang chạy. Nếu không thể hoàn tất Google flow với cấu hình OAuth hiện có, báo đúng điều kiện chặn; không tự sửa BE hoặc Google Console.
- `lib/market/`: contract nguồn thị trường, adapter provider và mock preview tách khỏi Quantik API. Chuẩn hóa giá VND, shares, value và timestamps trước khi render; đánh dấu snapshot/delay/stale theo dữ liệu thật.
- `lib/adapters/`: ReportResult/ScreeningItem -> view models cho component cũ. Không ép report thật vào schema cột Excel nếu làm mất section, warnings hoặc metadata.
- Không dùng cache chung cho dữ liệu tài khoản/report/quota; request server lấy dữ liệu riêng tư phải no-store. Nhà cung cấp thị trường có cơ chế cache/rate limit riêng sau khi chọn nguồn.

## Các đợt thi công và điều kiện hoàn tất

### 0. Khóa hiện trạng và bản đồ dữ liệu

- Giữ thay đổi có sẵn ở frontend/next-env.d.ts; không đưa vào commit công việc một cách vô tình.
- Ghi mapping endpoint/field/units/availability và GAP cho từng màn, lấy source BE làm chuẩn.
- Ghi nhận baseline: typecheck đạt; npm test có 8/9 đạt, test hash glossary lỗi trên checkout CRLF. Cần kiểm chứng sau chuẩn hóa newline trước khi kết luận nguyên nhân.
- Hoàn tất khi phân biệt rõ phần giữ, phần nối API, phần chờ provider và lỗi nền.

### 1. Nền kết nối và đăng nhập

- Bổ sung client API, Next handlers, auth state, Google login/callback, refresh/logout và lỗi hết phiên.
- Kiểm chứng cookie và Origin trước; chống refresh đồng thời làm reuse token, tách customer/admin.
- Bổ sung trạng thái chưa đăng nhập, bị khóa, backend unavailable và giữ đường quay lại màn đang dùng.
- Hoàn tất khi đăng nhập/khôi phục phiên/đăng xuất hoạt động theo contract; phần Google live ghi riêng nếu chưa có consent/credentials.

### 2. Quét toàn sàn trong trang hiện tại

- Giữ intro và visual; render loading/kết quả bên dưới ngay khi vào trang, không còn bước mở màn kết quả.
- GET screenings/latest theo slot; GET results theo run_id/group/cursor. Giữ run_id ổn định khi phân trang và reset cursor khi đổi slot/nhóm/run.
- Bổ sung nhãn ngày phiên, stale reasons/latest attempt, ranking, tri-state criteria, coverage/rejection và empty/not-ready.
- Nút cập nhật chỉ tải lại kết quả đã công bố, không tạo screening run.
- Hoàn tất khi nhóm/thứ hạng/phân trang đúng BE, không lẫn kết quả giữa các phiên và không tự gán nhãn mua/bán.

### 3. Yêu cầu phân tích và lịch sử

- Giữ trang chọn mã, modal trước khi chạy và QuantPanel bên chart; bổ sung target_session, sizing tùy chọn, entitlement/quota trước xác nhận.
- Mỗi yêu cầu có Idempotency-Key riêng; retry cùng payload giữ key, thay payload tạo yêu cầu mới. Không tự retry POST bằng key mới sau timeout.
- Theo dõi QUEUED/WAITING_DATA/RUNNING/RETRY_WAIT/SUCCEEDED/FAILED/CANCELLED; xử lý reason, quota_effect, report_id, hủy và cập nhật quota từ BE.
- Lưu job_id trong đường dẫn và bổ sung lịch sử để reload/rời trang vẫn quay lại được; không lưu token hoặc report riêng tư vào localStorage.
- Hoàn tất khi timeout/double-click không nhân job, hủy phản ánh quota thực, mở lại job và mở report đúng owner.

### 4. Báo cáo thật, giữ tối đa thiết kế

- Tách component trình bày khỏi getAnalysisVisuals/getDemoResult; dùng report view model có nguồn rõ.
- Giữ thứ tự đọc Hành động -> Hiệu suất/dòng tiền -> HMM/Hurst -> GARCH -> Monte Carlo -> Rủi ro/kế hoạch.
- Bảo đảm truy cập đủ 16 section qua vùng chi tiết; thêm metadata data_as_of/evaluated_at/versions, units, warnings và trạng thái không khả dụng.
- Điểm/hành động/executable/gates/commentary lấy từ BE; tooltip giáo dục giữ lại nếu phù hợp. Không đưa lời demo vào nhận định thật.
- Giữ biểu đồ có series thật; GAP-05/GAP-06 thể hiện rõ với phần chưa có mapping. Format VND và ratio/pct tập trung, tránh nhân/chia lặp.
- Hoàn tất khi full page và sidebar đọc cùng một report, không lẫn fixture, giữ đủ thông tin BE và không tạo dữ liệu mô hình ở trình duyệt.

### 5. Các use case tài khoản và thanh toán

- Màn tài khoản: me, entitlements, usage, subscription; phân biệt quota total/reserved/consumed và kỳ hiệu lực.
- Màn gói và tạo đơn: plans, payments_enabled, Idempotency-Key; chi tiết đơn/QR, hủy, lịch sử đơn và payments.
- Poll trạng thái đơn theo BE. Không suy đã thanh toán từ nút bấm hoặc chỉ từ thời gian chờ; không tự cấp quota.
- Hoàn tất khi payment disabled/no entitlement/quota limit/expired/cancelled/paid có trạng thái đúng và không tự bật dịch vụ thanh toán.

### 6. Dashboard và nguồn thị trường độc lập

- Giữ nguyên dashboard, filter, watchlist, bảng ngành và modal chart.
- Chuyển component sang nhận view model qua MarketDataSource, giữ fixture riêng cho preview.
- Lập bảng coverage nhà cung cấp: indices, quote/depth, matched volume, foreign, sectors, OHLCV, units, độ trễ, quyền hiển thị và hạn mức. Chỉ chọn/nối provider sau khi có đủ thông tin truy cập.
- Có thể làm khung adapter và trạng thái thiếu dữ liệu trước; không chặn screener/Quant vì chưa chọn provider.
- Hoàn tất khi mọi ô có nguồn hoặc trạng thái thiếu rõ ràng; dữ liệu demo không được hiển thị như dữ liệu live.

### 7. Màn quản trị theo các API hiện có

- Login admin riêng; tổng quan health, users/state, jobs/quota-refund, plans/availability, payments/subscriptions/reconciliation và audit.
- Data/model health, scheduled tasks, config versions/activate, tích hợp Vnstock/SePay.
- Mutation tuân reason/evidence/expected_version hoặc expected_revision/Idempotency-Key đúng từng endpoint; xử lý conflict và không đọc lại secret.
- Không thêm nút điều khiển cho command chỉ có CLI hoặc thao tác BE chưa expose API. Thiếu thao tác được ghi GAP và giữ trạng thái thông tin.
- Hoàn tất khi từng màn chỉ dùng endpoint hiện có và quyền admin được xác thực từ server.

## Kiểm chứng và bàn giao

- Mỗi đợt là một phần có thể review độc lập trong client, không kèm thay đổi server.
- Typecheck/build cùng kiểm thử trọng điểm: auth/cookies, idempotency, polling/cancel/quota, report units/availability, screening cursor và payment state.
- Test demo hiện có chỉ chứng minh preview; bổ sung/điều chỉnh E2E cho luồng API thật hoặc API fixture tách biệt. Không gọi fixture là xác minh live.
- Rà giao diện desktop/mobile ở các màn thay đổi. Kiểm diff client và git status server cuối đợt.
- Bàn giao ghi rõ phần đã nối, phần chỉ kiểm fixture và GAP còn chờ nguồn dữ liệu/quyền truy cập. Không tự sửa BE để vượt điều kiện chặn.
