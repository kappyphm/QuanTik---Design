# Quy ước giao diện QuanTik

## Home

Giữ Home cũ từ QuanTik-website: nội dung, logo, nền xanh đen, hero Monte Carlo, quy trình kiểm định, thư viện visual, popup và Coming soon. Không dùng các quy tắc typography mới để thay đổi Home.

CSS Home được giữ nguyên trong `frontend/src/app/home.css`. Component giữ markup cũ và chỉ được bổ sung kiểu TypeScript, khai báo client component và callback điều hướng.

## Màu trong Terminal

| Token | Dark | Light | Dùng cho |
| --- | --- | --- | --- |
| Background | #0B1013 | #F2F5F6 | Nền chính |
| Surface | #131C20 | #FFFFFF | Card và sidebar |
| Border | #26373D | #D7E0E3 | Phân cách |
| Text | #EAF0F2 | #18292F | Nội dung chính |
| Muted | #A1B2BA | #526B74 | Nhãn phụ |
| Accent | #FF914D | #B94B0A | Nút chính, tab đang chọn |
| Positive | #67D6A5 | #167554 | Giá/CMF dương |
| Negative | #F08088 | #BA354B | Giá/CMF âm |
| Neutral | #E3C16C | #896307 | Giá tham chiếu |

Không dùng màu làm dấu hiệu duy nhất: số có dấu +/−, nhãn trạng thái và nút có aria-pressed.

## Chữ và khoảng cách

- Inter cho menu, tiêu đề và đoạn văn; IBM Plex Mono cho số và mã cổ phiếu. Font được đóng gói cục bộ, gồm tập ký tự tiếng Việt.
- Tiêu đề trang 30–32px, nhóm lớn 22–24px, tiêu đề card 18px, nội dung 15–16px, nhãn 14px.
- Card bo góc 12px, padding 20–24px; khoảng cách giữa khối 18–26px.
- Tránh thêm eyebrow, ghi chú trạng thái kỹ thuật, mô tả lặp lại hoặc chữ nhỏ dưới mỗi thao tác.

## Bố cục

Sidebar gồm Dashboard, Lọc cổ phiếu, Phân tích Quant và Biểu đồ. Logo và link Trang chủ dẫn về Home cũ.

Dashboard: bốn chỉ số ở đầu; bảng cổ phiếu ở khối chính; dòng tiền ngành bên cạnh; chi tiết mã đang chọn bên dưới. Theo dõi nằm trong bảng. Chọn ngành lọc bảng ngay. Bảng có tìm kiếm, sắp xếp và phân trang 8 mã.

Phân tích: thông tin mã → đoạn HÀNH ĐỘNG → chọn mô hình hiển thị → phân phối Monte Carlo → các bằng chứng mô hình → giải thích mở rộng. Không thêm điểm tổng hợp hoặc backtest.

Biểu đồ: mã → timeframe → nến/đường → CMF → biểu đồ → ba chỉ số đọc nhanh. Không đưa trạng thái API hoặc log backend vào màn hình.

## Responsive và truy cập

- Từ 1250px trở xuống, dòng tiền ngành chuyển dưới bảng.
- Từ 900px trở xuống, chỉ số chia hai cột.
- Từ 700px trở xuống, sidebar chuyển thành menu, mô hình xếp một cột.
- Bảng và chart có vùng cuộn ngang riêng; trang không dùng chiều rộng cố định.
- Menu có Escape và vòng focus. Popup dùng dialog native, Escape và khôi phục focus. Có skip link, label cho input, trạng thái sắp xếp và hỗ trợ reduced motion.

## Phạm vi tương tác

Tìm mã mở Phân tích; dấu / focus ô tìm kiếm. Theo dõi và theme được nhớ trên trình duyệt. Lọc, sắp xếp, phân trang, chọn mô hình, popup, chuyển mã, chọn khung và CMF đều dùng dữ liệu mẫu. Không có nút hứa chạy engine thật hoặc giao dịch thật.
