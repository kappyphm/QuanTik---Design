# Rà soát đầu-cuối: tài khoản, người dùng và thương mại

Ngày rà soát: 15/10/2026. Phạm vi là UI/UX → Next proxy/session → API → dữ liệu/quyền lợi → phản hồi cho khách/admin. Các bảng bên dưới giữ phát hiện tại thời điểm rà soát. Trạng thái triển khai ngày16/10/2026 được ghi trong [ACCOUNT-COMMERCE-IMPLEMENTATION.md](ACCOUNT-COMMERCE-IMPLEMENTATION.md); chính sách đã được người dùng chốt trong tài liệu triển khai thay thế các phương án còn đề xuất ở đây. Không thêm hoàn tiền.

## Kết luận

Luồng thông thường đã được nối, nhưng luồng ngoại lệ và mô hình sản phẩm chưa đồng bộ đủ để coi là hoàn thiện thương mại. Ưu tiên cao nhất: tiếp nhận tiền của đơn đã phát hành khi ngừng bán; nói rõ hiệu lực gói trước khi khách chuyển tiền; thể hiện trạng thái cần đối soát và cách xử lý để khách không chuyển lần nữa. Thêm nút thao tác không giải quyết các thiếu sót này.

Không phát hiện thêm lỗi phân quyền đã được tái hiện trong lượt rà soát này. Điều đó không thay thế đánh giá bảo mật đầy đủ hoặc nghiệm thu ngân hàng thật.

## Phát hiện và đề xuất theo ưu tiên

