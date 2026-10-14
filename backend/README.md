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

`mock/demo.json` là dữ liệu tự do dành riêng cho kiểm tra UI. Các số chỉ số, trọng số, nến và kết quả Quant được mô phỏng, không đại diện cho thị trường. Không dùng file này làm nguồn chấm điểm production.
# Fixture diễn giải Quant

`mock/analysis-visuals.json` lưu sẵn dữ liệu trình bày cho 25 mã: HMM, GARCH, Monte Carlo và các minh họa dòng tiền. Các hình này là dữ liệu thử giao diện, không phải các đầu ra đã khớp từ engine. GARCH surface dùng chung để giải thích cơ chế với bộ tham số mẫu; không phải implied volatility surface. Không có API, job hoặc thuật toán tính Quant mới.

