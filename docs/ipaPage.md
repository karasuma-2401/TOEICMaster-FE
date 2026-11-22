# Spec: Trang luyện phát âm IPA cho Learner

| Mục        | Giá trị                                                           |
| ---------- | ----------------------------------------------------------------- |
| Jira       | CNPMCS-60 (epic CNPMCS-55)                                        |
| Phụ trách  | Tân Mai Phú                                                       |
| Thời hạn   | Tuần 1 Sprint 3 (2026-11-15 → 2026-11-22)                         |
| Trạng thái | Spec, chưa code                                                   |
| Phạm vi    | Chỉ phía Learner, không làm trang quản lý cho Admin               |
| Route      | `/pronunciation` (học viên), `/api/pronunciation/*` (BFF Next.js) |

## 1. Mục tiêu

Học viên mở một trang có đủ 44 âm IPA, gồm 12 nguyên âm đơn, 8 nguyên âm đôi và
24 phụ âm. Khi chọn một âm, học viên nghe âm mẫu, đọc hướng dẫn khẩu hình, xem từ
ví dụ, rồi ghi âm giọng mình. Hệ thống **chấm phát âm của người nói** và chỉ ra
âm mục tiêu đọc đúng hay sai.

### Đối chiếu Acceptance Criteria

| AC trong Jira                                                         | Đáp ứng bằng                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Hiển thị đầy đủ bảng IPA (Nguyên âm & Phụ âm), phân nhóm rõ ràng      | `IpaChart`: 3 nhóm, phụ âm xếp theo cặp vô thanh/hữu thanh (§7.3)              |
| Chọn âm: xem ký hiệu, mô tả cách phát âm, từ ví dụ, nghe audio chuẩn  | `SoundDetailPanel`: audio mẫu, khẩu hình, từ ví dụ có nút nghe (§7.4)          |
| Thực hành ghi âm/đọc theo, nhận phản hồi và nghe lại bản thu của mình | `PracticeRecorder` và `AssessmentResult`: ghi âm → chấm AI → nghe lại (§8, §9) |

## 2. Tính năng riêng, tách khỏi Speaking

Phát âm IPA là **một mục riêng** của learner, ngang hàng với Listening & Reading,
Speaking, Writing. Không phải một Part, một tab hay một màn hình con của Speaking.

| Khía cạnh     | Phát âm IPA (tính năng này)                                       | Không làm                                                              |
| ------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Menu          | Mục riêng "Phát âm", `href="/pronunciation"`                      | Đặt link trong trang `/speaking` hoặc trong `SpeakingHeader`           |
| Route         | `src/app/pronunciation/**`                                        | Đặt dưới `src/app/speaking/**`                                         |
| Feature       | `src/features/pronunciation/**`                                   | Thêm file vào `src/features/speaking/**`                               |
| BFF           | `src/app/api/pronunciation/assessments`                           | Thêm path vào `speaking-proxy.ts` hoặc `/api/speaking/[...segments]`   |
| Backend       | `PronunciationController`, route `api/v1/pronunciation`           | Thêm action vào controller Speaking, sửa `AzureSpeakingSpeechAssessor` |
| Ghi âm        | Hook riêng `use-pronunciation-recorder.ts`                        | Dùng hoặc sửa `useVoiceRecorder`                                       |
| Giao diện     | Khung của `ExamLibrary` dùng chung (`sp-theme` + `sp-font`, §7.1) | Bọc `sp-learner`, dùng component trong `speaking/components`           |
| Tài liệu      | File này (`docs/ipaPage.md`)                                      | Ghi vào `docs/speaking-be-handoff.md` hoặc spec của Speaking           |
| Lịch sử, điểm | Không lưu lượt luyện lên server; không hiện ở `/history`          | Ghi vào lịch sử hoặc điểm Speaking                                     |

Thứ duy nhất lấy từ thư mục `features/speaking` là `fonts.ts` và
`speaking-theme.css` (chỉ để có class `sp-font`). Writing, Listening & Reading và
Lịch sử cũng import đúng hai file này, nên đây là font chung của mọi trang
learner, không phải phụ thuộc vào logic Speaking.

## 3. Ranh giới: không sửa code của người khác

Toàn bộ tính năng nằm trong **file và thư mục mới**. Không refactor, không
format lại, không đổi hành vi của code hiện có.

| Được làm                                                                                                                                                                           | Không được làm                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Tạo `src/features/pronunciation/**`, `src/app/pronunciation/**`, `src/app/api/pronunciation/**`                                                                                    | Sửa file trong `src/features/speaking/**`, `writing/**`, `lr-exam/**`, `admin/**` |
| Tạo `public/audio/ipa/**`                                                                                                                                                          | Chuyển `useVoiceRecorder` sang `shared/` hoặc thay đổi chữ ký hàm của nó          |
| **Import (chỉ đọc)** từ `src/shared/**`, `features/user/components/user-menu`, `features/speaking/fonts.ts` + `speaking-theme.css` (chỉ cho `sp-font`, §2), các helper auth ở §9.3 | Sửa `speaking-theme.css`, `styles.ts` hoặc component trong `shared/`              |
| Thêm test mới cạnh code mới                                                                                                                                                        | Xóa hoặc sửa test hiện có; đổi lockfile, config hoặc CI                           |

**Hai điểm tích hợp bắt buộc phải chạm vào code chung.** Mỗi điểm làm thành một
PR nhỏ riêng và cần chủ code duyệt:

1. **Menu learner.** Thêm một dòng
   `{ id: "pronunciation", label: "Phát âm", href: "/pronunciation" }` vào mảng
   `navigation` trong `src/shared/components/practice/skill-header.tsx` và mảng
   `navigation` trong `src/app/page.tsx` (mảng này không có `id`, chỉ thêm
   `{ label: "Phát âm", href: "/pronunciation" }`). Chèn **trước** "Lịch sử", để
   `milestoneLinks = navigation.slice(0, 3)` ở trang chủ vẫn chỉ lấy 3 kỹ năng
   thi. Thêm `"pronunciation"` vào union `PracticeNavId`. Trước khi PR này được
   merge, `PronunciationHeader` render `SkillHeader` mà không truyền `active`,
   và trang vẫn vào được bằng URL trực tiếp.

   Cùng PR này (không bắt buộc): thêm một mục `{ match: /^\/pronunciation/, … }`
   vào `src/shared/components/mascot/mascot-tips.ts` để mascot có mẹo riêng cho
   trang IPA. Chưa merge thì mascot hiện mẹo mặc định, không ảnh hưởng chức năng.