| ID | Mức | Luồng / điểm cấn | Tác động | Đề xuất / phần thay đổi |
|---|---|---|---|---|
| F01 | P1 | Tắt thanh toán cũng chặn webhook của đơn cũ | SePay gọi webhook khi payments_enabled=false sẽ bị gate trả503; tiền có thể đã chuyển nhưng chưa ghi nhận vào hệ thống | Tách nhận đơn mới khỏi tiếp nhận webhook đã xác thực. Dừng bán vẫn ghi nhận tiền/đối soát cho đơn đã phát hành. BE + cảnh báo cấu hình FE |
| F02 | P1 | Hết lượt, mua thêm nhưng gói mới vẫn xếp sau kỳ hiện tại | Khách có thể trả tiền xong vẫn không dùng được lượt mới trong nhiều ngày | Trước tạo đơn, hiển thị lịch bắt đầu/kết thúc dự kiến và gói đang dùng. Chốt rõ sản phẩm gia hạn theo kỳ; nếu muốn mua thêm lượt dùng ngay cần chính sách/product riêng. Không tự đổi luật cộng quota. BE cung cấp quote hiệu lực + FE |
| F03 | P1 | Chuyển tiền đúng hạn, webhook đến sau hạn vẫn cần đối soát | Đơn EXPIRED dù đã trả tiền, khách dễ tưởng thanh toán thất bại | Chốt chính sách xử lý chậm webhook dựa trên transaction_at/received_at; cân nhắc khoảng tiếp nhận trễ có giới hạn. Luôn ghi nhận và hiện trạng thái đang đối soát khi đã nhận giao dịch. BE + FE |
| F04 | P1 | Đơn khách chỉ có PENDING/PAID/EXPIRED/CANCELLED, thiếu trạng thái nhận tiền cần xử lý | Đơn hết hạn/hủy vẫn gợi ý tạo đơn mới, kể cả payment đã vào RECONCILIATION. Có nguy cơ khách chuyển tiếp lần nữa | Bổ sung payment_resolution/linked payment summary vào API đơn; FE hiện đã nhận giao dịch/đang đối soát, hướng dẫn không trả lại, mã tham chiếu và kênh hỗ trợ thực có. Đây không phải tự công nhận PAID. BE + FE |
| F05 | P1 | Tạo gói admin chưa có idempotency | Mất phản hồi rồi thử lại có thể tạo hai phiên bản | Thêm Idempotency-Key và kết quả truy hồi được cho thao tác tạo gói. FE giữ key qua retry. Không chỉ dựa vào disable nút. BE + FE |
| F06 | P2 | Quay lại danh mục và bấm mua lần nữa luôn tạo đơn mới | Chống trùng qua retry đã có, nhưng không xử lý mua lặp do Back/mở tab khác; có thể vướng giới hạn5đơn | Mặc định tiếp tục đơn PENDING còn hạn của cùng gói. Có lựa chọn tạo đơn khác khi thực sự cần. Chốt quy tắc với BE; không tự gộp các lần mua chủ đích |
| F07 | P2 | Đang chọn gói nhưng đăng nhập xong mất ngữ cảnh mua | Nút login không mang intent gói; callback vào dashboard theo yêu cầu hiện tại | Giữ yêu cầu vào dashboard; lưu intent gói/đơn không nhạy cảm và hiện CTA tiếp tục tại dashboard, xác minh lại gói/giá trước tạo đơn. Không tự tạo đơn khi vừa login. FE |
| F08 | P2 | Google login ở tab mới chưa đồng bộ như admin login | Code chỉ broadcast sự kiện login cho admin; tab khách cũ có thể giữ hồ sơ/trạng thái cũ đến khi tải lại | Đồng bộ sự kiện hoàn tất Google login/đổi tài khoản; khi nhận sự kiện, bỏ dữ liệu riêng cũ trước khi tải phiên mới, tránh broadcast lặp. FE/callback |
| F09 | P2 | Admin quản lý người dùng bằng UUID | Khó tìm khách và chọn đúng người để khóa/mở/tra đơn | API users trả tên/email xác minh, tìm kiếm và trạng thái có phân trang; FE đặt tên/email làm thông tin chính, UUID trong chi tiết. BE + FE |
| F10 | P2 | Đơn/kỳ gói của khách thiếu tên và quyền lợi lịch sử | Người mua khó kiểm tra mình đã mua gì; mã plan_id không có ý nghĩa với khách | Trả metadata từ phiên bản mà order/subscription tham chiếu, kể cả khi đã đóng bán. Checkout/biên nhận hiển thị tên, thời hạn, lượt, giá và kỳ hiệu lực. BE + FE |
| F11 | P2 | Lịch sử phân trang theo UUID | Thứ tự ngẫu nhiên theo thời gian, đơn vừa tạo có thể nằm trang khác | Orders mặc định mới nhất theo(created_at,id); payments theo(received_at,id); kỳ gói theo thời điểm hiệu lực. Cursor dùng cùng thứ tự, không chỉ sort trang đã tải. BE + FE |
| F12 | P2 | Đếm ngược/hide QR dựa hoàn toàn đồng hồ máy khách | Máy chạy nhanh có thể ẩn chuyển khoản quá sớm; máy chậm hiển thị thời gian sai | API trả server_now, FE tính offset để hiển thị; BE vẫn quyết định hạn và trạng thái cuối. BE + FE |
| F13 | P2 | GET đơn lỗi ngay lần đầu chưa có dữ liệu thì không có auto-poll | Điều kiện poll chỉ chạy khi data.status=PENDING; lỗi đầu tiên phải nhấn thử lại | Tự retry có giới hạn/backoff cho lỗi mạng/5xx của GET ban đầu, dừng ở401/403/404; giữ retry thủ công khi hết đợt thử. Không tự replay mutation. FE |
| F14 | P2 | Thay phiên bản giá cần tự mở bản mới rồi đóng bản cũ | Dễ để hai gói cùng tên/công dụng cùng mở bán; thiếu nhóm sản phẩm để hiểu phiên bản | Thiết kế thao tác thay thế gói có chủ đích, hiển thị khác biệt và các bản đang công khai; cần quan hệ sản phẩm/phiên bản và chuyển trạng thái có audit ở BE. Giữ hợp đồng mua cũ |
| F15 | P2 | Cấu hình SePay chưa gắn trạng thái vận hành nhận tiền | Đủ trường/đã bật không chứng minh URL webhook public hoạt động; đổi bank/key còn ảnh hưởng các đơn cũ | Hiện lần nhận webhook gần nhất, số giao dịch cần xử lý, số đơn đang chờ; cảnh báo khi thay bank/key hoặc ngừng bán. Kiểm connection chỉ thêm khi có API thật. BE + FE |
| F16 | P2 | Trang tài khoản nặng bảng, lịch sử và ID | Khách phải tự ghép thông tin để biết gói/lượt đang dùng và kỳ tiếp theo | Tổng quan gồm tên gói hiện tại, lượt còn lại, hạn, kỳ tiếp theo và CTA có ngữ cảnh. Usage/orders/payments là chi tiết; giữ thông tin, giảm mật độ mặc định. FE + metadata BE |
| F17 | P2 | Điều hướng admin chưa thuận tiện | Logout ở overview; chi tiết đơn nằm dưới danh sách dài; bộ lọc không được phản ánh đầy đủ vào URL | Menu tài khoản cố định; chi tiết đơn có đường dẫn rõ/focus; URL lưu filter/cursor để back/reload/share có ngữ cảnh. FE |
| F18 | P2 | Một số lỗi API vẫn hiện REQUEST_FAILED hoặc mã không giải thích | Lỗi422/field validation không chỉ ra chỗ cần sửa; khách/admin dễ bấm lại vô ích | Chuẩn hóa envelope lỗi, map lỗi theo trường và thông điệp theo thao tác; phân biệt từ chối chắc chắn với mất phản hồi chưa biết đã lưu chưa. BE + FE |

