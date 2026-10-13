# Mock JSON

Thư mục này chỉ cung cấp dữ liệu minh họa để dựng giao diện.

- `mock/market.json`: bốn chỉ số, cổ phiếu, nhóm ngành; giá theo nghìn đồng, khối lượng theo triệu cổ phiếu, dòng tiền ngành theo tỷ đồng.
- `mock/analysis.json`: phân vị giá, xác suất HMM, biến động GARCH, Hurst, ARX và đoạn HÀNH ĐỘNG cho từng mã.
- `mock/charts.json`: chuỗi OHLC, khối lượng theo cổ phiếu và CMF.
- `mock/models.json`: nội dung giải thích đầu vào, đầu ra và giới hạn của sáu mô hình.

JSON được import trực tiếp qua `frontend/src/lib/mock-data.ts`, với kiểu được TypeScript suy luận. Mọi số liệu đều giả lập; không có kết nối đến thị trường, máy chủ Quant hay cơ sở dữ liệu.

Khi thêm một mã, thêm đồng thời vào market, analysis và charts để các màn hình nhất quán. Giữ OHLC hợp lệ, phân vị tăng theo thứ tự và tổng xác suất HMM bằng 100%.
