# Ưu tiên triển khai: xác thực, người dùng, mua gói và admin config

Đã triển khai FE theo kế hoạch; xem [bàn giao, đường dẫn màn hình và bằng chứng kiểm tra](ACCOUNT-ADMIN-IMPLEMENTATION.md). Checklist dưới đây giữ nội dung kế hoạch ban đầu; các điều kiện live Google/SePay và routing vẫn được ghi riêng trong bàn giao.

## Phạm vi chốt

- Nhánh: `feat/backend-alignment`, chỉ thay đổi quantik-client. Không sửa BE, DB, secrets hoặc cấu hình runtime hiện có khi lập kế hoạch.
- Bổ sung FE theo API hiện tại, tái sử dụng typography/theme/Panel/Modal/form/table và shell. Không xóa dashboard, screener, Quant, chart hoặc fixture preview.
- “Mua bán/thanh toán” trong đợt này là bán/mua gói phân tích trả trước: quản lý gói -> tạo đơn -> chuyển khoản/QR -> BE xác nhận -> quyền sử dụng/quota. Không có giao dịch chứng khoán hoặc ví.
- Chưa triển khai nghiệp vụ screening/report/market provider trong đợt này; chỉ thêm điểm vào đăng nhập/tài khoản/gói/admin trong navigation.
- Kế hoạch tổng tại [BACKEND-ALIGNMENT.md](BACKEND-ALIGNMENT.md). Tài liệu này thay thứ tự ưu tiên cho bốn nhóm được yêu cầu.

## Danh sách màn hình và contract

Các đường dẫn FE dưới đây là đề xuất, không phải endpoint BE mới. Endpoint trong bảng có prefix `/api/v1`.

| Nhóm | Màn FE | API BE hiện có / hành vi |
|---|---|---|
| Xác thực | `/login` | GET auth/google/start; handler callback Google; POST auth/exchange, auth/refresh, auth/logout; GET me |
| Admin auth | `/admin/login` | POST admin/auth/login, admin/auth/refresh, admin/auth/logout; GET admin/me |
| Tài khoản | `/account` | GET me, me/entitlements, me/usage, subscription. ID, gói/kỳ hiệu lực, quota total/reserved/consumed, giới hạn job; không dựng tên/email giả |
| Mua gói | `/plans` | GET plans: giá, quota, thời hạn, active_limit và payments_enabled; POST orders với plan_id và Idempotency-Key |
| Thanh toán | `/orders/[id]` | GET orders/{id}; POST orders/{id}/cancel. Hiển thị bank/account/transfer_content/qr_url/amount/expires_at từ đơn |
| Lịch sử | `/account/orders`, `/account/payments` | GET orders, payments với cursor; liên kết mở đơn theo order_id |
| Người dùng admin | `/admin/users` | GET admin/users; POST admin/users/{id}/state với enabled/reason |
| Chi tiết người dùng admin | `/admin/users/[id]` | Đối chiếu ID từ danh sách; GET admin/subscriptions?account_id=..., admin/jobs?account_id=...; không có API chi tiết hồ sơ/quota customer cho admin |
| Danh mục gói admin | `/admin/plans` | GET/POST admin/plans; POST admin/plans/{id}/availability. Nội dung gói bất biến; thay giá/quota bằng gói phiên bản mới |
| Giao dịch admin | `/admin/payments` | GET admin/payments với status/cursor; GET admin/subscriptions khi cần tra kỳ gói |
| Đối soát | `/admin/reconciliation` | GET admin/reconciliation; POST admin/reconciliation/{payment_id}/apply với order_id/reason |
| Tích hợp | `/admin/config/integrations` | GET/PATCH admin/integrations/sepay và vnstock; revision, source, encryption_ready, trạng thái secret/configuration và runtime gates |
| Vận hành | `/admin/config/operations` | GET admin/configs/OPERATIONS; POST .../versions; POST .../{version_id}/activate |
| Lịch giao dịch | `/admin/config/calendar` | Cùng contract config với kind TRADING_CALENDAR; nhập sessions có nguồn, tạo version và activate/rollback |
| Theo dõi tác vụ | `/admin/scheduled-tasks` | GET admin/scheduled-tasks theo kind/status/cursor; chỉ đọc |
| Nhật ký | `/admin/audit` | GET admin/audit theo action/cursor; xem actor, thời điểm và details được BE trả |