2. **Backend.** Endpoint chấm phát âm (§9.1) là controller, handler và assessor
   **mới**. File cũ duy nhất phải động vào là chỗ đăng ký DI. Không sửa
   `AzureSpeakingSpeechAssessor`.

## 4. Hiện trạng (khảo sát lại ngày 2026-11-20, nhánh `feat/fixUser_mergeUI` @ `740762f`)

- Chưa có route, feature, mục menu hay API nào cho IPA. Contract backend
  (`TOEICMaster-BE/docs/contracts/api-contract.md`) chưa có mục pronunciation.
- Menu learner là `SkillHeader`: 4 mục "Listening & Reading", "Speaking",
  "Writing", "Lịch sử". Trên desktop là thanh ngang, dưới `md` chuyển thành
  sidebar trượt nhờ `HeaderMenu`. Trang chủ có một mảng `navigation` riêng và
  `milestoneLinks = navigation.slice(0, 3)`.
- Cách các trang learner dựng layout:
  - Speaking: `sp-theme sp-learner` + `speaking-learner.css`. Giao diện riêng của
    Speaking, token `--sp-*` chỉ tồn tại bên trong `.sp-theme`.
  - Writing, Listening & Reading, Lịch sử: `sp-font ${speakingFontClasses}` +
    `<GuideMascot />`, màu dùng Tailwind và class trong
    `shared/components/practice/styles.ts`. Không dùng biến `--sp-*`.
- BFF của Listening & Reading (`lr-exam/server/lr-proxy.ts`) chỉ import helper
  từ `features/auth/server/*`, không import từ `features/speaking`.
- Backend đã có `AzureSpeakingSpeechAssessor` (chấm mức **từ**, `Granularity = "Word"`)
  và `ISpeakingAudioConverter`, chuyển webm/ogg/mp4 sang WAV PCM 16 kHz. Cả hai gắn
  với luồng làm bài Speaking; chưa có endpoint nào chấm một từ đơn lẻ ở mức **âm vị**.

## 5. Kiến trúc tổng quan

```text
/pronunciation (Server Component)
  ├─ IpaChart (Server)            ← dữ liệu tĩnh ipa-sounds.ts
  └─ SoundDetailPanel ("use client", đọc ?sound=<slug>)
       ├─ <audio> mẫu             ← /audio/ipa/<slug>.mp3 (static)
       ├─ Từ ví dụ: nghe TTS      ← speechSynthesis (en-US)
       └─ PracticeRecorder
            ghi âm (MediaRecorder) → POST /api/pronunciation/assessments (multipart)
                                     → Next.js BFF (server) → POST {API_BASE_URL}/api/v1/pronunciation/assessments
                                     → Backend → ISpeakingAudioConverter → Azure Pronunciation Assessment
                                                 (Granularity=Phoneme, PhonemeAlphabet=IPA, ReferenceText=<từ>)
            ← điểm từ + điểm từng âm vị → AssessmentResult
```

**Quyết định chính:**

- **Dữ liệu 44 âm là tĩnh, nằm trong frontend.** Bảng IPA không đổi và task không
  có trang Admin, nên không cần bảng dữ liệu ở backend.
- **Chấm trên một từ ví dụ, không chấm âm đứng riêng.** Dịch vụ nhận dạng không
  chấm ổn định một âm phát riêng như /θ/. Ta chấm cả từ (ví dụ `think`), rồi lấy
  điểm của âm vị mục tiêu trong từ đó.
- **Trình duyệt không bao giờ gọi Azure trực tiếp.** Key Azure chỉ có ở backend.
  Trình duyệt chỉ gọi route same-origin.

## 6. Cấu trúc thư mục (toàn bộ là file mới)

```text
src/app/pronunciation/
  layout.tsx                    # sp-font + font + GuideMascot (giống app/writing/layout.tsx)
  page.tsx                      # Server Component: PracticePage + Breadcrumbs + PageIntro + PronunciationWorkspace
src/app/api/pronunciation/assessments/
  route.ts                      # POST → forwardPronunciationAssessment
src/features/pronunciation/
  ipa-sounds.ts                 # 44 âm, kiểu dữ liệu, hàm tra cứu theo slug/nhóm
  ipa-sounds.test.ts
  assessment.ts                 # kiểu kết quả + parseAssessment(unknown) + chấm âm mục tiêu
  assessment.test.ts
  api.ts                        # assessPronunciation(blob, word, signal)
  api.test.ts
  practice-progress.ts          # đọc/ghi localStorage các âm đã luyện (try/catch)
  practice-progress.test.ts
  hooks/
    use-pronunciation-recorder.ts       # hook ghi âm riêng, 1 bản thu, tự dừng sau 5 giây
    use-pronunciation-recorder.test.tsx
    use-word-speech.ts                  # TTS cho từ ví dụ
  components/
    pronunciation-header.tsx    # SkillHeader + UserMenu (giống writing-header.tsx)
    pronunciation-workspace.tsx # "use client": đồng bộ ?sound, bố cục 2 cột
    ipa-chart.tsx               # bảng 3 nhóm
    ipa-sound-tile.tsx          # 1 ô âm
    group-filter.tsx            # Tất cả / Nguyên âm đơn / Nguyên âm đôi / Phụ âm
    sound-detail-panel.tsx      # chi tiết âm đang chọn
    sample-audio-button.tsx     # nút nghe audio mẫu
    example-word-list.tsx       # từ ví dụ + phiên âm + nút nghe + chọn từ để luyện
    practice-recorder.tsx       # máy trạng thái ghi âm/chấm
    assessment-result.tsx       # điểm + chip âm vị + gợi ý sửa
    *.test.tsx
  server/
    pronunciation-proxy.ts      # validate + forward tới backend
    pronunciation-proxy.test.ts
    upstream.ts                 # backendBase, readMultipart, relay: bản riêng, không import từ speaking
public/audio/ipa/
  <slug>.mp3                    # 44 file audio mẫu
  CREDITS.md                    # nguồn và giấy phép từng file
```

