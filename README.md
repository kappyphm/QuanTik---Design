# QuanTik Design

Vỏ giao diện **Next.js + Tailwind CSS + TypeScript**, lấy QuanTik hiện tại làm gốc.

Home giữ nguyên nội dung, markup, CSS, logo và các visual từ `kwuangyong/QuanTik-website`, snapshot tree `521a093b56fefd21493026adb4ead77882cdf082`. Các trang bên trong được sắp xếp lại và tăng độ dễ đọc.

## Chạy local

Node.js 20.9 trở lên:

```bash
npm ci
npm run dev
```

Mở `http://localhost:3000`. Bấm **Mở Terminal** để vào Dashboard.

## Bố cục

- **Dashboard**: VN-INDEX, VN30, UPCOM, HNX-INDEX → bảng điện có TC/trần/sàn, ba mức dư mua/bán, khớp lệnh, tổng KL, GTGD, thống kê và nước ngoài → bảng nhóm ngành. Theo dõi nằm trong cùng bảng. Bấm mã mở cửa sổ chart với Quant bên cạnh; có thể thu/mở Quant hoặc mở trang phân tích toàn màn hình.
- **Quét toàn sàn**: hai danh sách, mỗi nhóm 5 mã; lý do và các chỉ tiêu mở/thu trong từng mã. Có phần xem tiêu chí trước khi chạy Quant tổng quát.
- **Phân tích Quant**: nhập/chọn mã → xem tiêu chí trước khi chạy → vùng kết quả. Các nút chạy cuối cùng chưa nối backend.
- **Biểu đồ**: giữ đường dẫn `/charts?symbol=FPT` cho chế độ toàn màn hình. Biểu đồ nằm trong luồng chọn mã, không thêm mục riêng vào menu.

## Dữ liệu và phạm vi

`backend/` chỉ có **mock JSON**, không có API server, scheduler, job runner, scoring, backtest hoặc engine Quant. Không dựng lại bộ nạp dữ liệu hay vòng lặp hai lần/ngày. Theme, Theo dõi, lọc và trạng thái mở/thu chỉ là tương tác giao diện cục bộ.

- `market.json`: 16 mã mẫu chép từ bảng điện QuanTik tại thời điểm đọc; nguồn gốc `vnstock_price_board`. Snapshot cố định, không phải realtime. Giá theo nghìn đồng; KL theo cổ phiếu; GTGD bảng điện theo triệu đồng. Bảng ngành là snapshot toàn thị trường, GTGD theo tỷ đồng, không tính từ 16 mã mẫu. GTGD không phải tiền ròng vào/ra. Chỉ số thị trường thiếu nguồn được để `null`, hiển thị “—”.
- `scan.json`: bản mẫu từ **LỌC CỔ PHIẾU.xlsx**, sheet **Summary_20261005_2338**. Giữ nhãn THEO DÕI/TRÁNH, điều kiện, chỉ tiêu và nhận xét. Hai danh sách lấy 5 dòng đầu của mỗi nhãn theo thứ tự sheet; không tính lại thứ hạng. Đây là mẫu bố cục, không phải bản công bố mới hoặc 5 mã được hệ thống đang chạy lựa chọn.
- File Excel không chứa bảng hệ số trọng số %. Giao diện ghi rõ phần còn thiếu, không tự đặt hệ số hoặc công thức.
- `analysis.json`, `charts.json`: vùng dữ liệu để nối sau; không có dự báo giả hoặc nến tự sinh.
- Chart **TradingView** nhúng script Advanced Chart thật, giữ cách cấu hình của repo gốc. Không dùng SVG giả làm TradingView. Dữ liệu, độ trễ và quyền khung intraday phụ thuộc TradingView. Nguồn “Dữ liệu Quantik” giữ vùng hiển thị trống để nối hệ thống cũ.

## Kiểm tra và xem thử

```bash
npm run typecheck
npm test
npm run build
npm run preview:export
```

`preview/index.html` dùng cùng các component frontend, với router thay thế để mở độc lập. TradingView cần Internet và môi trường cho phép script/iframe bên ngoài.

`npm run test:e2e` kiểm tra các luồng giao diện desktop/mobile. CI chạy tự động trên main. Trong kiểm thử, script bên ngoài của TradingView được thay bằng stub để kiểm tra cấu hình và bố cục ổn định; kiểm thử không xác nhận nguồn giá realtime.
