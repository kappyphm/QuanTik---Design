# Tailwind và bố cục đăng nhập

## UI

- Toàn bộ component có style trong `frontend/src` dùng utility Tailwind v4: landing, dashboard, screener, Quant/chart, tooltip, tài khoản, checkout và admin.
- Các class tĩnh chứa utility ngay trong TSX. `lib/tailwind.ts` / `lib/ui-classes.ts` giữ các variant dùng lại cho trạng thái động và wrapper Panel/Modal; các tên hook cũ còn lại phục vụ selector có điều kiện và test, không có stylesheet component tương ứng.
- Đã bỏ `home.css` và stylesheet tài khoản riêng. `globals.css` chỉ giữ import Tailwind, design tokens, theme sáng/tối, reset nền. Fontsource và KaTeX tiếp tục dùng stylesheet chính thức của thư viện.
- Responsive dùng `max-[...px]` / `min-[...px]`, trạng thái motion dùng `motion-reduce`, trạng thái focus/hover và descendant dùng variant Tailwind.
- Chỉ còn inline style tính từ số liệu thực thi: vị trí tooltip, độ rộng xác suất, chiều cao/góc cột 3D. Không dùng inline style cho layout tĩnh.
- Khi bổ sung UI, viết utility trực tiếp hoặc tái sử dụng variant; không thêm CSS component vào globals.

## Đăng nhập và điều hướng

- CTA trang chủ là **Đăng nhập hệ thống**, mở `/login` riêng, không có sidebar/topbar workspace.
- Sau Google exchange, callback Next redirect `/dashboard`. Người đã có phiên vào `/login` cũng về dashboard.
- Giao diện khách hàng không có liên kết vào admin, kể cả màn đăng nhập.
- `/admin` và mọi URL con khi chưa xác thực chỉ render form admin login riêng; không gửi/render phần nội dung quản trị hoặc menu.
- Sau admin login/refresh thành công, proxy đặt cookie access ngắn hạn HttpOnly, SameSite Strict, scope `/admin`. Cookie dùng cho page gate server-side; không đọc được từ JS. API access phía client vẫn dùng bearer trong bộ nhớ, refresh giữ nguyên contract BE.
- Page gate không tin sự tồn tại hoặc role decode từ cookie: mỗi server request kiểm lại qua BE `/admin/me` (signature/role/session revocation). Cookie giả, user token, expired/revoked token, BE unavailable đều không được render menu.
- Client boundary tiếp tục ẩn toàn bộ shell khi phiên mất hiệu lực/logout trong lúc điều hướng. Guard ở API vẫn do BE thực thi.
- Server gate này bổ sung cho bảo vệ API đã có; không dùng việc giấu link làm cơ chế phân quyền.

## Hồ sơ người dùng — ngoại lệ BE được người dùng cho phép

- Backend branch `feat/google-profile`: migration `0014` bổ sung `display_name`, `email` nullable; `/me` trả hai trường này.
- Google flow xin `openid email profile`; tên/email chỉ lấy từ ID token đã kiểm chữ ký, issuer, audience, nonce. Email chỉ lưu nếu `email_verified` là boolean true; không nhận tên/email do browser tự gửi.
- Identity vẫn theo Google sub; đăng nhập lại cập nhật hồ sơ cùng account, không tạo account theo email.
- Tài khoản cũ cần đăng xuất rồi đăng nhập Google lại để nhận profile; không điền dữ liệu giả hoặc suy tên từ ID/email.
- Trước migrate local đã tạo backup SQLite `runtime/backups/pre-google-profile-0014-728f1ad4.sqlite`; runtime đã restart với schema `0014` và public origin 3000 như trước. Không thay đổi nghiệp vụ jobs/billing/config.

## Kiểm tra

- Backend focused checks: Google profile đã ký, scope profile, cùng sub cập nhật tên, không nhận email chưa xác minh; admin auth — 2 tests đạt.
- Node checks gồm gate từ chối cookie giả, role customer, revoked token; callback về dashboard.
- E2E dùng upstream riêng cho kiểm SSR admin và browser API fixture cho nghiệp vụ; không reuse server vận hành. Có kiểm URL admin trực tiếp, không JavaScript, form độc lập, profile name/email và không có link admin ở customer.
- Build production và typecheck đạt; Node checks 18/18, E2E 42/42 desktop/mobile đạt sau chuyển đổi cuối cùng. Đã rà ảnh dashboard, form admin chưa đăng nhập và config mobile sáng/tối; globals audit không còn rule CSS bố cục/component, chỉ tokens/reset.
