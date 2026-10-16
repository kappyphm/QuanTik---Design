# Rà soát quét toàn sàn định kỳ — 16/10/2026

Đây là hiện trạng trước thi công. Kết quả đã triển khai và giới hạn nghiệm thu cập nhật tại [SCREENING-IMPLEMENTATION.md](SCREENING-IMPLEMENTATION.md).

## Kết luận

Có thể bắt đầu tích hợp FE với API đã có, nhưng chưa thể nghiệm thu luồng quét định kỳ bằng dữ liệu thật. FE đang là bản mô phỏng; BE có bộ quét/lập lịch nhưng thiếu đường dữ liệu được kiểm định và các tiến trình pipeline đang chạy ở local.

Lượt này chỉ rà soát, chạy test và ghi nhận; không sửa source nghiệp vụ, không bật provider, không nạp dữ liệu hoặc khởi chạy tác vụ thật. Các file deploy/production đang thay đổi trong workspace được giữ nguyên. Báo cáo triển khai VPS là chứng cứ lưu trên đĩa, không phải kiểm tra trực tiếp VPS trong lượt này.

## Luồng hiện tại

### Khách hàng

`/screener` → màn giới thiệu → bấm “Quét toàn sàn” → `setLoaded(true)` → hiển thị JSON mẫu → mở giải thích/Quant mẫu hoặc link `/analysis?symbol=...`.

- Không gửi yêu cầu quét lên BE; “Quét lại” chỉ quay về màn giới thiệu.
- Chưa áp dụng yêu cầu đã chốt trước đây: vào thẳng kết quả, bỏ bước bấm quét, kết quả nằm ngay trên trang.
- Hai nhóm cố định5mã nổi bật/5mã nên tránh lấy từ `backend/mock/scan.json`; không phản ánh kỳ công bố AM/PM.
- Chưa có trạng thái dữ liệu đang chờ, chưa từng công bố, đã cũ, lần chạy mới thất bại, lịch ngoài phạm vi hoặc thiếu chỉ tiêu.
- Chưa có ràng buộc đăng nhập ở màn quét. Phần Quant/Criteria dùng DTO và dữ liệu mô phỏng khác hợp đồng screening thật.

### Hệ thống

Lịch giao dịch + cấu hình OPERATIONS → scheduler tạo task bền theo kind/ngày/ca → worker INGEST nạp universe, VNINDEX và lịch sử giá → manifest đủ điều kiện → worker SCREEN tính tiêu chí/xếp hạng → transaction lưu kết quả và đổi pointer công bố → API latest → API results theo run_id.

BE đã có:

- Mỗi phiên giao dịch hai ca: AM kích hoạt11:30, hạn12:55; PM kích hoạt15:00 nhưng dữ liệu completed phải từ16:00, hạn17:30. Giờ Việt Nam; không chạy ca quét ngày nghỉ theo lịch đang áp dụng.
- Retry có giới hạn, lease/heartbeat, chống task trùng, chống worker cũ công bố, giữ bản công bố trước khi lượt mới lỗi.
- Screening chỉ cần universe, histories và VNINDEX; không phụ thuộc huấn luyện LightGBM hoặc snapshot của phân tích Quant.
- Coverage lịch sử tối thiểu95% universe, VNINDEX tối thiểu50bars và ít nhất một nhóm có mã đủ điều kiện. Chi tiết21tiêu chí có TRUE/FALSE/UNAVAILABLE, không mặc định thiếu dữ liệu là FALSE.
- `GET /api/v1/screenings/latest?slot=ALL|AM|PM`: trả ngày/ca/run, summary, stale, stale_reasons, latest_attempt, calendar_status; chưa có công bố trả503 SCREENING_NOT_READY.
- `GET /api/v1/screenings/{run_id}/results?group=ALL|OVERALL|STRONG|ACCUMULATION|DISTRIBUTION&limit=...&cursor=...`: kết quả phân trang của đúng run. `ALL` xếp symbol; các nhóm xếp rank. Không được lấy5dòng đầu ALL rồi coi là top5.
- Admin đã có cấu hình vận hành/lịch và danh sách tác vụ lọc theo loại/trạng thái. Tác vụ chỉ đọc; chưa có API run-now/retry thủ công. Giờ chạy đang cố định trong source, admin hiện bật/tắt và chỉnh retry, không chỉnh giờ ca.