Không tạo bảng “toàn bộ đơn hàng admin” bằng cách ghép dữ liệu rồi khẳng định đầy đủ: BE hiện không có endpoint liệt kê orders toàn hệ thống.

## Kiến trúc và xử lý phiên

- `lib/api/`: request helpers, DTO có nguồn, error code/request_id, cursor, formatter VND và timestamps.
- Route handlers Next làm lớp same-origin với allowlist method/path và upstream cố định server-side; không forward tùy ý URL, không expose webhook SePay hoặc internal metrics qua generic proxy.
- Chọn và kiểm chứng cơ chế token ở M0: access ở volatile memory của browser, refresh trong cookie HttpOnly theo BE; không lưu token vào localStorage. Session customer/admin riêng.
- Chuyển tiếp cookie và từng Set-Cookie nguyên vẹn với path `/api/v1/auth` hoặc `/api/v1/admin/auth`; không đổi SameSite một cách tùy tiện. Protected response dùng no-store.
- Mutation browser kiểm own-origin; chỉ sau kiểm tra mới chuyển Origin phù hợp cấu hình upstream. Không dùng proxy để bỏ qua CSRF check. UI guard chỉ hỗ trợ UX; BE xác thực mọi request.
- Refresh single-flight trong tab và điều phối các tab cùng role bằng browser coordination phù hợp; không dùng khóa global trộn tài khoản. Sau refresh lỗi/revoked/reuse thì kết thúc phiên, không lặp vô hạn.
- Callback route riêng tại đường dẫn Google đã dùng `/api/v1/auth/google/callback`: nhận top-level navigation, forward state/code/browser cookie cho callback BE, exchange trên server và chuyển tiếp refresh cookie, rồi redirect về UI. Không đưa bearer/exchange code lên URL hoặc log; callback no-store/referrer-policy phù hợp.
- Route callback phải được public-origin hiện có định tuyến qua Next. M0 kiểm cấu hình đang chạy; nếu Google hiện redirect thẳng tới BE JSON thì ghi blocker cần route/OAuth deployment change được duyệt sau, không tự sửa BE hoặc Google Console.
- `returnTo` chỉ nhận đường dẫn nội bộ hợp lệ, tránh open redirect. Callback không tin returnTo từ query tùy ý.
- Giữ theme và watchlist hiện tại. State tài khoản/quota/đơn không được dùng chung cache giữa hai phiên.

## Milestones theo thứ tự thi công

### M0 — Nền API, hợp đồng và kiểm chứng đường đăng nhập

- [ ] Chụp baseline client và bảo toàn thay đổi next-env.d.ts có sẵn.
- [ ] Tạo API helpers/allowlist/DTO/errors và cấu hình mẫu FE không chứa secrets; đọc tối thiểu shape response từ BE.
- [ ] Chốt auth/callback/cookie routing bằng kiểm thử handler với upstream fixture. Kiểm Origin sai, redirect sai, cookie path, nhiều Set-Cookie, no-store và ranh giới customer/admin.
- [ ] Xác minh việc public origin hiện tại có thể phục vụ callback qua Next; ghi rõ fixture pass khác Google live pass.
- Hoàn tất: có nền kết nối kiểm chứng được; điều kiện cấu hình thiếu được ghi chính xác, không sửa backend để vượt chặn.

### M1 — Xác thực customer và admin

- [ ] Trang Google login, trạng thái callback/consent lỗi/hết hạn và quay lại trang nội bộ.
- [ ] Trang admin username/password, lỗi credentials/rate-limit; không thêm đăng ký admin.
- [ ] Auth provider/guards, khôi phục sau reload, refresh có điều phối, logout, hết phiên/account disabled.
- [ ] Thêm menu tài khoản/admin cùng thiết kế cũ; không khóa dashboard công khai chỉ vì thêm auth.
- Hoàn tất: hai role độc lập; truy cập API sai role bị từ chối; logout/revocation không tiếp tục hiển thị dữ liệu tài khoản trước.