**Vì sao viết hook ghi âm riêng thay vì dùng `useVoiceRecorder` của Speaking?**
Hook của Speaking quản lý nhiều bản thu theo số câu và đo mic cho phòng thi.
Trang IPA chỉ cần một bản thu ngắn, tự dừng sau tối đa 5 giây, và phải ghi đè khi
thu lại. Hook riêng giúp không phụ thuộc vào thay đổi của nhóm Speaking. Cách xin
quyền mic, phát hiện trình duyệt không hỗ trợ và thu hồi object URL làm **giống**
hook của Speaking để hành vi nhất quán.

## 7. UI: đồng nhất với các trang kỹ năng hiện có

### 7.1 Khung trang

Trang IPA theo khung của **`ExamLibrary`** (`shared/components/practice/exam-library.tsx`),
component dùng chung mà trang Listening & Reading và Writing đang dùng. Khung này bọc
`sp-theme` để lấy token `--sp-*`; đây là token của component dùng chung, không phải
giao diện riêng của Speaking. Không dùng `sp-learner` và không import component nào
trong `features/speaking/components` (§2). Các khối dùng chung chỉ được import, không sửa.

| Thành phần       | Cách làm                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Layout, font     | `app/pronunciation/layout.tsx` giống `app/writing/layout.tsx`: `sp-font` + `speakingFontClasses` + `<GuideMascot />`  |
| Khung trang      | `<div className="sp-theme min-h-dvh bg-white">`, `SkillHeader` có `wide`, `main` dùng `wideContainer pb-12 pt-6`      |
| Đường dẫn        | `Breadcrumbs`: Trang chủ / Phát âm                                                                                    |
| Tiêu đề          | Nhãn nhỏ `rounded-md text-xs uppercase`, `h1` `text-[28px] font-bold leading-9`, mô tả `text-[15px]` màu `--sp-ink-2` |
| Ô thống kê       | Giống ô "Thành tích cao nhất": `rounded-2xl border px-[18px] py-4 sm:w-60`, số `text-[36px] font-bold text-[#f4511e]` |
| Bộ lọc, từ mẫu   | Pill giống nút chọn Part: `rounded-[10px] border px-4 text-sm`; đang chọn `--sp-orange-soft` + `--sp-brand`           |
| Ô âm, thẻ        | `rounded-2xl border border-(--sp-line)/70 bg-white`, hover `--sp-hero-line` + `--sp-shadow-card`                      |
| Tiêu đề nhóm     | `h2` `text-lg font-semibold`, số âm `text-[13px]` màu `--sp-ink-2`                                                    |
| Nút chính        | `primaryAction`, `secondaryAction` trong `styles.ts`                                                                  |
| Nghe lại bản thu | `TakePlayback` riêng của feature, chép bố cục "Nghe lại bản thu trước" của Speaking (nền `--sp-subtle`, giờ `mm:ss`)  |
| Trạng thái lỗi   | `InlineError`, `ErrorPanel` trong `state-panels.tsx`                                                                  |

**Chữ và màu**

- Một font cho cả trang, kể cả ký hiệu IPA. Không đặt font riêng cho ký hiệu.
- `font-bold` chỉ cho `h1` và con số lớn; tiêu đề mục dùng `font-semibold`; còn lại là chữ thường.
- Chữ phụ dùng `--sp-ink-2`, cỡ `13px`/`15px` như trang thư viện đề.
- Không gradient, không màu riêng cho từng nhóm âm. Màu cam chỉ cho trạng thái đang chọn
  và con số kết quả; điểm từng âm chỉ đổi màu chữ (`--sp-success`, `--sp-warning`, `--sp-danger`).
- Không thêm khối hướng dẫn từng bước hay câu khen; chỉ giữ nội dung: cách phát âm, lỗi thường gặp, từ mẫu.

### 7.2 Bố cục theo breakpoint

```text
Desktop ≥ lg                                         Mobile < lg
┌──────────────────────────────────────────────┐     ┌──────────────────────┐
│ SkillHeader (… Writing · Phát âm · Lịch sử)  │     │ Logo            [≡]  │ ← ≡ mở sidebar có "Phát âm"
├──────────────────────────────────────────────┤     ├──────────────────────┤
│ PHÁT ÂM · IPA                                │     │ PageIntro            │
│ Bảng phiên âm quốc tế IPA          [đã 5/44] │     │ [Tất cả][Đơn][Đôi]…  │ ← cuộn ngang
│ [Tất cả][Nguyên âm đơn][Nguyên âm đôi][Phụ âm]│     │ ┌──┬──┬──┬──┐        │
├────────────────────────────┬─────────────────┤     │ │iː│ɪ │ʊ │uː│ 4 cột  │
│ Nguyên âm đơn  12 âm       │  /θ/  Phụ âm    │     │ └──┴──┴──┴──┘        │
│ ┌──┬──┬──┬──┬──┬──┐        │  ▶ Nghe mẫu     │     │ …                    │
│ │iː│ɪ │ʊ │uː│e │ə │        │  Khẩu hình …    │     ├──────────────────────┤
│ ├──┼──┼──┼──┼──┼──┤        │  Từ ví dụ       │     │ SoundDetailPanel     │ ← chọn âm thì cuộn tới đây
│ │ɜː│ɔː│æ │ʌ │ɑː│ɒ │        │  think ▶ [Luyện]│     │  + PracticeRecorder  │
│ └──┴──┴──┴──┴──┴──┘        │  ── Luyện tập ──│     └──────────────────────┘
│ Nguyên âm đôi  8 âm        │  ● Ghi âm  0:03 │
│ Phụ âm  24 âm (cặp)        │  Kết quả: 82    │
└────────────────────────────┴─────────────────┘
```

