# Triển khai tài khoản và thương mại — 16/10/2026

## Tạm nghiệm thu

Ngày16/10/2026, chủ sản phẩm xác nhận tạm nghiệm thu phần thanh toán và quản lý tài khoản đã triển khai. Mốc source: FE `b21ace7` và `87a71d2`; BE `f502727`. Xác nhận này không thay đổi các giới hạn kiểm chứng/nghiệm thu ngân hàng thật ghi bên dưới; email hỗ trợ vẫn là dữ liệu minh họa.

## Chính sách đã chốt

- Gói có thời hạn; giới hạn số yêu cầu tạo thành công mỗi ngày, reset00:00 Asia/Ho_Chi_Minh. Trường BE `analysis_quota` giữ tương thích nhưng mang cùng ý nghĩa với `daily_request_limit`.
- Retry cùng yêu cầu không tính thêm. Không có usecase hủy phân tích hoặc hoàn lượt. Kết thúc lỗi vẫn tính số yêu cầu đã tiếp nhận; worker giải phóng reservation không khôi phục hạn mức ngày.
- Mua tiếp nối sau các kỳ đã mua; giới hạn ngày được dùng xuyên suốt thời hạn, không có tổng lượt hết giữa tháng.
- Mọi webhook nhận sau hạn đơn phải vào đối soát, kể cả thời điểm chuyển tiền trước hạn. Không tự công nhận thanh toán trễ. Không hoàn tiền.
- Google login vẫn về dashboard; có lời nhắc tiếp tục mua, không tự tạo đơn sau login.

## Đã triển khai từ báo cáo rà soát

| Phát hiện | Kết quả |
|---|---|
| F01/F03/F04 | Ngừng bán vẫn tiếp nhận webhook xác thực. Đơn trả trạng thái giao dịch cần đối soát; ẩn QR, hướng dẫn không chuyển thêm, giữ mã tham chiếu và tiếp tục cập nhật. Không cho hủy đơn đã nhận tiền cần xử lý. |
| F02/F10/F16 | Chuyển quyền lợi sang hạn mức ngày; checkout hiển thị gói đã mua, giới hạn, thời hạn và kỳ hiệu lực dự kiến/thực tế. Account tóm tắt gói hiện tại, hạn mức hôm nay và kỳ tiếp theo; lịch sử ngày/kỳ thu gọn riêng. |
| F05/F06 | Tạo gói admin có idempotency và giữ key khi mất phản hồi. Mua cùng gói tiếp tục đơn còn hạn; retry key vẫn trả đúng đơn kể cả đã trả tiền. API có `new_order=true` cho lần mua riêng có chủ đích. |
| F07/F08 | Giữ ý định mua gói/đơn qua login và đồng bộ phiên Google giữa các tab, bỏ dữ liệu phiên cũ trước khi tải tài khoản mới. |
| F09/F11 | Admin tìm người dùng theo tên/email/ID; BE hỗ trợ trạng thái tài khoản. Lịch sử dùng cursor thời gian+ID mới nhất trước. |
| F12/F13 | Checkout dùng `server_now`, tự retry GET đầu tiên khi mạng/5xx có giới hạn; dừng tự retry ở401/403/404. Poll tạm dừng khi ẩn tab, cập nhật khi quay lại. Không tự replay mutation ngoài cơ chế idempotency sẵn có. |
| F14/F15 | Bản sao gói tham chiếu bản bị thay thế; xác nhận mở bản mới sẽ đóng bản cũ trong một transaction. Cấu hình hiển thị số đơn chờ, số đối soát và lần nhận giao dịch cuối; không xóa khóa webhook khi còn việc phải xử lý. |
| F17/F18 | Menu tài khoản/đăng xuất ở mọi trang; đơn admin giữ bộ lọc, cursor và đơn được chọn trong URL, focus chi tiết. Lỗi validation hiện trường cần sửa; form gói/cấu hình cảnh báo khi bỏ thay đổi chưa lưu. |

API hủy phân tích và admin hoàn lượt đã gỡ. Hủy **đơn chưa trả tiền** vẫn giữ, có kiểm tra giao dịch và tranh chấp trạng thái ở BE. Bảng lịch sử refund cũ không bị xóa.

## Kiểm chứng

- FE: production build và typecheck đạt;18test Node về proxy/session đạt. Bộ giao diện58ca desktop/mobile có56ca đạt lượt đầu;2ca còn lại do bộ chọn email trùng đã sửa và chạy lại đạt. Thêm2ca desktop/mobile kiểm GET đơn lỗi đầu và lệch đồng hồ server đều đạt; tổng60ca đã kiểm chứng.
- BE:9test trọng yếu thuộc billing/jobs/admin/auth/integrations/snapshots đạt sau cập nhật kỳ vọng bảo vệ khóa webhook409. Có kiểm idempotency, reset ngày, giới hạn đồng thời qua nửa đêm, thay phiên bản và endpoint đã gỡ.
- Migration0015 diễn tập trên bản sao DB có dữ liệu, giữ số dòng và kiểm tra khóa ngoại. DB local đã backup rồi migrate; `/health/ready` trả schema0015.
- API local và trang `/plans` trả/hiện gói cơ bản100.000đ/30ngày,20yêu cầu/ngày. Trang admin ẩn menu khi chưa xác thực. Không tạo đơn hoặc giao dịch giả vào DB vận hành để kiểm thử.
- Đăng nhập admin thật, đọc người dùng/gói/đơn/cấu hình và đăng xuất trên desktop1440px/mobile390px đều đạt, không lỗi JavaScript hoặc tràn ngang. Kiểm tra chỉ đọc dữ liệu nghiệp vụ, không đổi giá/gói/cấu hình để làm test.

## Phần cần cấu hình/nghiệm thu thật

- `QUANTIK_SUPPORT_URL` trong FE server nhận HTTPS hoặc mailto để hiển thị kênh hỗ trợ đối soát. Theo yêu cầu mock của chủ sản phẩm, khi chưa cấu hình sẽ hiện `support@quantik.example` với nhãn “email minh họa”. Đây chưa phải hộp thư hỗ trợ thực tế; thay biến môi trường khi có kênh thật.
- Chưa nghiệm thu chuyển khoản ngân hàng thật, webhook public, độ trễ thực tế và thao tác đối soát thực với tiền thật. Bộ test dùng DB tạm và API fixtures cho các tình huống thanh toán.
- Schema0015 phải chạy trước BE mới. Các phiên bản gói đang có giữ số hạn mức cũ và diễn giải theo ngày; gói cơ bản hiện là20/ngày. Admin cần kiểm duyệt giá/hạn mức trước mở bán thực tế.
