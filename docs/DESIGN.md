# Giao diện QuanTik

## Gốc thiết kế

Giữ Home cũ nguyên vẹn. Terminal dùng nền xanh đen của bản QuanTik hiện tại, điểm nhấn cam và màu giá theo bảng điện chứng khoán. Inter cho nội dung/menu, IBM Plex Mono cho mã và số.

| Thành phần | Cỡ chữ |
| --- | --- |
| Tiêu đề trang | 30–32px |
| Tiêu đề nhóm | 18–20px |
| Nội dung | 15–16px |
| Nhãn/điều khiển | 14px |
| Số trong bảng điện | 14px |
| Nhãn cột bảng điện | 13px |

Không thêm slogan, eyebrow, ghi chú kỹ thuật lặp lại, điểm tổng hợp tự tạo hoặc thẻ chi tiết FPT dưới bảng.

## Luồng và bố cục

Menu chỉ gồm Dashboard, Quét toàn sàn, Phân tích Quant. Home vẫn mở từ logo và liên kết Trang chủ.

Dashboard xếp dọc: bốn chỉ số → bảng điện → nhóm ngành. Theo dõi là tab trong bảng. Bộ lọc ngành và sàn dùng chung một bảng. Ba mức giá, thống kê và nước ngoài có điều khiển bật/tắt.

Bấm mã mở dialog chart. Chart mặc định TradingView thật; Quant nằm bên cạnh, có nút mở/thu và mở toàn màn hình. Nguồn Quantik có vùng hiển thị để nối dữ liệu sau. Trên màn hình hẹp, Quant chuyển xuống dưới chart; các bảng cuộn ngang trong vùng riêng.

Quét toàn sàn có 5 mã mỗi nhóm, dữ liệu mẫu từ file tham chiếu. Giải thích và bảng chỉ tiêu mở/thu bằng details. Không dựng bộ nạp dữ liệu, loop hoặc thuật toán xếp hạng. Chỉ tiêu chia theo hiệu suất, mô hình, lợi nhuận/chi phí, rủi ro T+2, dữ liệu/thanh khoản và kế hoạch. Không tự tạo trọng số %.

Phân tích Quant có ô nhập mã, bước xem tiêu chí trước khi chạy và vùng kết quả. Nút chạy cuối cùng để trạng thái chưa kết nối. Không giả tiến trình chạy hoặc kết quả mới. Mẫu Excel giữ rõ ngày và nhãn công bố.

## Truy cập

Dùng label cho điều khiển, aria-pressed cho trạng thái mở/thu, dialog native cho chart và bước xem trước. Escape đóng dialog, khôi phục focus về nút mở. Theme và Theo dõi lưu trên thiết bị. Màu luôn đi cùng số hoặc nhãn. Tôn trọng reduced motion.