- Lưới ô âm: 4 cột (mobile), 6 cột (`sm`), 6 cột (`lg`, vì cột main hẹp lại).
  Phụ âm hiển thị theo **cặp** vô thanh/hữu thanh (p–b, t–d, …) để thấy sự đối lập.
- Dưới `lg`: `PracticeColumns` tự xếp panel xuống dưới bảng. Khi chọn âm, gọi
  `scrollIntoView({ behavior: "smooth", block: "start" })` tới panel, rồi focus
  vào heading của panel (`tabIndex={-1}`).
- Không cuộn ngang toàn trang. Bộ lọc nhóm được phép cuộn ngang trong khung của
  nó (`overflow-x-auto`).

### 7.3 Ô âm (`IpaSoundTile`)

- Là một `<button type="button">`, không dùng `div` gắn `onClick`.
- Nội dung: ký hiệu lớn (`text-2xl font-bold`), một từ ví dụ nhỏ bên dưới, dấu ✓
  nhỏ ở góc nếu âm đã luyện (đọc từ `practice-progress`).
- `aria-label="Âm /θ/, ví dụ think"`, `aria-pressed={selected}`, chiều cao tối thiểu 44px.
- Bàn phím: Tab đi lần lượt qua các ô, Enter/Space để chọn. Không cần di chuyển bằng phím mũi tên.
- Mỗi nhóm là một `<section aria-labelledby>` có tiêu đề `<h2>`.

### 7.4 Panel chi tiết (`SoundDetailPanel`)

Thứ tự nội dung từ trên xuống:

1. Ký hiệu `/θ/` (`<h2>`), chip nhóm và nhóm con (ví dụ "Phụ âm · vô thanh"), nút
   **Nghe mẫu** (`SampleAudioButton`, dùng phần tử `<audio>` có `preload="none"`).
2. **Cách phát âm:** 2–4 bước ngắn về vị trí lưỡi, môi, dây thanh.
3. **Lỗi người Việt hay gặp:** 1 dòng, ví dụ "Hay đọc thành /t/ hoặc /s/".
4. **Từ ví dụ:** 3 từ. Mỗi từ có phiên âm (phần chứa âm mục tiêu được tô màu
   nhóm), nút ▶ (TTS) và nút **Luyện từ này** (đặt làm `referenceText` cho bộ ghi âm).
5. `PracticeRecorder` (§8).

Khi chưa chọn âm nào (không có `?sound`), dùng `EmptyPanel`: "Chọn một âm trong
bảng để bắt đầu". Khi `?sound` sai, cũng hiện trạng thái rỗng, kèm `InlineError`
"Không tìm thấy âm này".

### 7.5 Trạng thái trên URL và tiến độ

- `?sound=<slug>` (ví dụ `?sound=th-voiceless`). Đổi âm bằng
  `router.replace(..., { scroll: false })` để không tạo nhiều mục history. Link
  có thể chia sẻ, F5 không mất âm đang chọn.
- `?group=monophthong|diphthong|consonant` cho bộ lọc (không bắt buộc).
- Tiến độ "đã luyện 5/44" lưu trong `localStorage` (`toeicmaster.ipa.practiced`).
  Mọi lần đọc/ghi đều bọc `try/catch`. Thiếu `localStorage` thì trang vẫn chạy
  bình thường, chỉ không hiện ✓.

## 8. Luyện tập và chấm phát âm của người nói (bắt buộc)

### 8.1 Luồng người dùng

1. Chọn âm, rồi chọn một từ ví dụ (mặc định là từ đầu tiên).
2. Bấm **Ghi âm**. Lần đầu trình duyệt xin quyền mic.
3. Đọc từ đó. Thanh mức âm lượng nhảy theo giọng. Đồng hồ đếm tối đa 5 giây.
   Bấm **Dừng** hoặc để tự dừng.
4. Bản thu được tự động gửi đi chấm. Trong lúc chờ, panel hiện "Đang chấm phát âm…".
5. Hiện kết quả (§8.3). Học viên có thể **Nghe bản thu**, **Nghe mẫu**, **Thu lại**,
   hoặc chọn từ khác.

### 8.2 Máy trạng thái của `PracticeRecorder`

```text
idle ──Ghi âm──▶ requesting ──cấp quyền──▶ recording ──Dừng/5s──▶ assessing ──200──▶ result
  ▲                 │ từ chối                 │ mic mất            │ lỗi             │
  │                 ▼                         ▼                    ▼                 │
  └──── Thu lại ── denied / unsupported    error ◀────────────── error ◀────────────┘
```

| Trạng thái    | UI                                                                                  |
| ------------- | ----------------------------------------------------------------------------------- |
| `idle`        | Nút `primaryAction` "Ghi âm", dòng "Đọc từ **think**"                               |
| `requesting`  | Nút bị disabled, "Đang xin quyền micro…"                                            |
| `recording`   | Chấm đỏ nhấp nháy (`bg-red-600 animate-pulse`), đồng hồ, thanh âm lượng, nút "Dừng" |
| `assessing`   | Spinner giống `LoadingPanel`, nút "Hủy" (gọi `AbortController.abort()`)             |
| `result`      | `AssessmentResult` + `<audio controls>` phát bản thu + "Thu lại"                    |
| `denied`      | `InlineError`: hướng dẫn bật quyền mic trong trình duyệt                            |
| `unsupported` | `InlineError`: "Trình duyệt chưa hỗ trợ ghi âm"; phần nghe mẫu vẫn dùng được        |
| `error`       | `ErrorPanel` có nút "Thử lại", thông báo theo mã lỗi ở §9.2                         |

Các quy tắc:

- **Bản thu quá ngắn** (dưới 0,3 giây) hoặc âm lượng gần 0 suốt quá trình: không
  gửi lên server, báo "Không nghe thấy giọng, hãy thử lại gần micro hơn".
- **Dừng stream mic khi rời trang hoặc đổi âm.** Thu hồi object URL cũ khi thu lại
  hoặc khi unmount.
- **Chỉ gửi một request tại một thời điểm.** Khi đổi âm hoặc đổi từ trong lúc
  đang chấm thì hủy request cũ.
- **Giữ 3 lần thử gần nhất của âm hiện tại** trong state, chỉ dùng trên trang này
  và không lưu lại sau khi rời trang. Mục đích là để học viên thấy mình tiến bộ.
