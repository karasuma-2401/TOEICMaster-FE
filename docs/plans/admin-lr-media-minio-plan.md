# Plan: Media MinIO cho quản trị Listening & Reading

## Mục tiêu

Cho phép admin import nội dung Listening/Reading trước và bổ sung media sau:

- MP3 Listening gắn theo audio group.
- Ảnh Reading gắn tại câu hỏi hoặc context block đã cấu hình bắt buộc ảnh.
- Upload đi thẳng từ browser đến MinIO bằng presigned URL do backend cấp.
- Nháp có thể thiếu media; revision không thể xuất bản khi còn thiếu media bắt
  buộc.

Quyết định và lý do được ghi tại
[ADR-001](../decisions/001-admin-lr-media-in-minio.md).

## Phạm vi và ranh giới

| Trong phạm vi | Ngoài phạm vi |
| --- | --- |
| Admin L&R, import Excel, quản lý MP3/ảnh, checklist và chặn publish | Migration tệp cũ, learner player/UI, Speaking/Writing, bucket public |
| Backend/MinIO contract cần cho presigned upload | Đưa MinIO credential hoặc `API_BASE_URL` vào client |

## Thiết kế đích

```text
Admin UI -> Next.js same-origin BFF -> Backend: tạo upload intent
Admin UI ---------------------------> MinIO: PUT bằng presigned URL
Admin UI -> Next.js same-origin BFF -> Backend: complete intent + gắn asset
Backend -> MinIO: xác minh object / cấp URL đọc khi cần
```

`MediaAsset` lưu metadata và object key; không lưu presigned URL. Một
`AudioGroup` có tối đa một MP3 hoạt động. Part 1/2 có một group/câu; Part 3/4
có một group/cụm câu. Reading image được gắn vào question hoặc context block
và chỉ bắt buộc khi vị trí được cấu hình `imageRequired`.

## Kế hoạch triển khai

### 1. Chốt backend contract và cấu hình MinIO

Owner: backend + frontend

1. Cập nhật API contract backend trước khi viết client. Contract cần định nghĩa
   request/response, error code và authorization cho: tạo upload intent, hoàn
   tất intent, lấy revision với media status, import, và publish validation.
2. Định nghĩa `MediaAsset`, `UploadIntent`, `AudioGroup` và reference từ
   Listening question/group, Reading question/context block. Chốt cách biểu diễn
   `imageRequired`.
3. Quy định allow-list, MIME type, kích thước tối đa và thời hạn URL riêng cho
   `audio/mpeg` và các ảnh được hỗ trợ. Backend tạo object key; key không chứa
   filename do admin cung cấp.
4. Cấu hình bucket private, CORS chỉ cho origin frontend quản trị và policy cho
   presigned PUT. Không đưa credential vào frontend.
5. `complete` phải xác minh object tồn tại/kích thước/content type theo metadata
   đã chấp nhận rồi mới attach asset. Quy định trạng thái intent hết hạn/thất
   bại và cơ chế xóa orphan object.

**Điều kiện hoàn thành:** API contract được hai repo cùng review; MinIO chấp
nhận upload trực tiếp từ origin admin mà browser không nhận secret.

### 2. Đổi luồng import Listening và chuẩn bị dữ liệu nhóm audio

Owner: backend + frontend

1. Đổi import Excel Listening để chỉ nhận workbook (câu hỏi, đáp án, giải
   thích); không yêu cầu MP3 trong import.
2. Backend tạo audio group dựa trên part và cấu trúc group đã import. Part 1/2
   tạo group theo câu; Part 3/4 tạo group theo cụm.
3. Revision/detail response trả về mỗi group với label/range câu hỏi, asset hiện
   tại, media status và lý do thiếu. Đồng thời trả về Reading image positions và
   cờ required.
4. Giữ tương thích dữ liệu hiện có theo một trong hai cách được chốt trước khi
   phát hành: biểu diễn `master-audio` cũ như media legacy chỉ-đọc, hoặc chặn
   chỉnh sửa revision cũ khỏi luồng mới. Không thực hiện migration trong scope
   này.

**Điều kiện hoàn thành:** import đề mới thành công khi không kèm MP3; revision
mới đọc được danh sách group và yêu cầu ảnh.

### 3. Xây client upload dùng presigned URL

Owner: frontend

1. Thêm typed API client trong `src/features/admin/` cho create intent,
   direct upload và complete; validate response ở boundary.
2. Thêm Next.js route handlers dưới `src/app/api/admin/...` chỉ để proxy các
   request nghiệp vụ có session tới backend. Browser PUT trực tiếp MinIO bằng
   URL trả về; không proxy byte tệp qua Next.js.
3. Thay các hàm multipart hiện tại trong `src/features/admin/exam-api.ts`
   (`uploadReadingImage`, `uploadReadingMasterAudio`) sau khi contract mới sẵn
   sàng. Không xóa endpoint cũ trước khi backend xác nhận strategy tương thích.