### M2 — Admin config và danh mục gói

- [ ] Admin shell/menu dùng design tokens hiện có; các trang loading/empty/error/conflict nhất quán.
- [ ] SePay: form bank_code/account_number dạng chuỗi/account_name/prefix/requires_transfer_prefix/payments_enabled; trạng thái key, missing_fields, encryption_ready/source/revision.
- [ ] Vnstock: đặt/thay/xóa key; không có “xem lại key” hoặc “test login” khi BE không cung cấp.
- [ ] Input secret rỗng mặc định = không thay đổi; xóa là hành động riêng gửi null; key mới không tồn tại trong URL/log/storage. Form xóa nội dung secret sau lưu.
- [ ] PATCH integrations gửi các field thay đổi + expected_revision + reason 10–500 ký tự; conflict đọc lại và cho người dùng review, không tự overwrite.
- [ ] OPERATIONS: form typed đúng policy hiện có; so sánh payload -> tạo version -> activate bằng expected_version/reason. Runtime provider gate chỉ đọc, không giả lập toggle thay env.
- [ ] TRADING_CALENDAR: xem/import payload hoặc danh sách phiên có source_urls/review_note/provenance; kiểm unique/sorted/range, preview diff và version mới; rollback bằng activate version cũ.
- [ ] Gói: name, price_vnd 1.000–100.000.000, duration_days 1–366, analysis_quota 1–100.000, active_limit 1–10; features đúng screening=true, analysis=true. Tạo draft rồi bật availability riêng.
- Hoàn tất: lưu cấu hình chưa đồng nghĩa xác minh provider/ngân hàng; không tự bật payments/ingestion khi kiểm thử; không sửa giá gói cũ.

### M3 — Tài khoản và mua gói customer

- [ ] Account hiển thị đúng ID/role, entitlement còn hiệu lực, usage buckets và subscriptions; kỳ tiếp theo tách kỳ hiện tại.
- [ ] Trang plans lấy giá/quota/active_limit từ BE; payments disabled hoặc không có gói có trạng thái rõ.
- [ ] Chọn gói -> review -> tạo order, mỗi ý định mua một Idempotency-Key; cùng request retry giữ key, không tự đổi key sau timeout.
- [ ] Trang đơn hiển thị đúng thông tin được pin trong đơn, kể cả sau khi admin đổi ngân hàng. Copy số tài khoản/số tiền/nội dung; lỗi ảnh QR vẫn còn thông tin chuyển khoản.
- [ ] Poll GET order khi PENDING, backoff/lỗi/ẩn tab, dừng khi PAID/EXPIRED/CANCELLED hoặc mất phiên. Countdown chỉ hỗ trợ hiển thị; status phải xác nhận BE.
- [ ] Hủy đơn và xử lý race đã thanh toán; nút “kiểm tra thanh toán” chỉ GET lại, không gửi webhook hoặc đánh dấu paid.
- [ ] Lịch sử orders/payments phân trang; sau PAID fetch lại entitlement/usage/subscription, không tự cộng quota ở browser.
- Hoàn tất: reload mở lại đơn, double-click không nhân đơn và các trạng thái disabled/unavailable/pending/paid/expired/cancelled đúng contract.

### M4 — Quản lý người dùng và đối soát admin

- [ ] Users list ID/enabled/cursor; chi tiết dùng dữ liệu có thể chứng minh từ page đã tải, subscriptions và jobs có filter account_id. Deep link cần tìm qua cursor hoặc hiển thị chưa tải được, không đoán account tồn tại.
- [ ] Khóa/mở bằng reason 10–500 ký tự; thông báo khóa revoke session, mở lại yêu cầu login mới. Không hứa worker đã dừng ngay chỉ từ response khóa.
- [ ] Payments/subscriptions list theo filter BE hỗ trợ; không dựng ô search toàn hệ thống theo tên/email.
- [ ] Reconciliation: chọn payment cần đối soát, nhập order_id/reason, review trước apply; refresh record sau thành công hoặc conflict. Không có nút “đánh dấu paid” chung.
- [ ] Audit và scheduled tasks: đọc cursor/filter đúng endpoint; không thêm retry/run-now button chưa có API.
- [ ] Jobs tab phục vụ quản lý user; hoàn lượt qua endpoint quota-refund nếu cần trong phạm vi vận hành: reason/evidence/Idempotency-Key và nhãn “Hoàn lượt phân tích”. Không gọi là hoàn tiền.
- Hoàn tất: mutation phản ánh response/audit, conflict không bị ghi đè; quyền customer không mở được các luồng admin.

