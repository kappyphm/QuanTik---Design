# QuanTik Design

Giao diện QuanTik bằng **Next.js + Tailwind CSS + TypeScript**, với dữ liệu mẫu JSON.

Trang Home được chuyển từ `kwuangyong/QuanTik-website`, snapshot tree `521a093b56fefd21493026adb4ead77882cdf082`, giữ nội dung, bố cục, màu, logo và các visual mô hình. Chỉ điều chỉnh kiểu TypeScript và điều hướng cho Next.js. Những trang bên trong được dựng lại.

## Chạy dự án

Yêu cầu Node.js 20.9 trở lên.

```bash
npm ci
npm run dev
```

Mở `http://localhost:3000`. Từ Home, bấm **Mở Terminal** để vào Dashboard.

```bash
npm run typecheck
npm run build
npm run start
npm test
```

## Các màn hình

| Trang | Đường dẫn | Nội dung |
| --- | --- | --- |
| Home | `/` | Giữ Home cũ, visual 2D/3D và popup giải thích |
| Dashboard | `/dashboard` | Chỉ số thị trường, một bảng cổ phiếu, lọc theo ngành và Theo dõi |
| Lọc cổ phiếu | `/screener` | Lọc cơ hội/rủi ro, nhóm ngành, khối lượng và CMF |
| Phân tích Quant | `/analysis?symbol=FPT` | HÀNH ĐỘNG, Monte Carlo, GARCH, HMM, CMF, Hurst, ARX/Ridge |
| Biểu đồ | `/charts?symbol=FPT` | Nến/đường giá, khối lượng, CMF và khung ngày/tuần/tháng |

**Thị trường, Bảng điện, Nhóm ngành và Theo dõi không còn là các trang riêng.** Dashboard sử dụng một bảng chung; chọn ngành hoặc Theo dõi để lọc. Không có panel trạng thái backend, điểm Quant tổng hợp hoặc Backtest.

## File cần chỉnh

| Thư mục/file | Vai trò |
| --- | --- |
| `frontend/src/app/` | Trang và stylesheet |
| `frontend/src/components/` | Component giao diện dùng chung |
| `frontend/src/components/home/` | Home và các visual cũ |
| `frontend/src/app/globals.css` | Token màu, typography, responsive và Tailwind theme |
| `frontend/src/app/home.css` | CSS Home cũ |
| `backend/mock/*.json` | Snapshot thị trường, phân tích, biểu đồ, nội dung mô hình |
| `docs/DESIGN.md` | Quy ước thiết kế và bố cục |

Mọi số liệu, tín hiệu, phân tích và khuyến nghị bên trong Terminal đều là **dữ liệu minh họa cố định**, không phải dữ liệu thực của cổ phiếu. Nút chọn mô hình chỉ thay đổi phần được hiển thị. Biểu đồ dùng SVG từ JSON mẫu, không tích hợp TradingView. Khung tuần/tháng tổng hợp OHLC và khối lượng từ chuỗi mẫu.

Repo này không chứa engine Quant, API tài chính, đăng nhập, execution, hạ tầng VPS hoặc kiến trúc backend production. `backend/` chỉ chứa mock JSON. Danh sách Theo dõi và theme được lưu cục bộ trên trình duyệt; không cần API key.

## Kiểm tra

`npm run typecheck` kiểm tra TypeScript strict. `npm run build` build production. `npm test` kiểm tra tính nhất quán của mock JSON và cách tổng hợp các khung biểu đồ.

`npm run test:e2e` chạy kiểm thử trình duyệt. Lần đầu cần cài Chromium: `npm exec --workspace frontend -- playwright install chromium`. CI cài và chạy bộ này tự động trên pull request.

## Xem thử bản đóng gói

`npm run build && npm run preview:export` tạo `preview/index.html` để mở trực tiếp. Bản xem thử dùng các component giao diện của Next.js, với điều hướng nội bộ thay thế router cho một file độc lập. Màn hình mặc định là Dashboard; có thể mở Home, Lọc cổ phiếu, Phân tích và Biểu đồ từ menu.
