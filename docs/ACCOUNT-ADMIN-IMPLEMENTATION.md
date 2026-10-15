# Bàn giao FE: tài khoản, thanh toán và quản trị

Nhánh FE `feat/backend-alignment`. Sau yêu cầu bổ sung hồ sơ, người dùng cho phép ngoại lệ BE trên nhánh `feat/google-profile`: lưu tên/email Google đã xác minh, `/me` và migration `0014`. Các nghiệp vụ BE khác giữ nguyên. Xem [Tailwind và bảo vệ trang admin](TAILWIND-AND-ACCESS.md) cho các cập nhật mới nhất.

## Các màn đã bổ sung

| Đường dẫn | Nội dung |
|---|---|
| `/login` | Đăng nhập Google, lỗi callback và liên kết tài khoản |
| `/admin/login` | Username/password admin, lỗi xác thực và hạn mức đăng nhập |
| `/account` | Tên/email Google đã xác minh, entitlement, quota theo kỳ, subscriptions, logout |
| `/plans` | Gói đang bán, trạng thái mở thanh toán, xác nhận tạo đơn |
| `/orders/{id}` | QR/thông tin nhận tiền được pin trong đơn, copy nội dung, đếm ngược, polling, hủy, trạng thái paid/expired/cancelled |
| `/account/orders`, `/account/payments` | Lịch sử có phân trang, mở lại đơn |
| `/admin` | Menu quản trị, thông tin phiên và logout riêng |
| `/admin/users` | Danh sách ID/trạng thái; quản lý ngay trong trang: khóa/mở có lý do, tra jobs/subscriptions của tài khoản đã chọn |
| `/admin/plans` | Tạo phiên bản gói mới và bật/tắt mở bán |
| `/admin/payments`, `/admin/subscriptions` | Danh sách giao dịch/kỳ gói |
| `/admin/reconciliation` | Review và ghép payment với order_id, xử lý conflict |
| `/admin/jobs` | Tra cứu yêu cầu và hoàn lượt vào kỳ gốc, reason/evidence/idempotency |
| `/admin/config/integrations` | SePay/Vnstock, trạng thái key, revision, encrypted-config readiness, thay/xóa key, bật/tắt thanh toán có xác nhận |
| `/admin/config/operations` | Policy có schema fields, lưu version, xem nội dung và activate với expected_version/reason |
| `/admin/config/calendar` | Nhập JSON/file lịch có nguồn, kiểm ngày/session, tạo version và activate/rollback bằng version cũ |
| `/admin/scheduled-tasks`, `/admin/audit` | Theo dõi tác vụ và nhật ký với filter/cursor |

Giữ dashboard/screener/Quant/chart và các fixture trước đó. Các màn nghiệp vụ mới gọi API, không fallback sang mock; E2E fixture được định nghĩa riêng trong test.

## Kết nối local và triển khai

Next đọc cấu hình server-side từ `frontend/.env.local` (hoặc biến môi trường khi deploy). Mẫu tại `frontend/.env.example`; không ghi đè file cấu hình đang có.

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `QUANTIK_API_URL` | `http://127.0.0.1:8000` | Địa chỉ upstream BE; không dùng NEXT_PUBLIC |
| `QUANTIK_UPSTREAM_ORIGIN` | `http://localhost:8000` | Phải khớp QUANTIK_PUBLIC_ORIGIN hiện có của BE cho exchange/refresh/logout |
| `QUANTIK_APP_ORIGIN` | Origin của request Next khi không đặt | Public origin của FE để kiểm CSRF; nên đặt explicit khi deploy, ví dụ `http://localhost:3000` local |

Chạy Next theo README. Nếu QUANTIK_APP_ORIGIN đặt localhost thì truy cập bằng localhost, không trộn 127.0.0.1. Production dùng HTTPS, cookie Secure và upstream được tin cậy.

