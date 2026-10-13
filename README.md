# TOEICMaster Frontend

Frontend của phần mềm hỗ trợ học và luyện thi TOEIC.

**Công nghệ:** React 19, Next.js 16 (App Router), TypeScript, TailwindCSS 4. Dùng npm, Oxlint, Prettier và Vitest.

Ứng dụng chạy bằng Next.js. Vite xuất hiện trong dependencies vì Vitest dùng nó để chạy test, không phải công cụ chạy frontend của project.

## Chuẩn bị

- Git.
- Node.js 24 LTS, tối thiểu 24.21.0, và npm 11. Phiên bản chuẩn của nhóm nằm trong `.nvmrc`; CI đọc cùng file này.
- Backend TOEICMaster chạy tại `http://localhost:5287`.

Kiểm tra phiên bản:

```sh
node --version
npm --version
git --version
```

Nếu máy đang dùng Node.js 24.14.1 từ lần setup trước, cập nhật lên 24.21.0 hoặc bản vá mới hơn trong dòng 24 trước khi chạy. Với nvm trên macOS/Linux, dùng `nvm install` và `nvm use`; với nvm-windows, dùng `nvm install 24.21.0` rồi `nvm use 24.21.0`. Có thể cài từ [Node.js](https://nodejs.org/en/download) nếu không dùng nvm.

## Setup trên máy cá nhân (khuyến nghị khi lập trình)

Chạy frontend bằng `npm run dev` để giao diện tự cập nhật khi sửa code. Không cần Docker cho frontend; backend và Redis, MinIO, Mailpit vẫn có thể chạy bằng Docker theo README của repo backend.

1. Clone repo frontend và mở terminal tại thư mục repo:

   ```sh
   git clone <FRONTEND_REPO_URL> toeicmaster-fe
   cd toeicmaster-fe
   ```

   Thay `<FRONTEND_REPO_URL>` bằng URL GitHub của nhóm.

2. Tạo file cấu hình:

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   macOS/Linux:

   ```sh
   cp .env.example .env.local
   ```

   Giá trị mặc định:

   ```dotenv
   API_BASE_URL=http://localhost:5287
   GOOGLE_CLIENT_ID=<same Google Web Client ID configured in the backend>
   AUTH_SESSION_SECRET=<32 random bytes encoded as base64url>
   ```

   Nếu backend dùng địa chỉ khác, sửa giá trị này rồi khởi động lại frontend. Biến này chỉ dùng trên server Next.js.
   Tạo `AUTH_SESSION_SECRET` bằng `node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'`.
   Giữ bí mật giá trị này và dùng cùng một giá trị trên các instance frontend. `GOOGLE_CLIENT_ID` là public ID,
   phải khớp backend và cần cấu hình authorized JavaScript origin của Google cho địa chỉ frontend.

3. Cài dependency và chạy:

   ```sh
   npm ci
   npm run dev
   ```

4. Mở `http://localhost:3000`. Khi backend chạy, trang sẽ hiển thị trạng thái kết nối thành công.

Mỗi thành viên tự tạo `.env.local` trên máy mình; file này được Git bỏ qua. Không đưa credential database hoặc SMTP vào frontend.

## Chạy hằng ngày

Sau lần setup đầu tiên, mở terminal tại repo frontend và chạy:

```sh
npm run dev
```

Nếu trước đó đã chạy frontend bằng Docker, dừng container để giải phóng cổng `3000` trước:

```sh
docker compose stop frontend
npm run dev
```

Lệnh `stop frontend` chỉ dừng frontend trong repo này; các dịch vụ của repo backend vẫn chạy.

## Chạy bằng Docker (tùy chọn)

Docker đóng gói ứng dụng cùng Node.js và thư viện để môi trường chạy thống nhất. Cấu hình này dùng để kiểm tra bản build, phục vụ CI và chuẩn bị triển khai sau này. Docker không bắt buộc khi lập trình frontend.

Container hiện tại chạy bản build production, không tự cập nhật khi sửa code. Sau khi sửa code, chạy lại `docker compose up -d --build` để build và cập nhật container; nếu dùng shared network, chạy lại lệnh có cả hai file Compose bên dưới.

Cần Docker Desktop đang chạy Linux containers hoặc Docker Engine có Compose v2.

Nếu backend chạy trên máy host:

```sh
docker compose --env-file .env.local up -d --build
```

Mở `http://localhost:3000`. Container frontend gọi backend qua `host.docker.internal:5287`.

Nếu cả hai repo chạy trong Docker, dùng shared network để hoạt động giống nhau trên Windows/macOS/Linux:

```sh
docker network create toeicmaster-local
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.shared.yml up -d --build
```

Chạy backend với override `docker-compose.shared.yml` của repo backend. Network chỉ cần tạo một lần; nếu đã tồn tại, bỏ qua lệnh tạo.

Xem log và dừng frontend:

```sh
docker compose logs -f frontend
docker compose down
```

## Lệnh thường dùng

| Lệnh             | Mục đích                                          |
| ---------------- | ------------------------------------------------- |
| `npm run dev`    | Chạy development server, tự cập nhật khi sửa code |
| `npm run check`  | Kiểm tra format, lint, TypeScript, test và build  |
| `npm run format` | Format code                                       |
| `npm test`       | Chạy tests                                        |
| `npm run audit`  | Kiểm tra dependency                               |
| `npm run build`  | Build standalone                                  |
| `npm start`      | Chạy bản build; đọc `.env.local` nếu có           |

## Cấu trúc

For new features, see the [feature development guide](docs/feature-development.md) for file placement, an existing code path, and verification steps. The [authentication contract](docs/authentication.md) describes session and registration behavior. The **User story** template in `.github/ISSUE_TEMPLATE/` captures acceptance criteria and implementation context for AI.

```text
src/
  app/                Route, layout và Next.js route handlers
  features/           Code theo từng tính năng
  shared/             HTTP client và code dùng chung
scripts/              Chuẩn bị output standalone
.github/              CI, publish image và template Issue
```

Trạng thái kết nối gọi `/api/system/ping` trên Next.js, rồi gọi `/api/system/ping` của backend.

## Xử lý lỗi thường gặp

- **Không kết nối được dịch vụ:** kiểm tra backend đang chạy, `API_BASE_URL` và cổng 5287.
- **Cổng 3000 bị chiếm:** nếu container frontend đang chạy, dùng `docker compose stop frontend` trước khi chạy `npm run dev`; nếu ứng dụng khác đang dùng cổng, dừng ứng dụng đó hoặc chạy `npm run dev -- --port 3001`.
- **npm ci báo dependency không khớp:** kiểm tra đúng Node/npm và lấy `package-lock.json` mới nhất; không xóa lock file để bỏ qua lỗi.

## CI và làm việc nhóm

Workflow được điều chỉnh từ [UGTM](https://github.com/karasuma-2401/UGTM/tree/772b2157457bd9d4aabc316c770dfbd90ee79549), chạy CI khi PR/push vào `dev` hoặc `main`. Publish image lên GHCR chỉ chạy sau CI thành công của push từ chính repo.

Feature/fix branch mở PR vào `dev`; release qua PR từ `dev` vào `main`. Khi tạo repo GitHub, push workflow vào default branch `main` và cho phép Actions publish package bằng `GITHUB_TOKEN`. Deploy Azure sẽ cấu hình khi VPS sẵn sàng.

GitHub Actions được ghim commit SHA và dùng Node 24 cho các JavaScript actions. Khi cập nhật dependency, commit cả `package.json` và `package-lock.json`, chạy `npm run check` và `npm run audit`. Các flow học tập và browser E2E tests sẽ bổ sung theo backlog.

<details>
<summary>Giấy phép cấu hình tham khảo UGTM (MIT)</summary>

```text
MIT License

Copyright (c) 2026 Win Transparent Pear

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

</details>