## Các điểm lệch và thiếu cần xử lý

| Mức | Điểm | Tác động / hướng xử lý |
|---|---|---|
| P1 | FE chưa gọi screening; proxy chưa allowlist hai route | Probe trực tiếp BE trả401, qua Next trả404. Thêm GET allowlist có phạm vi, DTO/client và trạng thái phiên; không thêm API khách tự phát động quét. |
| P1 | Provider lưu LIVE_UNVERIFIED, screening yêu cầu LIVE_VALIDATED | Bật API key/worker chưa đủ để có bản công bố. Cần quy trình kiểm định universe/history và bằng chứng, lưu revision/checksum tương ứng; không đổi nhãn hoặc bật fixture để bỏ gate. Source hiện chưa có bước kiểm định nối hai trạng thái. |
| P1 | Thiếu dữ liệu và tiến trình thực thi ở local | DB có0manifest,0history,0universe,0result,0pointer công bố;10run FAILED. Scheduler heartbeat STOPPED; không có process schedule-worker. Cần dữ liệu hợp lệ và supervisor chạy scheduler + INGEST/SCREEN, kiểm tra một kỳ thực tế. |
| P1 | Quyền đọc chưa gắn quyền lợi gói | Hai API chỉ xác thực user/enabled, không kiểm subscription hoặc features.screening. User chưa mua gói vẫn có thể đọc nếu có dữ liệu. Cần chốt quét là quyền lợi trả phí hay mọi tài khoản; nếu trả phí phải kiểm ở BE, FE chỉ dẫn login/mua gói. Đọc kết quả định kỳ không nên trừ hạn mức tạo yêu cầu phân tích. |
| P2 | Hai nhóm mẫu khác nhóm BE | BE có Tổng hợp, Sức mạnh, Tích lũy, Phân phối. Đề xuất giữ bố cục thẻ, hiển thị Tổng hợp ở khối nổi bật và Phân phối ở khối cảnh báo; bổ sung tab nhóm. Phân phối là điểm tín hiệu rủi ro, không phải “điểm chất lượng thấp”; không đảo score hoặc tự suy diễn khuyến nghị mua/bán. Cho phép ít hơn5mã. |
| P2 | Nội dung Quant mẫu không có trong screening DTO | Screening trả groups/criteria/assessment/price_summary/ranks, không trả báo cáo HMM/GARCH/Monte Carlo, sector đầy đủ hay biểu đồ Quant hiện tại. Giữ vỏ giao diện, thay nội dung bằng chứng screening thật; link phân tích Quant đi vào usecase tạo yêu cầu riêng, không ngụ ý report đã có. |
| P2 | Chưa có freshness và tình huống ngoại lệ trên UI | Hiện ngày/ca/giờ công bố, độ phủ và trạng thái AM tạm tính/PM hoàn tất. Khi bản mới chờ/lỗi vẫn giữ bản cũ và ghi rõ; chưa có bản nào hiện màn chờ dữ liệu. Không báo thị trường không có cơ hội khi hệ thống chưa có dữ liệu. |
| P2 | Admin vận hành rời rạc | Gắn health provider/worker, ca kỳ vọng, lần công bố cuối, số mã và lý do thiếu dữ liệu vào tổng quan; link từ task SCREEN tới run. Tự cập nhật khi đang theo dõi. Chưa cần thêm nút chạy lại trước khi có usecase/API được kiểm soát. |

Các ngưỡng khoa học/xếp hạng hiện là beta policy trong source; lượt này không thẩm định hiệu quả tín hiệu đầu tư.

## Trạng thái thực tế đã kiểm tra