- Có `aria-live="polite"` cho trạng thái và kết quả, để trình đọc màn hình đọc lên.

### 8.3 Kết quả (`AssessmentResult`)

- **Điểm âm mục tiêu** (số lớn) và nhãn:
  - ≥ 80: "Tốt", màu emerald (§7.1).
  - 60–79: "Khá, gần đúng", màu amber.
  - < 60: "Cần luyện thêm", màu red.
- **Điểm cả từ:** `accuracyScore`, kèm `pronunciationScore` dạng thanh tiến độ.
- **Chip âm vị** của cả từ, ví dụ `θ ɪ ŋ k`. Mỗi chip tô màu theo điểm, chip âm
  mục tiêu có viền đậm. `title`/`aria-label` của chip là "θ: 54 điểm".
- **Hệ thống nghe ra âm gì:** nếu âm có điểm cao nhất trong `candidates` khác âm
  mục tiêu thì hiện câu "Hệ thống nghe giống /s/ hơn /θ/". Sau đó hiện gợi ý lỗi
  hay gặp trong `ipa-sounds.ts`, ví dụ `confusions: { s: "Đặt đầu lưỡi giữa hai hàm răng, …" }`.
- **Từ nhận dạng khác từ mục tiêu** (`recognizedText`, ví dụ nghe ra "sink"):
  hiện "Hệ thống nghe thành **sink**".
- **`NoSpeech`:** "Không nhận ra giọng nói", nút "Thu lại".
- Khi chấm thành công, đánh dấu âm là đã luyện trong `practice-progress`.

**Tính điểm âm mục tiêu** (hàm `scoreTargetPhoneme` trong `assessment.ts`, thuần, có test):

1. Lấy danh sách âm vị Azure trả về cho từ đó.
2. Tìm các âm vị nằm trong `azurePhonemes` của âm đang luyện (bảng ánh xạ §10.2).
3. Âm nhiều ký hiệu (ví dụ /ɪə/ → `ɪ ɹ`) lấy trung bình.
4. Âm xuất hiện nhiều lần trong từ: lấy điểm thấp nhất.
5. Không tìm thấy âm nào: trả về `null`. Khi đó UI chỉ hiện điểm cả từ, kèm ghi
   chú "Không tách được điểm riêng cho âm này".

### 8.4 Khi không dùng được chấm AI

Việc chấm là bắt buộc, nhưng trang vẫn phải dùng được khi dịch vụ lỗi:

- `401`: hiện "Đăng nhập để được chấm phát âm" và link `/login`. Bản thu vẫn nghe
  lại được.
- `503 NOT_CONFIGURED` hoặc lỗi upstream: hiện `ErrorPanel` "Chưa chấm được lúc
  này". Vẫn cho nghe bản thu và nghe mẫu để học viên tự so sánh.
- Không có phương án dự phòng chấm ở phía client. Web Speech API không cho điểm
  theo âm vị, nên không dùng nó để giả lập điểm.

## 9. API

### 9.1 Đề xuất contract backend (cần chốt với nhóm BE trước khi code)

`POST /api/v1/pronunciation/assessments`, gửi dạng `multipart/form-data`:

| Field           | Bắt buộc | Ràng buộc                                                                             |
| --------------- | -------- | ------------------------------------------------------------------------------------- |
| `file`          | Có       | `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/wav`; tối đa 1 MiB; dài tối đa 10 giây |
| `referenceText` | Có       | 1–40 ký tự, chỉ gồm chữ cái tiếng Anh, khoảng trắng, `'` và `-`                       |
| `locale`        | Không    | Mặc định `en-US`                                                                      |

Phản hồi `200`:

```json
{
  "recognitionStatus": "Recognized",
  "referenceText": "think",
  "recognizedText": "think",
  "accuracyScore": 78.0,
  "pronunciationScore": 80.5,
  "completenessScore": 100.0,
  "words": [
    {
      "word": "think",
      "accuracyScore": 78.0,
      "errorType": "None",
      "phonemes": [
        {
          "phoneme": "θ",
          "accuracyScore": 54.0,
          "candidates": [
            { "phoneme": "s", "score": 71.0 },
            { "phoneme": "θ", "score": 54.0 }
          ]
        },
        { "phoneme": "ɪ", "accuracyScore": 92.0, "candidates": [] },
        { "phoneme": "ŋ", "accuracyScore": 88.0, "candidates": [] },
        { "phoneme": "k", "accuracyScore": 95.0, "candidates": [] }
      ]
    }
  ]
}
```

`recognitionStatus` có thể là `Recognized` hoặc `NoSpeech`. Khi là `NoSpeech`,
mọi điểm bằng 0 và `words` là `[]`.

Lỗi trả về dạng ProblemDetails, giống các API hiện có:

| Status  | `code`                                     | Khi nào                                  |
| ------- | ------------------------------------------ | ---------------------------------------- |
| 400     | `INVALID_AUDIO` / `INVALID_TEXT`           | Sai định dạng hoặc thiếu field           |
| 401     | —                                          | Chưa đăng nhập                           |
| 413     | —                                          | File vượt 1 MiB                          |
| 422     | `SPEECH_REJECTED`                          | Azure không xử lý được bản ghi           |
| 429     | —                                          | Vượt rate limit; có header `Retry-After` |
| 502/504 | `SPEECH_PROVIDER_ERROR` / `SPEECH_TIMEOUT` | Azure lỗi hoặc chậm                      |
| 503     | `NOT_CONFIGURED`                           | Chưa cấu hình Azure                      |

**Ghi chú phía backend (để nhóm BE triển khai):**

- **Chỉ thêm code mới:** `PronunciationController` (route `api/v1/pronunciation`),
  một command/handler, và class `AzurePronunciationAssessor`.
  `AzurePronunciationAssessor` **inject lại** `ISpeakingAudioConverter` và
  `IOptions<AzureSpeechOptions>` đang có. Không sửa `AzureSpeakingSpeechAssessor`.