Google callback cần public origin đang được BE/Google dùng route `/api/v1/auth/google/callback` qua Next handler. Handler forward browser-bound cookie/state/code tới BE callback, exchange server-side, chuyển Set-Cookie và redirect `/dashboard`. JWT/exchange code không nằm trong URL hoặc localStorage. Access được lấy lại bằng refresh sau redirect.

Runtime local đã được đồng bộ sau khi gặp mismatch: BE vẫn listen 8000 nhưng chạy với biến môi trường process `QUANTIK_PUBLIC_ORIGIN=http://localhost:3000` (không sửa `.env`/source BE); `frontend/.env.local` đặt API_URL=127.0.0.1:8000, UPSTREAM_ORIGIN=localhost:3000 và APP_ORIGIN=localhost:3000. Start API đã trả redirect_uri cổng 3000, proxy refresh không cookie trả 401 thay vì INVALID_ORIGIN, callback Next thiếu state/code redirect về login trên 3000. Google Console vẫn phải cho phép đúng URI `http://localhost:3000/api/v1/auth/google/callback` của cùng Client ID. Nếu khởi động lại BE bằng lệnh cũ không override origin thì sẽ quay lại callback 8000.

Nếu Google đang redirect thẳng tới BE ở localhost:8000 thì callback vẫn trả JSON như trước; FE không thể tự sửa Google Console hoặc QUANTIK_PUBLIC_ORIGIN của BE. Cần thiết lập routing/OAuth tương ứng ngoài phạm vi code FE trước khi nghiệm thu live. Không đổi redirect_uri trong URL Google đơn phương vì BE xác minh URI lúc exchange.

Không tạo admin account, credentials, gói thật hoặc giao dịch thật để test. Dùng tài khoản và runtime đã được vận hành cấp khi kiểm live. Tắt/mở thanh toán hoặc đổi secret trong UI là thao tác thật khi nối BE thật.

## Cơ chế và giới hạn

- Proxy chỉ cho phép các method/path của nhóm này; không mở webhook hoặc internal metrics cho browser. Kiểm own-origin trước mutation và chỉ chuyển tiếp cookie thuộc role.
- Customer access và API bearer phía client giữ trong bộ nhớ; refresh HttpOnly giữ contract BE. Admin thêm access cookie HttpOnly ngắn hạn scope `/admin` để server kiểm lại `/admin/me` trước khi render trang/menu. Web Locks điều phối refresh giữa các tab; BroadcastChannel thu hồi state khi login/logout. Backend vẫn quyết định quyền và revocation.
- Session invalidation chặn refresh trả về muộn làm sống lại state cũ. Guard unmount view riêng tư; không cache chung tài khoản. Logout báo lỗi nếu BE chưa xác nhận, không tuyên bố đã revoke từ phía server khi mạng lỗi.
- Tạo đơn giữ Idempotency-Key qua retry; metadata key lưu sessionStorage theo account/plan để tránh nhân đơn nếu reload sau timeout. Không lưu token, report hoặc secret vào storage. Thành công thì xóa key intent.
- Poll order có backoff, giảm khi tab ẩn, dừng ở trạng thái terminal. Hạn đếm ngược chỉ hiển thị; trạng thái và quyền/quota do BE trả.
- Admin mutation yêu cầu review; integrations có revision; config activate có expected_version. Conflict không tự retry ghi đè.
- Secret không đọc lại hoặc điền placeholder như secret thật. Bỏ field = giữ, null = xóa; nội dung nhập được xóa sau khi lưu/thất bại. Không có test-connection API.
- Bình luận BE-GAP đặt tại các phần chưa có backend: sửa hồ sơ/email search admin, admin global orders, chỉnh runtime gate và retry task. Không dựng nút gọi endpoint chưa có. Hồ sơ customer đã được bổ sung theo ngoại lệ được duyệt.
- User detail đặt inline trong `/admin/users` thay vì route detail giả khi BE không có GET user detail. Không tự tính quota của user từ subscriptions ở admin.
- Lịch calendar nhập dữ liệu có nguồn do người vận hành cung cấp; FE kiểm cấu trúc cơ bản và BE kiểm schema cuối. Không tự tạo lịch giao dịch tương lai.

