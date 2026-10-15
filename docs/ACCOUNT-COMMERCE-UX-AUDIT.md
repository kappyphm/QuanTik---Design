# Rà soát luồng tài khoản và thương mại — 15/10/2026

Phạm vi: đăng nhập Google/admin, session/guard/proxy/callback, hồ sơ, quản lý người dùng, danh mục và phiên bản gói, tạo đơn/checkout/polling, lịch sử, kỳ gói, giao dịch và đối soát. Đối chiếu source FE/BE và API local; không thêm hoàn tiền, không sửa source BE trong đợt này.

## Các lỗi/thiết kế đã sửa

| Mức | Điểm phát hiện | Cách xử lý |
|---|---|---|
| P1 | Trang admin có thể quay lại login khi access gate ngắn hạn mất/hết hạn dù phiên refresh còn hợp lệ | Phục hồi gate một lần qua refresh, server xác minh lại trước khi hiện bất kỳ nội dung admin nào; lỗi có đường thử lại, không redirect vòng lặp |
| P1 | Thông báo đăng nhập từ tab khác làm tab hiện tại quên phiên mà không tải lại | Phân biệt sự kiện login/logout, login tải lại hồ sơ và token; logout tiếp tục thu hồi giao diện cũ |
| P1 | Đối soát coi HTTP200 là đã cấp gói, kể cả response còn RECONCILIATION | Chỉ báo thành công khi status=APPLIED; giữ lỗi/record khi chưa áp dụng |
| P1 | Đối soát chỉ review UUID, thiếu khách/gói và so sánh tiền | Đọc chi tiết đơn admin để preview khách/gói/tham chiếu/số tiền, chặn xác nhận khi chưa tải được hoặc số tiền/trạng thái không phù hợp; BE vẫn quyết định cuối |
| P1 | Poll lỗi nhưng checkout tiếp tục hiện QR/nội dung chuyển tiền cũ | Tạm ẩn hướng dẫn chuyển tiền, giữ lỗi đến lần đọc thành công và tự thử lại; hướng dẫn không chuyển thêm nếu đã chuyển |
| P2 | Chọn gói phải xác nhận thêm dù mới tạo đơn, chưa trừ tiền | Một nút Tiếp tục thanh toán tạo đơn rồi mở checkout; giữ Idempotency-Key khi retry, bỏ key trong bộ nhớ sau thành công |
| P2 | Hiện Đăng nhập để mua trong lúc phiên đang tải hoặc kết nối lỗi | Tách rõ loading/error/anonymous; có retry kết nối, không gợi ý sai trạng thái |
| P2 | Danh mục có nút cập nhật thường trực dù đã tự tải khi mở/quay lại tab | Bỏ nút; chỉ giữ tải lại khi có lỗi |
| P2 | Thanh toán nháy Đang tải mỗi5giây; timer vẫn chạy sau khi kết thúc | Loading chỉ hiện lúc chưa có dữ liệu; timer đếm ngược chỉ chạy khi PENDING |
| P2 | Khách nhìn thấy trạng thái/lý do giao dịch dạng mã kỹ thuật | Đổi nhãn thanh toán/lý do sang tiếng Việt; bỏ filter IGNORED không được implementation hiện tại tạo ra |
| P2 | Hủy sau khi đã chuyển tiền dễ dẫn tới phải đối soát | Nêu rõ chỉ hủy khi chưa chuyển; đã chuyển thì chờ xác nhận. Vẫn giữ xác nhận hủy vì có thay đổi trạng thái thật |
| P2 | Có thể đổi người đang quản lý trong lúc xác nhận khóa/mở | Khóa chọn người khác khi đang review hoặc gửi mutation |
| P2 | Xác nhận nằm dưới nội dung dài, người dùng không thấy bước tiếp theo | Đưa focus và cuộn đến vùng review khi nó xuất hiện |
| P2 | Tải lại cấu hình có thể bỏ thay đổi ngân hàng nếu chưa nhập lý do | Phát hiện thay đổi từng trường để hỏi trước khi bỏ bản nháp |

## Những điểm còn tồn tại