- **Header `Pronunciation-Assessment`:** `ReferenceText=<từ>`,
  `GradingSystem=HundredMark`, `Granularity=Phoneme`, `PhonemeAlphabet=IPA`,
  `NBestPhonemeCount=5`, `Dimension=Comprehensive`, `EnableMiscue=false`.
- **Đăng nhập: chưa chốt** (xem §13). Trong lúc chờ, backend **mặc định yêu cầu
  đăng nhập**, vì mỗi lần gọi Azure tốn phí, và đặt rate limit 30 request/phút
  cho mỗi người dùng. Nếu sau này cho phép khách dùng, chỉ cần bỏ yêu cầu đăng
  nhập ở endpoint và giới hạn theo IP, ví dụ 10 request/phút. Frontend không phải
  sửa gì, vì đã xử lý cả hai trường hợp (§8.4, §9.3).
- **Không lưu bản thu.** Xử lý trong bộ nhớ, chấm xong thì bỏ.
- **Cập nhật contract** trong `TOEICMaster-BE/docs/contracts/api-contract.md`,
  thành một mục riêng "Pronunciation", không đặt trong mục Speaking.

### 9.2 Hàm gọi API phía client (`features/pronunciation/api.ts`)

```ts
export async function assessPronunciation(
  audio: Blob,
  referenceText: string,
  signal?: AbortSignal,
): Promise<PronunciationAssessment>;
```

- Gửi `FormData` tới `POST /api/pronunciation/assessments`, cùng origin.
- Body nhận về xử lý như `unknown`. `parseAssessment` kiểm tra từng trường; dữ liệu
  sai dạng thì ném lỗi `INVALID_RESPONSE`. Không dùng `any`.
- Ánh xạ lỗi HTTP sang thông báo tiếng Việt, không lộ chi tiết nội bộ:
  401 → yêu cầu đăng nhập; 413/400 → "Bản thu không hợp lệ";
  429 → "Bạn thử quá nhanh, chờ N giây"; 5xx → "Chưa chấm được lúc này".

### 9.3 BFF Next.js (`features/pronunciation/server/pronunciation-proxy.ts`)

`src/app/api/pronunciation/assessments/route.ts` chỉ export `POST`, đặt
`dynamic = "force-dynamic"`, và gọi `forwardPronunciationAssessment(request)`.

Helper được **import, không sửa**, giống `lr-exam/server/lr-proxy.ts`:

- `problem` và `sameOrigin` từ `@/features/auth/server/backend`.
- `sessionCookie` từ `@/features/auth/server/session`.

**Không import từ `@/features/speaking/server/upstream`** (§2). Viết bản riêng
trong `features/pronunciation/server/upstream.ts`, chỉ gồm phần cần dùng:
`backendBase()` (đọc `API_BASE_URL`, chỉ chấp nhận http/https), `readMultipart()`
(chỉ nhận `multipart/form-data`, kiểm tra cả `content-length` khai báo lẫn số
byte thực đọc được) và `relay()` (chép status, `Content-Type`, `Retry-After`).
Có thể tham khảo cách viết của bản Speaking, nhưng không dùng chung code.

Việc proxy làm:

1. Từ chối request không cùng origin (`403`).
2. `readMultipart(request, 1 MiB + 64 KiB)`, giới hạn kích thước ngay ở biên.
3. Gắn `Authorization: Bearer <accessToken>` nếu session còn hạn; không có session
   thì vẫn forward để backend trả `401`.
4. Timeout 20 giây. Lỗi mạng hoặc timeout thì trả `502`/`504` với thông báo chung.
5. `relay` response về client, đặt `Cache-Control: no-store`.

## 10. Dữ liệu (`ipa-sounds.ts`)

### 10.1 Kiểu dữ liệu

```ts
export type IpaGroup = "monophthong" | "diphthong" | "consonant";

export interface IpaExample {
  word: string; // "think"
  ipa: string; // "θɪŋk"
  highlight: [start: number, end: number]; // vị trí âm mục tiêu trong `ipa`
}

export interface IpaSound {
  slug: string; // "th-voiceless", an toàn cho URL, không trùng
  symbol: string; // "θ"
  group: IpaGroup;
  subgroup: "short" | "long" | "voiceless" | "voiced" | "glide"; // tùy nhóm
  pairSlug?: string; // phụ âm cặp vô thanh/hữu thanh, ví dụ "th-voiced"
  audioSrc: string; // "/audio/ipa/th-voiceless.mp3"
  articulation: string[]; // 2–4 bước khẩu hình, tiếng Việt
  commonMistake: string; // lỗi người Việt hay gặp
  examples: [IpaExample, IpaExample, IpaExample];
  azurePhonemes: string[]; // ký hiệu Azure en-US tương ứng (xem §10.2)
  confusions?: Record<string, string>; // âm hay bị nhầm → gợi ý sửa
}

export const ipaSounds: readonly IpaSound[];
export function findSound(slug: string): IpaSound | undefined;
export function soundsByGroup(group: IpaGroup): readonly IpaSound[];
```

### 10.2 Danh sách 44 âm (theo bảng IPA chuẩn Anh-Anh, giống giáo trình Cambridge/TOEIC)

Cột "Azure" là ký hiệu **dự kiến** trong bộ âm vị IPA en-US của Azure. Bộ này là
giọng Mỹ: không có dấu dài `ː` và không có /ɒ/, /ɪə/, /eə/, /ʊə/ dạng RP. Phải
xác minh bằng spike ở §12, bước B1, trước khi chốt.

**Nguyên âm đơn (12)**

| Slug      | IPA | Từ ví dụ               | Azure |
| --------- | --- | ---------------------- | ----- |
| `i-long`  | iː  | sheep, see, teacher    | i     |
| `i-short` | ɪ   | ship, sit, business    | ɪ     |
| `u-short` | ʊ   | good, book, put        | ʊ     |
| `u-long`  | uː  | shoot, food, blue      | u     |
| `e`       | e   | bed, many, said        | ɛ     |
| `schwa`   | ə   | teacher, about, banana | ə     |
| `er-long` | ɜː  | bird, work, learn      | ɝ     |
| `o-long`  | ɔː  | door, law, walk        | ɔ     |
| `ae`      | æ   | cat, bank, manager     | æ     |
| `uh`      | ʌ   | up, cup, money         | ʌ     |
| `a-long`  | ɑː  | far, car, start        | ɑ     |
| `o-short` | ɒ   | on, hot, job           | ɑ     |