## Kiểm chứng

- Production build và TypeScript đạt trên phần thay đổi. Thay đổi next-env.d.ts có sẵn được khôi phục đúng trạng thái ban đầu sau build; typecheck kiểm lại đạt.
- Đợt Tailwind/access: Node checks 18/18 đạt; toàn bộ E2E 42/42 đạt desktop/mobile. Có kiểm SSR không JavaScript, URL admin con, cookie giả, logout ẩn menu, tên/email fixture và customer login về dashboard. Backend focused auth/profile 2/2 đạt với JWT ký thật từ fixture.
- Node tests kiểm allowlist/Origin/cookie isolation/Set-Cookie, callback exchange, failure paths, refresh single-flight/role boundaries/stale response và không replay mutation sau network error.
- Playwright `account-admin.spec.ts` kiểm bằng API fixture, không gọi Google/SePay hoặc BE vận hành. Bao gồm retry order cùng key, reload/poll PAID, admin login/logout, user state, integrations/config conflicts và giới hạn role.
- Test pin glossary giữ hash cũ nhưng chuẩn hóa CRLF -> LF trước hash, vì Git Windows đổi newline; dữ liệu glossary không sửa.
- Các bài E2E có screenshot fixture dark/light dưới `frontend/test-results/account-admin/{desktop,mobile}/` sau khi chạy smoke preview.
- Chưa có xác minh live Google consent, bank webhook/VA/QR settlement hoặc môi trường deploy. Lần đầu kiểm chưa có BE; sau yêu cầu khởi động của người dùng, đã chạy Uvicorn từ quantik-server bằng shared venv, giữ nguyên source/config/DB schema `0013` và keys có sẵn. `GET 127.0.0.1:8000/health/ready` trả 200 ready; không migrate/seed hoặc dùng database Docker cũ.
- Kiểm với BE thật qua FE `localhost:3000`: admin login/me/refresh/logout đạt; mở 11 màn users/plans/payments/subscriptions/reconciliation/integrations/operations/calendar/jobs/audit/scheduled-tasks, tất cả dữ liệu tải 200, không có lỗi JavaScript hoặc thông báo lỗi màn. Không đổi config/key, bật thanh toán hoặc tạo giao dịch để smoke test.
- Probe thật: plans trả 200 với payments_enabled=false và danh sách gói rỗng; me/admin-me không có phiên trả 401; mutation sai Origin trả 403. Google start trả 200, nhưng redirect_uri hiện là `http://localhost:8000/api/v1/auth/google/callback`, chưa route qua Next; chưa nghiệm thu vòng Google consent/exchange trong browser.
- Rà ảnh preview fixture desktop dark và mobile light: form, label và các vùng dữ liệu nằm trong viewport; navigation admin có vùng cuộn riêng. Ảnh không phải bằng chứng cấu hình/ngân hàng thật.

Lệnh kiểm tra:

```powershell
npm test
npm run build
# Chạy từ frontend, cổng riêng để không reuse server của người dùng:
$env:PLAYWRIGHT_PORT = '3107'
npx playwright test tests/account-admin.spec.ts --workers=2
```

`PLAYWRIGHT_PORT` chỉ cấu hình cổng server kiểm thử; không thay cổng runtime của FE/BE. Không chạy build đồng thời với production start dùng cùng `.next`.

## Hoàn thiện thanh toán và gói

Xem [vận hành thanh toán](BILLING-OPERATIONS.md). Bổ sung sao chép phiên bản gói, trạng thái kỳ hiện tại/sắp tới/đã kết thúc, entitlement sau PAID, ẩn hướng dẫn chuyển tiền khi hết hạn; sửa refresh bảng sau tạo/mở bán/đối soát. Kiểm chứng đợt này: build/typecheck, 18 Node, 32 Playwright account/admin và test backend billing trên DB tạm đều đạt. Không đổi source backend, không bật thanh toán hoặc tạo gói vận hành.