P1: xử lý trước khi mở rộng bán thật. P2: hoàn thiện trước khi bàn giao luồng vận hành ổn định. F02/F03/F06/F14 là quyết định sản phẩm/nghiệp vụ cần chốt, không mặc định coi chính sách hiện có là lỗi thuật toán.

## Ma trận luồng hiện tại và đích đề xuất

| Luồng | Chuỗi hiện tại | Phần còn thiếu ở đầu-cuối |
|---|---|---|
| Google login | Login → Google start → callback BE → exchange Next → dashboard → me | Giữ intent mua và đồng bộ tab/đổi tài khoản (F07/F08). Giữ dashboard là đích đăng nhập |
| Admin login/session/logout | Form riêng → login/access/refresh → server gate → admin/me → màn admin; logout thu hồi phiên | Đăng xuất mọi trang; các ca cookie hết hạn/mạng lỗi đã sửa và kiểm thử trước đó |
| Hồ sơ/quyền sử dụng | me + entitlements + usage + subscription → account | Tóm tắt tên gói/kỳ/lượt, không bắt khách đọc UUID và nhiều bảng (F10/F16) |
| Người dùng admin | users → chọn người → reason/review → state → cập nhật | Tên/email/search và liên kết có ngữ cảnh đến đơn/kỳ (F09) |
| Danh mục/mua gói | public plans → session → POST orders + key → checkout | Intent login, quote hiệu lực và tiếp tục đơn còn hạn (F02/F06/F07/F10) |
| Tạo/mở/đóng gói | POST admin/plans → đóng bán → review availability → public plans | Chống tạo trùng, thay thế phiên bản có quản lý, cảnh báo đơn cũ (F05/F14/F15) |
| Checkout | GET order → bank/QR/copy → GET polling → PAID hoặc hết hạn/hủy | Server clock, lỗiGETđầu, luồng đã nhận tiền chưa cấp gói và hỗ trợ (F03/F04/F12/F13) |
| Webhook/cấp gói | xác thực SePay → validate → chống trùng → match → grant/quota/subscription/audit cùng transaction | Phân tách ngừng bán với nhận tiền cũ và chính sách webhook chậm (F01/F03). Giữ atomicity/chống cấp hai lần |
| Kết quả sau trả tiền | order PAID → fetch entitlement → link account | Biên nhận gói/kỳ mới; giải thích queued period; không chỉ hiển thị entitlement kỳ cũ (F02/F10) |
| Lịch sử khách/admin | orders/payments/subscriptions → bảng/cursor | Thứ tự thời gian, tên gói, link ngữ cảnh và URLfilter (F10/F11/F17) |
| Đối soát | reconciliation → nhập order_id → preview chi tiết → review → apply → yêu cầu APPLIED | Dẫn được giao dịch cần xử lý về đơn khách, policy trễ và kênh hỗ trợ (F03/F04); không có đánh dấu paid tùy ý |
| Config SePay | fields/secret/revision/reason → review/PATCH → readiness | Health thực tế, last webhook, ảnh hưởng pendingorders (F01/F15). Không coi đủ trường là kết nối thành công |

## Luồng đích cho khách

Danh mục công khai → chọn gói → đăng nhập nếu cần (dashboard có bước tiếp tục) → tiếp tục đơn đang chờ hoặc tạo đơn → xem rõ tên gói, giá, hiệu lực và quyền lợi → chuyển khoản → tự xác nhận.

