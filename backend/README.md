# Mock JSON cho vỏ giao diện

Thư mục này không chứa backend thực thi.

| File | Nội dung |
| --- | --- |
| `mock/market.json` | Snapshot mẫu đọc từ bảng điện và bảng ngành của QuanTik; nguồn và thời điểm đọc nằm trong JSON |
| `mock/scan.json` | Mẫu kết quả, lý do và các chỉ tiêu từ file LỌC CỔ PHIẾU.xlsx, sheet Summary_20261005_2338 |
| `mock/analysis.json` | Vùng kết quả trống để nối hệ thống Quant có sẵn |
| `mock/charts.json` | Tên nguồn chart, khung thời gian và chỉ báo; không có nến tự tạo |

Các snapshot cố định chỉ phục vụ dựng bố cục. Không lấy lại dữ liệu, không chấm điểm, không huấn luyện, không chạy Quant, không đặt lịch cập nhật. Giá trị còn thiếu giữ `null`; không thay bằng 0. Trọng số phần trăm chưa có trong file tham chiếu.

Bảng điện dùng GTGD theo triệu đồng; bảng ngành dùng GTGD theo tỷ đồng và giữ phạm vi toàn thị trường. Đây là giá trị giao dịch, không phải dòng tiền ròng. Các số trong hai bảng không được tính lại ở frontend.