### M5 — Kiểm chứng tích hợp và bàn giao

- [ ] Typecheck/build; khắc phục hoặc báo riêng lỗi baseline hash glossary trước khi kết luận regression.
- [ ] Focused handler/E2E cho auth/CSRF/roles/refresh, order idempotency + polling/cancel, integrations conflict + secrets, config activate và state user.
- [ ] E2E fixture không chạm ngân hàng/provider thật. Nếu có môi trường test được phép mới kiểm API thật; không tạo đơn thật, bật payments hoặc đổi secrets vận hành chỉ để smoke test.
- [ ] Review desktop/mobile: auth form, menu, account, checkout, bảng admin và form config; giữ đường vào các màn FE cũ.
- [ ] Đối chiếu git diff client và git status server; bàn giao từng milestone, ghi phần nối thật/fixture/blocker.

## Khoảng trống cần comment khi triển khai

| Mã | BE chưa hỗ trợ | Cách xử lý FE |
|---|---|---|
| AUTH-01 | Đăng ký/mật khẩu/reset password customer, email/name/avatar/profile edit; /me chỉ id/role | Chỉ Google login và thông tin account có thật; không lấy email/name từ dữ liệu chưa được BE xác minh |
| USER-01 | Admin tạo/xóa user, sửa hồ sơ/role, đổi mật khẩu, impersonate, tìm theo email, GET user detail hoặc quota customer cho admin | Chỉ list/state và dữ liệu subscriptions/jobs hiện có; không dựng thao tác gửi giả |
| BILL-01 | Thanh toán thẻ, ví, auto-debit, mã giảm giá, hoàn tiền ngân hàng, sửa/xóa gói đã tạo | Chỉ prepaid QR/chuyển khoản, version gói mới và availability; không thêm promise/usecase ngoài BE |
| BILL-02 | GET admin/orders và endpoint admin đọc chi tiết order bất kỳ | Admin tra theo payments/subscriptions/reconciliation; không tự tổng hợp thành danh sách đơn đầy đủ |
| BILL-03 | API FE xác nhận “đã chuyển tiền” làm paid, SSE/websocket thanh toán | Poll trạng thái; chỉ BE settlement cấp gói/quota. Không forward webhook qua proxy browser |
| CFG-01 | Đọc lại secret, test connection, rollback secret, chỉnh Google OAuth/env/master encryption key qua API | Hiển thị trạng thái key, nhập key mới/xóa rõ ràng; cấu hình hạ tầng là điều kiện vận hành riêng |
| CFG-02 | Bật runtime scheduled_provider_enabled qua API, run-now/retry task API | Gate chỉ đọc và ghi lý do; scheduled tasks chỉ xem |
| AUTH-02 | Callback BE tự chuyển về FE | Handler Next riêng; chặn nghiệm thu Google live nếu routing public origin hiện tại chưa đáp ứng |

Đặt comment `BE-GAP AUTH-01`, `BE-GAP BILL-02`... sát phần adapter/nhánh UI liên quan, tham chiếu tài liệu này. Không đưa tên endpoint hoặc chi tiết kỹ thuật vào giao diện người dùng khi không cần thiết.

## Cách chia phần review

1. Nền API + auth (M0–M1).
2. Admin shell + integration config + gói; operations/calendar là phần review riêng trong M2.
3. Account + mua gói + lịch sử (M3).
4. Users + đối soát + audit/tasks (M4).
5. Bằng chứng kiểm chứng và danh sách GAP còn lại (M5).

Đây là kế hoạch thi công, chưa phải bằng chứng các màn hoặc tích hợp đã được triển khai.
