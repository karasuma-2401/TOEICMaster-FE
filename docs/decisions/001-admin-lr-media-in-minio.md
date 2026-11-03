# ADR-001: Lưu media Listening & Reading của admin trong MinIO

## Status

Accepted

## Date

2026-10-31

## Context

Admin cần import câu hỏi Listening từ Excel trước, sau đó tải các tệp MP3
tương ứng. File Excel chỉ chứa nội dung câu hỏi, đáp án và giải thích; không
chứa media. Admin cũng cần tải ảnh cho các câu hỏi hoặc ngữ cảnh Reading có
cấu hình yêu cầu ảnh.

Hiện frontend có các đường upload multipart qua BFF Next.js cho ảnh
(`POST /api/admin/exam-media/images`) và một `master-audio` cho cả revision.
Hướng mới không dùng `master-audio` làm mô hình media Listening: audio phải
gắn vào đơn vị nội dung thực tế để biết chính xác phần nào còn thiếu.

Mục tiêu hiện tại chỉ là màn quản trị Listening & Reading. Không thay đổi
luồng người học và không migrate dữ liệu/tệp cũ trong phạm vi này.

## Decision

### 1. MinIO là object storage; backend giữ quyền và metadata

Ảnh và MP3 được lưu trong MinIO. Bucket không public. Backend là nơi duy nhất
được cấp thông tin truy cập MinIO lâu dài, sinh object key, kiểm tra quyền
admin, loại tệp và giới hạn kích thước.

Frontend không nhận credential MinIO và không tự tạo object key. Frontend chỉ
nhận presigned URL có thời hạn ngắn cùng các header bắt buộc, sau đó tải trực
tiếp tệp lên MinIO.

Sau khi PUT thành công, frontend gọi endpoint `complete` của backend. Backend
xác nhận object tồn tại và khớp các thuộc tính đã cấp trước khi tạo/cập nhật
metadata và gắn asset vào nội dung. Upload URL hết hạn hoặc upload không hoàn
tất không tạo asset tham chiếu được.

### 2. MP3 Listening gắn theo audio group

`AudioGroup` là đơn vị sở hữu MP3, không phải từng câu hỏi:

- Part 1 và Part 2: mỗi câu có một audio group.
- Part 3 và Part 4: các câu thuộc cùng hội thoại/bài nói dùng chung một audio
  group.

Mỗi audio group có tối đa một audio asset đang hoạt động. Câu hỏi tham chiếu
audio group, nhờ đó cùng một MP3 không bị upload hoặc lưu lặp lại cho nhiều
câu.

### 3. Ảnh Reading là asset được gắn có chủ đích

Ảnh được gắn vào câu hỏi Reading hoặc context block của cụm câu, tùy nơi ảnh
được cấu hình. Mỗi vị trí có thể khai báo `imageRequired`. Nếu bắt buộc,
position đó chỉ hoàn tất khi đã có image asset hợp lệ. Alt text vẫn là metadata
của nội dung Reading, không suy diễn từ tên tệp.

### 4. Nháp được lưu; xuất bản bị chặn khi thiếu media bắt buộc

Import và lưu nháp không đòi hỏi MP3/ảnh. Khi mở workspace, admin thấy tổng số
và danh sách audio group hoặc image position còn thiếu, mỗi mục có liên kết
đến đúng vị trí để tải tệp. Backend là nguồn quyết định cuối cùng: endpoint
publish từ chối revision còn media bắt buộc thiếu, kể cả khi frontend đã cũ
hoặc bị bỏ qua.

Frontend cũng kiểm tra trước khi gửi publish để hiển thị checklist dễ hiểu,
nhưng không thay thế kiểm tra ở backend.

## Proposed contract boundaries

Tên endpoint chính xác sẽ được thống nhất trong API contract backend. Ranh
giới bắt buộc là:

1. Admin yêu cầu upload intent với media type và owner (audio group hoặc
   Reading position).
2. Backend xác thực, tạo object key không đoán được, trả về intent ID,
   presigned URL, thời hạn, headers và giới hạn được áp dụng.
3. Trình duyệt upload trực tiếp tới MinIO.
4. Admin xác nhận hoàn tất với intent ID; backend kiểm tra object rồi gắn
   `MediaAsset` vào owner trong một thao tác nhất quán.
5. API revision trả về trạng thái đầy đủ/thiếu media và các định danh cần để
   hiển thị checklist.

`MediaAsset` nên lưu ít nhất: ID, bucket, object key, media type, content
type, byte size, ETag/checksum nếu có, trạng thái, thời điểm tạo và owner.
Không lưu presigned URL dài hạn trong database. URL phát/preview cho admin hay
người học được backend cấp khi cần theo chính sách truy cập sau này.

## Alternatives considered

### Frontend gửi multipart qua Next.js/backend

- Ưu: ít endpoint và CORS đơn giản hơn.
- Nhược: MP3 đi qua frontend server/backend, tăng băng thông, bộ nhớ và thời
  gian xử lý của ứng dụng.
- Rejected: không phù hợp với tệp audio và yêu cầu giảm tải backend.

### Một master MP3 cho toàn bộ revision

- Ưu: giao diện upload đơn giản.
- Nhược: không mô tả được audio cho Part 1/2 và Part 3/4 theo nhóm; không thể
  cảnh báo chính xác nhóm nào thiếu.
- Rejected: không khớp cấu trúc TOEIC và yêu cầu quản trị đã xác nhận.

### Lưu `audioUrl`/`imageUrl` tự do trong Excel hoặc database

- Ưu: triển khai nhanh.
- Nhược: bỏ qua kiểm soát quyền, validation, vòng đời asset và dễ tạo link
  chết hoặc object không thuộc hệ thống.
- Rejected: MinIO asset cần được backend quản lý theo định danh, không bằng URL
  do admin tự nhập.

### Chỉ cảnh báo thiếu media, vẫn cho publish

- Ưu: linh hoạt cho admin.
- Nhược: có thể phát hành đề không làm được cho người học.
- Rejected: lưu nháp đã đáp ứng tính linh hoạt; publish phải là cổng chất
  lượng.

## Consequences

- Backend cần model audio group/media asset, lifecycle upload intent, validation
  publish và CORS/presigned policy cho MinIO.
- Frontend cần thay các upload multipart hiện có bằng client upload theo
  presigned URL, và thêm checklist/cảnh báo media trong workspace admin.
- Tài nguyên upload dở dang có thể trở thành orphan object; cần job hoặc quy
  trình dọn object không có asset/intent đã hết hạn.
- API contract backend chưa có trong workspace frontend, nên schema/endpoint
  cụ thể chỉ được chốt khi backend cập nhật contract. Đây không phải migration
  cho asset hiện hữu.

## Out of scope

- Migration URL/tệp cũ vào MinIO.
- Màn làm bài, phát audio và hiển thị ảnh cho learner.
- Bucket public, credential MinIO ở browser, hoặc URL public vĩnh viễn.
- Upload media cho Speaking/Writing.
