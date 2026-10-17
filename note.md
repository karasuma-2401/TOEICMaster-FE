# Ghi chú màu sắc đặc trưng của TOEICMaster

Ghi nhận từ code giao diện hiện tại, chủ yếu tại `src/app/globals.css`, `src/features/auth/components/auth-layout.tsx`, các component xác thực/hồ sơ, `src/features/user/components/brand-mark.tsx` và `src/app/page.tsx`.

## Bảng màu thương hiệu

Giao diện xác thực và hồ sơ sử dụng tông **cam – đỏ ấm** làm màu nhận diện chính, kết hợp điểm nhấn vàng và nền trung tính sáng.

| Vai trò         | Màu tiêu biểu                   | Cách dùng                                               |
| --------------- | ------------------------------- | ------------------------------------------------------- |
| Đỏ thương hiệu  | `#ED361C`, `#EC251B`, `#C70E1A` | Liên kết, trạng thái focus, tiêu đề phụ và dải màu nhấn |
| Cam thương hiệu | `#FF6C0D`, `#FF681A`, `#F17939` | Nút hành động, chuyển sắc hero và avatar                |
| Vàng điểm nhấn  | `#FFD361`, `#FFBD44`, `#FF9F25` | Logo, chữ nhấn, avatar và chi tiết minh họa             |
| Nền sáng        | `#FFFDFC`, `#FAF8F7`, `#F5F1EF` | Form, thẻ, nền trang và vùng điều khiển                 |
| Chữ tối ấm      | `#342D2A`, `#3D3532`, `#4E4542` | Tiêu đề, nội dung và nhãn biểu mẫu                      |
| Chữ phụ         | `#A89F9B`, `#938B87`, `#736A66` | Mô tả, placeholder phụ và nội dung ít nhấn              |

## Đặc điểm thể hiện trong giao diện

- Nút chính thường là chuyển sắc ngang từ đỏ `#EC251B` sang cam `#FF6C0D`, chữ trắng, bóng màu cam đỏ nhẹ.
- Hero của đăng nhập/đăng ký dùng chuyển sắc từ cam `#FF681A` qua đỏ `#ED261A` đến đỏ sẫm `#C70E1A`; vàng được dùng để tạo điểm nhấn.
- Logo gồm hai mảng vàng cam (`#FF9F25`, `#FFBD44`) và một mảng đỏ sẫm (`#B31322`), phù hợp với tông ấm chung.
- Nền form và hồ sơ là trắng ngà; viền và vùng phụ dùng be/xám ấm như `#E7DEDA`, `#EEE8E5`, `#F5F1EF`. Chữ chính là nâu than thay vì đen tuyệt đối.
- Lỗi biểu mẫu dùng đỏ; thông báo chờ/xác nhận thường dùng nền amber nhạt; toast thành công dùng xanh lá `#18A558`.

## Lưu ý về tính nhất quán

Trang chủ hiện tại (`src/app/page.tsx`) vẫn dùng xanh Tailwind (`blue-700`, `blue-50`) và slate (`slate-200` đến `slate-600`), trong khi các màn hình xác thực và hồ sơ dùng bảng màu cam–đỏ. Vì vậy, **cam–đỏ là bảng màu thương hiệu thể hiện rõ nhất trong các luồng giao diện đã hoàn thiện**, nhưng toàn ứng dụng hiện chưa đồng nhất màu sắc. Các biến CSS nền chung trong `src/app/globals.css` (`#F8FAFC`, `#0F172A`) và màu xanh của trang chủ cũng chưa phản ánh bảng màu ấm này.

Nếu tiếp tục hoàn thiện nhận diện, nên thống nhất trang chủ và biến màu nền/chữ dùng chung với tông cam–đỏ và trung tính ấm; giữ xanh lá cho trạng thái thành công và các màu đỏ/amber theo ngữ nghĩa cảnh báo.