| Mức | Điểm còn thiếu | Bằng chứng và hướng xử lý |
|---|---|---|
| P1 | Admin nhận biết/tìm người dùng quá khó | GET admin/users thật chỉ trả id/enabled. Bổ sung display_name/email đã xác minh và tìm kiếm có phân trang ở BE; FE phải dùng dữ liệu này, không tự thu gom hồ sơ từ đơn hàng |
| P1 | Đơn/kỳ gói của khách thiếu tên gói/quyền lợi đã mua | Customer order_view trả plan_id; subscription chỉ có các ID và mốc kỳ. Bổ sung metadata từ PlanVersion được đơn/kỳ tham chiếu, gồm cả phiên bản đã đóng bán. Không dùng danh mục công khai để đoán tên gói cũ |
| P1 | Tạo gói admin có thể trùng nếu mất phản hồi rồi gửi lại | POST admin/plans chưa có Idempotency-Key. Cần thêm cơ chế idempotency BE cho tạo phiên bản; FE busy chỉ chặn double-click, không giải quyết mất phản hồi |
| P2 | Account dồn thông tin tài khoản, quota, bucket và kỳ mua thành nhiều vùng | Đề xuất phần chính giữ hồ sơ/gói hiện tại/lượt còn lại; lịch sử sử dụng và các kỳ mua thành vùng chi tiết. Chưa tự đổi bố cục lớn trong lần audit |
| P2 | Đăng xuất admin chỉ dễ tìm ở trang tổng quan | Đề xuất thao tác tài khoản/đăng xuất nhất quán trên mọi trang admin. Chưa thay đổi điều hướng trong lần audit |

Các mở rộng BE trên chưa nằm trong ngoại lệ đã duyệt (hồ sơ Google và admin đọc đơn); không tự triển khai thay đổi đó.

## Những cơ chế giữ lại có lý do

- Google login xong vào dashboard theo yêu cầu; customer không có lối vào admin; admin không có phiên chỉ hiện form độc lập.
- Backend xác minh role/session; server guard không tin sự tồn tại đơn thuần của cookie. Proxy kiểm origin, method/path và tách cookie theo vai trò.
- Xác nhận mở/đóng bán, khóa/mở tài khoản, thay khóa tích hợp và đối soát: đây là thay đổi trạng thái/quyền/nhận tiền thật. Bỏ xác nhận tạo đơn không đồng nghĩa bỏ các kiểm tra này.
- Giá/quota đã mua gắn phiên bản bất biến. Đổi giá bằng phiên bản mới; mua tiếp nối kỳ theo BE. Không tự cộng quota ở browser.
- Hủy đơn chưa thanh toán và hoàn lượt phân tích có sẵn là nghiệp vụ riêng; không triển khai hoàn tiền ngân hàng.
- Chỉ coi PAID/APPLIED do BE trả là xác nhận thanh toán. FE không có nút tự đánh dấu đã trả tiền.

## Kiểm chứng và giới hạn

- API local qua Next trả200 cho users/plans/orders/payments/subscriptions/reconciliation và cấu hình SePay. Users thực tế chỉ có id/enabled; có1gói và1đơn, chưa có payment/subscription/reconciliation. Không tạo dữ liệu thu tiền để audit.
- Browser thật: đăng nhập admin bằng tài khoản local hiện có, mở7màn nhóm trên rồi đăng xuất thành công; không có lỗi JavaScript. Không đổi cấu hình/khóa người dùng/mở đóng bán khi kiểm lần này.
- Browser thử nghiệm riêng: mua/retry/poll, loading phiên, refresh gate, mất kết nối checkout, đối soát chưa APPLIED, guard và các flow admin/customer trên desktop/mobile. Fixture kiểm các trạng thái chưa có dữ liệu live; không thay thế nghiệm thu ngân hàng.
- Chưa nghiệm thu webhook SePay với giao dịch ngân hàng thật hoặc consent Google mới trong đợt này.

Kết quả kiểm chứng cuối: build/typecheck đạt, Node18/18. Playwright24kịch bản chạy trên desktop/mobile (48ca): lượt đầy đủ46ca có44đạt và2lỗi locator alert trùng với route-announcer; sau sửa locator,2ca đó đạt. Bổ sung kiểm tra đồng bộ tab,2ca mới đạt. Không còn lỗi behavior được tái hiện trong nhóm kiểm thử này.
