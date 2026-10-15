# Thanh toán và quản lý gói

Triển khai trên nhánh FE feat/backend-alignment. Không thay đổi backend cho đợt này.

## Luồng vận hành

1. Admin vào /admin/config/integrations, cấu hình SePay: ngân hàng, số tài khoản, chủ tài khoản, webhook API key và tiền tố chuyển khoản nếu ngân hàng yêu cầu. Form giữ kiểm tra revision và review trước khi lưu.
2. Cấu hình phía SePay gửi giao dịch đến địa chỉ HTTPS công khai của backend tại /api/v1/webhooks/sepay, dùng Authorization: Apikey <key đã cấu hình>. Reverse proxy cần chuyển riêng endpoint này đến BE. Proxy browser của Next không cho phép webhook. Localhost không phải địa chỉ công khai để SePay gọi tới.
3. Tại /admin/plans, tạo gói hoặc sao chép từ gói có sẵn, chỉnh tên/giá/thời hạn/lượt/giới hạn đồng thời, xem lại và xác nhận. Phiên bản mới mặc định đóng bán. Mở bán sau khi kiểm tra quyền lợi. Chỉnh giá/quota bằng phiên bản mới; không sửa quyền lợi đơn cũ.
4. Khi cấu hình nhận tiền và webhook đã sẵn sàng, bật thanh toán trong cấu hình SePay. /plans đọc trạng thái mở thanh toán và danh mục từ BE.
5. Khách chọn gói, xác nhận đơn và chuyển khoản đúng số tiền/nội dung trên đơn. FE giữ Idempotency-Key qua retry, polling trạng thái BE và dừng hướng dẫn chuyển tiền sau hạn thanh toán.
6. BE nhận webhook, đối chiếu ngân hàng/tài khoản/số tiền/tham chiếu và thời hạn. Chỉ BE xác nhận PAID và cấp quota. Giao dịch trùng không cấp hai lần. Mua tiếp nối kỳ hiện có, không cộng lượt kỳ sau vào kỳ đang dùng.
7. Trang đơn PAID tải entitlement thật, báo lỗi tải riêng nếu cần thử lại. /account hiển thị các kỳ đang hiệu lực/sắp tới/đã kết thúc; orders/payments lưu lịch sử.
8. Giao dịch lệch hoặc đến muộn được theo dõi tại /admin/reconciliation. Admin nhập mã đơn và lý do, review số tiền/giao dịch/đơn trước khi áp dụng. BE vẫn kiểm tra điều kiện; FE không có thao tác tự đánh dấu đơn đã trả tiền.

## Giới hạn hợp đồng BE

- BE-GAP BILL-02: chưa có danh sách đơn hàng toàn hệ thống hoặc đọc chi tiết đơn bất kỳ cho admin. Dùng payments/subscriptions/reconciliation theo API hiện tại.
- BE-GAP BILL-03: chưa có API hoàn tiền ngân hàng, chiết khấu/mã giảm giá, đổi/hủy kỳ gói thủ công, prorate hay tự động trừ tiền định kỳ. Không dựng thao tác giả. Nút hủy đơn chỉ áp dụng đơn chưa thanh toán.
- Tạo gói admin chưa có Idempotency-Key trong BE. Nếu mạng lỗi khi tạo phiên bản, cập nhật danh mục để kiểm tra trước khi tạo lại.

## Trạng thái môi trường kiểm tra

GET /api/v1/plans trên BE local trả payments_enabled=false, items=[]. Chưa bật thanh toán, tạo gói vận hành hay chuyển tiền thật trong đợt này. API key/ngân hàng và địa chỉ webhook công khai phải được vận hành cấu hình để nghiệm thu SePay thật.

Kiểm chứng tự động dùng dữ liệu riêng: kiểm thử backend với DB tạm bao phủ webhook trùng, sai tiền/tài khoản, nối kỳ, thu hồi mở bán, hủy đơn, đối soát đến muộn và rollback cấp quyền. Playwright bao phủ mua/retry/poll PAID, tạo/mở bán phiên bản, hạn chuyển khoản, kỳ sử dụng, hủy đơn và đối soát trên desktop/mobile.

Kết quả đợt này: production build và typecheck đạt; Node 18/18; Playwright account/admin 32/32 (desktop/mobile); backend test_billing.py 1/1 đạt trên DB tạm. Đã sửa lỗi revision của bảng không kích hoạt tải lại sau mutation. Ảnh kiểm tra nằm trong frontend/test-results/billing/.