4. UI upload hiển thị chọn tệp, đang tải, tiến độ nếu có thể, thành công, lỗi
   có thể thử lại và trạng thái complete. Reset input sau mỗi lần để có thể chọn
   lại cùng tệp.
5. Kiểm tra client sớm theo file type/size để phản hồi nhanh, nhưng luôn xử lý
   lỗi validation từ backend/MinIO là nguồn quyết định.

**Điều kiện hoàn thành:** một upload thành công chỉ xuất hiện attached sau khi
`complete`; URL hết hạn/lỗi MinIO/lỗi complete không làm UI hiển thị asset giả.

### 4. Bổ sung workspace quản trị và cảnh báo thiếu media

Owner: frontend

1. Trong trang L&R admin, thêm section Listening Media: tổng số group, số đã
   có MP3, số thiếu, bảng nhóm với Part và dải câu, nút upload/thay thế.
2. Thêm phần Reading Media Requirements cho câu hỏi/context block có
   `imageRequired`; dùng image asset ID và metadata từ contract, không cho admin
   nhập URL tùy ý.
3. Mỗi trạng thái thiếu có link/focus đến đúng group hoặc Reading position. Mọi
   upload có label, thông báo lỗi và focus state phù hợp accessibility.
4. Giữ chức năng lưu nháp không phụ thuộc checklist. Khi nhấn publish, hiển thị
   checklist local; nếu backend trả lỗi validation, hiển thị lại các thiếu sót
   từ response.

**Điều kiện hoàn thành:** admin có thể xác định và đi thẳng tới mọi tài nguyên
còn thiếu, nhưng vẫn lưu được bản nháp.

### 5. Cổng publish và vận hành an toàn

Owner: backend + frontend

1. Backend recompute validation khi publish: tất cả audio group bắt buộc có
   asset audio completed; mọi Reading position `imageRequired` có asset image
   completed; asset phải thuộc đúng revision/content owner.
2. Publish trả lỗi có cấu trúc gồm type, owner ID, label/range và nguyên nhân để
   UI đưa admin tới đúng chỗ. Frontend không coi checklist cục bộ là quyền cho
   publish.
3. Ghi audit event cho tạo intent, complete/replace asset và publish fail do
   thiếu media; không ghi presigned URL/credential vào log.
4. Triển khai job/command được vận hành định kỳ để dọn intent hết hạn và object
   không được complete/attach, với thời gian grace được cấu hình.

**Điều kiện hoàn thành:** request publish bị chặn cả khi gọi trực tiếp API và
response cho admin biết chính xác mục cần sửa.

## Kiểm thử và nghiệm thu

### Backend/API

- Admin tạo intent hợp lệ/không hợp lệ; non-admin và request không same-origin
  bị từ chối theo chính sách hiện có.
- Intent giới hạn đúng MIME, kích thước, owner và expiry; complete thất bại khi
  object không tồn tại hoặc không hợp lệ.
- Part 1/2 tạo một group/câu, Part 3/4 tạo một group/cụm; không nhân bản MP3.
- Publish pass khi đủ media và fail với danh sách chính xác khi thiếu MP3/ảnh.
- Asset từ revision khác không thể attach trái phép.

### Frontend

- Parse và type-check response upload intent, completion và media checklist;
  test error/401 refresh/cancellation theo các API helper hiện có.
- Test direct PUT thành công, URL hết hạn/lỗi upload, complete lỗi và retry.
- Test import Listening không yêu cầu MP3; test nút publish disabled/checklist
  và lỗi backend được render rõ ràng.
- Test link/focus từ cảnh báo đến đúng audio group hoặc image field.

### Kiểm tra thủ công

1. Import workbook Listening không có media.
2. Xác nhận revision ở Draft và checklist liệt kê toàn bộ group thiếu.
3. Upload MP3 cho một group Part 3/4, kiểm tra nó phục vụ chung đúng dải câu.
4. Cấu hình ảnh Reading bắt buộc, upload ảnh và xác nhận trạng thái đổi sang
   hoàn thành chỉ sau complete.
5. Thử publish khi thiếu một mục (phải bị chặn), rồi upload đủ và publish (phải
   thành công).

## Tệp frontend dự kiến chạm tới khi bắt đầu code

- `src/features/admin/exam-api.ts` và test cạnh nó.
- `src/features/admin/lr-exercise-bank-api.ts` và các component data bank L&R.
- `src/features/admin/components/reading-exam-workspace.tsx` hoặc workspace L&R
  kế nhiệm khi contract tách Listening/Reading rõ ràng.
- `src/app/api/admin/exams/**` và route handlers media mới.
- Parser/types tại `src/features/admin/exam-management.ts`.

Danh sách cuối cùng phụ thuộc contract backend; repository backend hiện không
có trong workspace này để đối chiếu API contract.

## Không làm trong đợt này

- Migrate media đang tồn tại.
- Sửa UI hoặc player phía learner.
- Hỗ trợ upload hàng loạt/ZIP, transcoding, waveform, CDN hoặc deduplication.
- Mở public MinIO bucket hay lưu credential/presigned URL dài hạn trên client.