**Nguyên âm đôi (8)**

| Slug | IPA | Từ ví dụ            | Azure |
| ---- | --- | ------------------- | ----- |
| `ie` | ɪə  | here, near, idea    | ɪ ɹ   |
| `ei` | eɪ  | wait, day, table    | eɪ    |
| `ue` | ʊə  | tourist, pure, sure | ʊ ɹ   |
| `oi` | ɔɪ  | boy, join, employ   | ɔɪ    |
| `ou` | əʊ  | show, go, phone     | oʊ    |
| `ea` | eə  | wear, hair, care    | ɛ ɹ   |
| `ai` | aɪ  | my, time, price     | aɪ    |
| `au` | aʊ  | cow, now, account   | aʊ    |

**Phụ âm (24, xếp theo cặp vô thanh / hữu thanh)**

| Slug           | IPA | Từ ví dụ             | Azure | Slug        | IPA | Từ ví dụ                     | Azure |
| -------------- | --- | -------------------- | ----- | ----------- | --- | ---------------------------- | ----- |
| `p`            | p   | pea, paper, stop     | p     | `b`         | b   | boat, job, about             | b     |
| `t`            | t   | tea, ticket, meet    | t     | `d`         | d   | dog, desk, need              | d     |
| `ch`           | tʃ  | cheese, check, watch | tʃ    | `j`         | dʒ  | June, job, manager           | dʒ    |
| `k`            | k   | car, call, book      | k     | `g`         | g   | go, bag, again               | ɡ     |
| `f`            | f   | fly, office, phone   | f     | `v`         | v   | video, very, have            | v     |
| `th-voiceless` | θ   | think, three, month  | θ     | `th-voiced` | ð   | this, mother, with           | ð     |
| `s`            | s   | see, sales, price    | s     | `z`         | z   | zoo, busy, plans             | z     |
| `sh`           | ʃ   | shall, shop, station | ʃ     | `zh`        | ʒ   | television, usually, measure | ʒ     |
| `m`            | m   | man, meeting, team   | m     | `n`         | n   | now, name, plan              | n     |
| `ng`           | ŋ   | sing, meeting, long  | ŋ     | `h`         | h   | hat, hotel, behind           | h     |
| `l`            | l   | love, late, email    | l     | `r`         | r   | red, report, sorry           | ɹ     |
| `w`            | w   | wet, work, quick     | w     | `y`         | j   | yes, year, use               | j     |

Ưu tiên chọn từ ví dụ quen thuộc trong ngữ cảnh TOEIC: office, meeting, manager, report.

**Âm RP không có trong bộ âm Mỹ:**

- /ɒ/: chấm theo `ɑ`, kèm ghi chú "giọng Mỹ".
- /ɪə/, /eə/, /ʊə/: chấm theo chuỗi `… ɹ`.
- Nếu spike cho thấy `en-GB` hỗ trợ chấm ở mức âm vị với ký hiệu IPA thì chuyển
  `locale` sang `en-GB` cho cả trang và cập nhật bảng.

### 10.3 Audio mẫu

- Có 44 file `public/audio/ipa/<slug>.mp3`, mono, 44,1 kHz hoặc 22,05 kHz, dưới
  50 KB mỗi file, phát âm riêng âm đó.
- **Đã chốt (2026-11-19): dùng file audio mẫu có sẵn, không tự thu.**
  - Chỉ lấy file có giấy phép cho phép dùng lại, ví dụ CC0, CC BY hoặc CC BY-SA
    trên Wikimedia Commons. Không lấy audio từ từ điển hay trang thương mại.
  - Khi tải về: đổi tên theo `<slug>.mp3`; cắt bỏ khoảng lặng ở đầu và cuối;
    chuyển sang mp3 mono, dưới 50 KB.
  - Ưu tiên lấy cả bộ 44 âm từ **cùng một nguồn** để giọng đọc nhất quán.
- **Bắt buộc** có `public/audio/ipa/CREDITS.md`, ghi cho từng file: slug, tên
  file gốc, link nguồn, tác giả, giấy phép, và đã chỉnh sửa gì (cắt, đổi định
  dạng). Giấy phép BY/BY-SA yêu cầu ghi công, nên trang có thêm một dòng nhỏ
  "Nguồn audio" ở chân panel, link tới danh sách này.
- Từ ví dụ phát bằng `speechSynthesis` (`lang = "en-US"`). Không có giọng đọc thì
  ẩn nút ▶ của từ ví dụ; âm mẫu vẫn dùng file mp3.
- Audio lỗi hoặc 404: nút "Nghe mẫu" hiện `InlineError` "Không phát được audio".

## 11. Kiểm thử

`vitest.config.ts` chạy cả `*.test.ts` và `*.test.tsx`, môi trường mặc định là
`node`. `jsdom`, Testing Library và `src/test/setup.ts` (cleanup sau mỗi test)
đã có sẵn. Mọi file test cần DOM (`*.test.tsx`, test hook) phải mở đầu bằng
docblock `// @vitest-environment jsdom`, giống các test trong `lr-exam` và
`home`. Không sửa `vitest.config.ts`. Đặt test cạnh code.