- Local dùng development + SQLite, allow_fixture_analysis=false.
- Cả ingestion_enabled trong OPERATIONS và QUANTIK_SCHEDULED_PROVIDER_ENABLED đều false; screening_enabled=true. Chỉ cấu hình API key Vnstock không bật các gate này.
- Calendar đang áp dụng EXCHANGE_REFERENCE,01/01–31/12/2026; scheduler cursor tới15/10/2026. Cần lịch mới trước khi hết phạm vi.
-19task: SCREEN10FAILED/2PENDING; SNAPSHOT5FAILED/1PENDING; TRAIN1FAILED.10run quét FAILED do TASK_DEADLINE, chưa công bố lần nào. Không coi task tồn tại là pipeline đang hoạt động.
- Process local chỉ thấy API trong nhóm backend đang chạy; scheduler cũ STOPPED. Docker local không có container đang chạy lúc kiểm tra.
- Compose production có INGEST/SCREEN/SNAPSHOT trong profile pipelines và TRAIN trong profile training. Báo cáo deploy lưu trên đĩa ghi9container, có scheduler nhưng chưa gồm các worker pipeline; chỉ bật scheduler sẽ tạo task mà không có worker tiêu thụ. Chưa kiểm tra live VPS trong lượt này.

## Luồng UI đề xuất

1. Mở `/screener` vào thẳng trang kết quả; kiểm tra phiên/quyền xem.
2. Lấy latest cho slot đang chọn, mặc địnhALL; hiển thị ngày/ca và nguồn công bố.
3. Dùng đúng run_id đó tải từng nhóm cần hiển thị; giữ nguyên run trong lúc phân trang. Khi có bản mới, đổi toàn bộ tập kết quả nhất quán, không trộn hai kỳ.
4. Kết quả ngay dưới bộ chọn ca/nhóm, giữ các thẻ và phần giải thích có thể mở rộng. Mặc định hiện ít dòng, có xem thêm, không cố định luôn10mã.
5. Mở mã: xem21tiêu chí, coverage, lý do/warnings và giá đúng đơn vị. Giá BE làVND, thay đổi giá làratio; chuyển đổi định dạng rõ, không dùng nguyên quy ước giá nghìn đồng của mock.
6. “Phân tích Quant” chuyển sang luồng yêu cầu riêng khi được tích hợp; xem screening không tự tạo job hoặc trừ hạn mức ngày.
7. Làm mới chỉ đọc kết quả đã công bố; tự cập nhật có giới hạn, dừng khi ẩn tab. Không có “Quét lại” để khách kích hoạt tính toàn sàn.

## Phương án thi công

1. Khóa hợp đồng FE: quyền đọc gói, ánh xạ nhóm, states và định dạng; thêm DTO/proxy/API. Có thể làm ngay mà không đổi thuật toán BE.
2. Chuyển màn quét từ mock sang API, giữ bố cục tối đa, bỏ màn giới thiệu bắt bấm; xử lý phiên/quyền/chưa ready/stale/missing criteria/pagination. Đồng bộ trang chi tiết mã để không trộn dữ liệu Quant mẫu với screening thật.
3. Hoàn thiện đường dữ liệu kiểm định và vận hành: provider credentials/gates, evidence kiểm định, universe/index/history, scheduler + worker INGEST/SCREEN. Chạy một kỳ đủ điều kiện trong cửa sổ; lưu kết quả và kiểm nguồn live.
4. Nghiệm thu một chu kỳ đầy đủ: đúng giờ AM/PM, thiếu dữ liệu/retry/deadline, cũ vẫn đọc được, restart không trùng publication, khách không có quyền bị chặn, xem kết quả không trừ hạn mức, desktop/mobile và định dạng số đúng.

Điều kiện hoàn thành: có bản screening thật được công bố và FE đọc đúng run qua proxy. API health/schema ready và test fixture đạt riêng lẻ chưa đáp ứng điều kiện này.

## Kiểm chứng trong lượt review

- Đọc source FE/BE, mở `/screener` ở trình duyệt, probe API qua BE/Next, truy vấn DB chỉ đọc và kiểm tra process/container.
- `python -m pytest backend/tests/test_screening.py backend/tests/test_scheduling.py -q --disable-warnings`:5passed,1warning. DB và provider stub của test; không gọi Vnstock thật, không sửa DB vận hành.
- Không xác nhận đã chạy live AM/PM hoặc kiểm dữ liệu thị trường thật trong lượt này.
