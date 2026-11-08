import { test, expect } from "@playwright/test";
import {
  MockWritingLearnerBackend,
  loginAsUser,
} from "./learner-writing-helpers";

test.describe("Learner Writing - Phòng thi ảo 2-Phase (/writing/attempts/[id])", () => {
  let backend: MockWritingLearnerBackend;

  test.beforeEach(async ({ page, context }) => {
    backend = new MockWritingLearnerBackend();
    await backend.setupRoutes(page);
    await loginAsUser(context);
  });

  test("TC-ATTEMPT-01: Cơ chế 2 giai đoạn - Pha Chuẩn bị (PREPARING) khóa ô nhập bài làm", async ({
    page,
  }) => {
    await page.goto("/writing/attempts/att-in-progress-01");

    // Kiểm tra header hiển thị thông tin bài làm
    await expect(page.getByText("WT-PUB-FULL-01 · CÂU 1/3")).toBeVisible();

    // Đồng hồ hiển thị giai đoạn "Chuẩn bị"
    await expect(page.getByText("Chuẩn bị", { exact: true })).toBeVisible();

    // Ô nhập bài làm bị disabled trong pha chuẩn bị
    const textarea = page.locator("#writing-answer");
    await expect(textarea).toBeDisabled();
    await expect(
      page.getByText("Editor đang khóa trong pha chuẩn bị."),
    ).toBeVisible();

    // Không có nút Next khi đang ở pha chuẩn bị
    await expect(
      page.getByRole("button", { name: "Next · khóa câu này" }),
    ).not.toBeVisible();
    await expect(
      page.getByText("Đọc đề và chuẩn bị ý. Editor sẽ mở khi timer về 00:00."),
    ).toBeVisible();
  });

  test("TC-ATTEMPT-02: Cơ chế 2 giai đoạn - Pha Làm bài (ANSWERING) mở ô nhập cho thí sinh gõ bài", async ({
    page,
  }) => {
    // Chuyển attempt sang pha ANSWERING
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 45000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    // Đồng hồ hiển thị giai đoạn "Làm bài"
    await expect(page.getByText("Làm bài")).toBeVisible();

    // Ô nhập bài làm được kích hoạt (enabled)
    const textarea = page.locator("#writing-answer");
    await expect(textarea).toBeEnabled();
    await expect(textarea).toHaveAttribute(
      "placeholder",
      "Viết một câu tiếng Anh…",
    );

    // Nút Next xuất hiện
    await expect(
      page.getByRole("button", { name: "Next · khóa câu này" }),
    ).toBeVisible();
  });

  test("TC-ATTEMPT-03: Đồng hồ đếm ngược - Giữ nhịp đếm theo máy chủ (Reload trang không làm tăng giờ)", async ({
    page,
  }) => {
    // Thiết lập thời gian kết thúc cố định còn 30 giây
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 30000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");
    await expect(page.getByText("Làm bài")).toBeVisible();

    // Chờ 2 giây rồi reload trang
    await page.waitForTimeout(2000);
    await page.reload();

    // Sau khi reload, đồng hồ vẫn tiếp tục đếm đúng nhịp (khoảng 27-28s còn lại) chứ không bị reset về 30s
    await expect(page.getByText("Làm bài")).toBeVisible();
    const timerText = await page
      .locator("header, div")
      .filter({ hasText: /00:2[0-9]/ })
      .first()
      .isVisible();
    expect(timerText).toBe(true);
  });

  test("TC-ATTEMPT-04: Tự động lưu bài khi gõ (Realtime Autosave)", async ({
    page,
  }) => {
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 45000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    const textarea = page.locator("#writing-answer");
    await textarea.fill("The man is sitting at his desk typing an email.");

    // Trạng thái hiển thị autosave thành công
    await expect(page.getByText("Đã autosave trên server")).toBeVisible();

    // Kiểm tra dữ liệu đã được lưu trên backend
    expect(attempt.questions[0].answer).toContain(
      "The man is sitting at his desk",
    );
  });

  test("TC-ATTEMPT-05: Đếm số từ theo thời gian thực (Realtime Word Count) ở Part 3", async ({
    page,
  }) => {
    // Chuyển attempt đến câu Part 3 (yêu cầu tối thiểu 300 từ)
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentQuestionPosition = 3;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 1800000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    await expect(page.getByText("Writing Part 3")).toBeVisible();

    const textarea = page.locator("#writing-answer");
    // Gõ 6 từ
    await textarea.fill("Higher education provides many great opportunities");

    // Kiểm tra bộ đếm từ hiển thị 6/300 từ
    await expect(page.getByText("6/300 từ")).toBeVisible();
  });

  test("TC-ATTEMPT-06: Khóa câu trả lời sau khi chuyển câu (Không thể quay lại câu cũ)", async ({
    page,
  }) => {
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 45000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    // Gõ câu trả lời cho câu 1
    const textarea = page.locator("#writing-answer");
    await textarea.fill("Answer for question 1.");

    // Bấm Next để khóa câu 1 và sang câu 2
    await page.getByRole("button", { name: "Next · khóa câu này" }).click();

    // Đã chuyển sang câu 2/3
    await expect(page.getByText("CÂU 2/3")).toBeVisible();

    // Kiểm tra thanh tiến trình bên cạnh: Câu 1 đã có trạng thái khóa/xong (done), hint ghi rõ không thể mở lại
    await expect(page.getByText("Câu đã khóa không thể mở lại.")).toBeVisible();
    expect(attempt.questions[0].lockedAtUtc).not.toBeNull();
  });

  test("TC-ATTEMPT-07: Nộp bài thi ở câu cuối cùng và chuyển hướng sang trang kết quả", async ({
    page,
  }) => {
    // Chuyển attempt đến câu cuối cùng (câu 3)
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentQuestionPosition = 3;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 1800000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    // Nút ở câu cuối cùng là "Nộp bài" thay vì "Next"
    const submitBtn = page.getByRole("button", { name: "Nộp bài" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Xuất hiện modal xác nhận nộp bài
    await expect(
      page.getByRole("heading", { name: "Nộp bài Writing?" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Câu cuối sẽ bị khóa và bài được chuyển sang trạng thái chờ chấm AI.",
      ),
    ).toBeVisible();

    // Xác nhận nộp bài
    await page.getByRole("button", { name: "Xác nhận nộp" }).click();

    // Chuyển hướng sang trang kết quả /result
    await expect(page).toHaveURL(
      /\/writing\/attempts\/att-in-progress-01\/result/,
    );
    await expect(
      page.getByRole("heading", { name: "Đã nộp bài Writing" }),
    ).toBeVisible();
  });
});