| File test                             | Nội dung kiểm                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ipa-sounds.test.ts`                  | Đủ 44 âm, đúng 12/8/24; `slug` không trùng; `pairSlug` trỏ hai chiều; `highlight` nằm trong `ipa`; mọi `audioSrc` tồn tại trong `public/`                                      |
| `assessment.test.ts`                  | `parseAssessment` nhận dữ liệu hợp lệ, từ chối dữ liệu thiếu hoặc sai kiểu; `scoreTargetPhoneme` cho âm đơn, âm nhiều ký hiệu, âm lặp, không tìm thấy; ngưỡng nhãn 59/60/79/80 |
| `api.test.ts`                         | Mock `fetch`: gửi đúng `FormData`; ánh xạ 401/413/429/5xx; hủy bằng `AbortSignal`                                                                                              |
| `practice-progress.test.ts`           | `localStorage` ném lỗi thì không crash; dữ liệu hỏng thì trả về rỗng                                                                                                           |
| `pronunciation-proxy.test.ts`         | Chặn request khác origin; giới hạn kích thước; gắn token; timeout → 504; không lộ lỗi upstream; `upstream.ts` từ chối `API_BASE_URL` không phải http/https                     |
| `use-pronunciation-recorder.test.tsx` | Mock `MediaRecorder`/`getUserMedia`: cấp quyền, từ chối, không hỗ trợ, tự dừng ở 5 giây, thu hồi URL, mic bị rút                                                               |
| `ipa-chart.test.tsx`                  | Render 3 nhóm và 44 nút; `aria-pressed`; bấm vào ô thì gọi chọn âm đúng slug                                                                                                   |
| `sound-detail-panel.test.tsx`         | Hiện ký hiệu, khẩu hình, 3 từ ví dụ; slug sai thì hiện trạng thái rỗng                                                                                                         |
| `practice-recorder.test.tsx`          | Đi qua máy trạng thái §8.2 với API mock; 401 hiện link đăng nhập; 503 vẫn nghe lại được bản thu                                                                                |

Kiểm tra thủ công trước khi giao: Chrome, Safari (ghi âm ra `audio/mp4`), Firefox
(`audio/ogg`), ở bề rộng 375px và desktop; dùng toàn bộ trang bằng bàn phím; bật
VoiceOver để nghe trạng thái kết quả.

Lệnh: `npm run lint`, `npm run typecheck`, `npm test`, cuối cùng `npm run check`.

## 12. Kế hoạch triển khai

| Bước | Việc                                                                                                                                           | Phụ thuộc | Mục tiêu |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| B1   | Spike 1–2 giờ: gọi Azure với `Granularity=Phoneme`, `PhonemeAlphabet=IPA` cho 5 từ (think, this, here, on, ship), chốt ký hiệu §10.2 và locale | Key Azure | 19/11    |
| B2   | Chốt contract §9.1 với nhóm BE                                                                                                                 | B1        | 19/11    |
| B3   | `ipa-sounds.ts` + test; tải 44 file audio mẫu có giấy phép mở, chuẩn hóa + `CREDITS.md`                                                        | —         | 20/11    |
| B4   | Layout, header, `IpaChart`, `SoundDetailPanel`, đồng bộ `?sound`, tiến độ                                                                      | B3        | 20/11    |
| B5   | `use-pronunciation-recorder`, `PracticeRecorder` (ghi âm và nghe lại)                                                                          | B4        | 21/11    |
| B6   | `assessment.ts`, `api.ts`, BFF proxy + test; nối `AssessmentResult`                                                                            | B2        | 21/11    |
| B7   | Backend endpoint (nhóm BE), test end-to-end với backend chạy local                                                                             | B2        | 21/11    |
| B8   | PR nhỏ thêm mục menu "Phát âm" (§3), cần chủ code duyệt                                                                                        | B4        | 22/11    |
| B9   | Kiểm tra thủ công, `npm run check`, chụp ảnh UI, mở PR vào `dev`                                                                               | B5–B8     | 22/11    |

Nếu B7 trễ, B6 vẫn hoàn thành được với API mock trong test. Trên UI, dịch vụ chưa
có sẽ rơi vào trạng thái §8.4. Khi đó **AC3 chưa được coi là xong**, vì chấm phát
âm là yêu cầu bắt buộc.

## 13. Rủi ro và câu hỏi mở

| Rủi ro / câu hỏi                              | Hướng xử lý                                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Bảng âm RP không khớp bộ âm vị Azure en-US    | Bảng ánh xạ `azurePhonemes`; xác minh ở B1; cân nhắc `en-GB`                                                                            |
| Bản quyền audio mẫu                           | Đã chốt dùng file mẫu có giấy phép mở; ghi `CREDITS.md` + dòng "Nguồn audio"                                                            |
| Chi phí Azure                                 | Yêu cầu đăng nhập, rate limit, giới hạn 10 giây và 1 MiB                                                                                |
| Safari/Firefox ghi âm khác định dạng          | Backend đã có `ISpeakingAudioConverter`; kiểm tra thủ công cả 3 trình duyệt                                                             |
| Font không hiển thị đủ ký tự IPA              | Class font IPA riêng trong feature (§7.1)                                                                                               |
| PR menu chung cần người khác duyệt            | Tách PR nhỏ (B8); trang vẫn chạy bằng URL trực tiếp                                                                                     |
| **Chưa chốt:** chấm phát âm có cần đăng nhập? | Xem bảng IPA, nghe mẫu, ghi âm: công khai. Chấm AI: tạm yêu cầu đăng nhập (§9.1). Hỏi PO trước B7; đổi quyết định chỉ ảnh hưởng backend |

## 14. Định nghĩa hoàn thành

- [ ] `/pronunciation` hiện đủ 44 âm, chia 3 nhóm, phụ âm theo cặp; dùng tốt ở 375px và desktop.
- [ ] Chọn âm: hiện ký hiệu, khẩu hình, lỗi hay gặp, 3 từ ví dụ; nghe được audio mẫu và từ ví dụ.
- [ ] Ghi âm, nghe lại bản thu, nhận điểm phát âm từ backend, có điểm riêng cho âm mục tiêu và gợi ý sửa.
- [ ] Mọi trạng thái lỗi ở §8.2 và §8.4 đều có UI, không màn hình trắng.
- [ ] Mục "Phát âm" có trong header desktop và sidebar mobile (sau PR B8).
- [ ] `grep -rn "features/speaking" src/features/pronunciation src/app/pronunciation src/app/api/pronunciation`
      chỉ ra `fonts.ts` và `speaking-theme.css` trong `layout.tsx`; không dùng `sp-learner`.
- [ ] Không file nào ngoài phạm vi §3 bị sửa; `git diff dev --stat` chỉ gồm file mới, cộng hai điểm tích hợp đã duyệt.
- [ ] `npm run check` pass; contract BE đã cập nhật.