Nếu thành công: biên nhận và kỳ gói được cấp; CTA đi tới quyền sử dụng/phân tích theo khả năng sử dụng thực tế.

Nếu chưa nhận giao dịch: tiếp tục chờ trong hạn. Nếu đã nhận nhưng lệch/trễ: trạng thái cần xử lý, mã đơn và hướng dẫn hỗ trợ; không thúc tạo đơn trả tiền lần nữa. Nếu chưa trả và đơn hết hạn: cho tạo đơn mới.

Không thêm nút Kiểm tra thanh toán hoặc nút tự khai đã trả tiền để quyết định cấp gói. Không triển khai hoàn tiền trong phạm vi đề xuất này.

## Chứng cứ và mức kiểm chứng

### Tái hiện logic trên DB tạm trong bộ nhớ, không chạm dữ liệu vận hành

- Tạo kỳ30ngày/20lượt, dùng hết20lượt, thanh toán kỳ mới: current_remaining=0; kỳ sau bắt đầu sau2591999giây (~30ngày), hai kỳ nối tiếp. Xác nhận F02.
- Giao dịch transaction_at trước expires_at, xử lý sau expires_at: mismatch trả ORDER_CLOSED_OR_LATE. Xác nhận nhánh logic F03; không phải sự cố ngân hàng thật đã xảy ra.
- require_configuration với payments_enabled=false ném PAYMENTS_DISABLED/503. Router webhook gọi hàm này trước receive. Xác nhận đường chặn F01 bằng helper và đọc router, chưa thử webhook ngân hàng thật.

### Xác nhận bằng đọc source

- FE: components/account/customer.tsx (PlanCard/buy, polling, canTransfer, trạng thái đơn đóng), account/login.tsx, account/session.tsx (broadcast), lib/api/client.ts (error envelope), admin/billing.tsx (versioning/filter/detail), admin/management.tsx, admin/integrations.tsx.
- BE: service/billing.py (create_order/grant/mismatch/require_configuration), billing_api.py (customer/admin views, cursor, webhook), admin_api.py (users và list views), identity.py/google_auth.py (role/session/OAuth exchange).
- F04/F08/F11/F13 được xác định từ nhánh source; chưa tạo giao dịch lỗi vận hành, login Google đổi tài khoản thật hoặc thử máy khách lệch giờ trong lượt này. F12 là rủi ro có cơ sở từ code, chưa phải incident được ghi nhận.

### Giới hạn

Các kiểm thử UI/API thật và fixture đã chạy ở lượt trước được mô tả trong báo cáo UX audit. Lượt này không chạy lại toàn bộ48ca vì không đổi implementation. Không dùng kết quả fixture để khẳng định webhook công khai/settlement ngân hàng thật đã nghiệm thu. Không thay giá, trạng thái gói, cấu hình nhận tiền, tài khoản hoặc giao dịch trong lần rà soát này.

## Kế hoạch ưu tiên triển khai

1. Chốt hai chính sách: mua thêm khi hết lượt là gia hạn kỳ hay mua lượt dùng ngay; xử lý chuyển đúng hạn nhưng webhook đến trễ. Chốt quy tắc tiếp tục đơn PENDING và thay phiên bản sản phẩm.
2. Sửa BE nhận tiền: F01/F03/F04. Bổ sung trạng thái đọc đủ cho FE, quote hiệu lực và metadata hợp đồng; giữ ràng buộc role/ownership và transaction chống cấp lặp.
3. Sửa UI khách: F02/F04/F06/F07/F10/F12/F13/F16. Một hành động chính mỗi trạng thái, lỗi có bước tiếp theo rõ; giữ dashboard sau login.
4. Hoàn thiện vận hành admin: F05/F09/F11/F14/F15/F17/F18. Không thêm màn/hành động không có API thực.
5. Nghiệm thu: đang bán → tắt nhận đơn mới trong khi có đơn chờ → webhook đúng/trễ/trùng; mua khi hết lượt; mạng lỗi sau commit; đổi tài khoản giữa tab; đối soát thành công và bị từ chối. Sau đó mới kiểm1giao dịch ngân hàng thật được phép và xác nhận trọn vòng tiền → PAID → kỳ gói/lượt.
