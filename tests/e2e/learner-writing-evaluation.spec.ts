import { test, expect } from "@playwright/test";
import {
  MockWritingLearnerBackend,
  loginAsUser,
  sanitizeAttempt,
  sanitizeQuestion,
  sanitizeEvaluation,
} from "./learner-writing-helpers";

test.describe("Learner Writing - Chấm điểm bằng AI Gemini (/writing/attempts/[id]/result)", () => {
  let backend: MockWritingLearnerBackend;

  test.beforeEach(async ({ page, context }) => {
    backend = new MockWritingLearnerBackend();
    await backend.setupRoutes(page);
    await loginAsUser(context);
  });

  test("TC-EVAL-01: Màn hình hỏi xác nhận (Consent) trước khi gửi bài cho AI", async ({
    page,
  }) => {
    // Chuẩn bị bài nộp ở trạng thái CONSENT_REQUIRED
    const consentAttempt = sanitizeAttempt({
      id: "att-consent-01",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "user-learner-01",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "The man is typing at his desk.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-consent-01",
        status: "CONSENT_REQUIRED",
      }),
    });
    backend.attempts.push(consentAttempt);

    await page.goto("/writing/attempts/att-consent-01/result");

    // Hiển thị tiêu đề và thông tin bài nộp
    await expect(
      page.getByRole("heading", { name: "Đã nộp bài Writing" }),
    ).toBeVisible();
    await expect(page.getByText("Chờ xác nhận")).toBeVisible();

    // Khung xác nhận gửi AI
    await expect(
      page.getByRole("heading", { name: "Gửi bài để AI chấm ước tính" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Khi xác nhận, nội dung đề, ảnh đề bài và bài viết của bạn sẽ được gửi đến Gemini",
      ),
    ).toBeVisible();

    const consentCheckbox = page.getByRole("checkbox", {
      name: "Tôi đồng ý gửi bài làm đến dịch vụ AI để chấm ước tính.",
    });
    const submitBtn = page.getByRole("button", { name: "Đồng ý và chấm bài" });

    // Ban đầu nút submit bị disabled khi chưa check đồng ý
    await expect(consentCheckbox).not.toBeChecked();
    await expect(submitBtn).toBeDisabled();

    // Check vào checkbox đồng ý
    await consentCheckbox.check();
    await expect(consentCheckbox).toBeChecked();
    await expect(submitBtn).toBeEnabled();

    // Click nút gửi chấm bài
    await submitBtn.click();

    // Trạng thái chuyển sang AI đang chấm bài (QUEUED)
    await expect(
      page.getByRole("heading", { name: "AI đang chấm bài" }),
    ).toBeVisible();
    expect(consentAttempt.evaluation?.status).toBe("QUEUED");
  });

  test("TC-EVAL-02: Trạng thái chờ chấm điểm AI và cơ chế tự động Polling mỗi 5s", async ({
    page,
  }) => {
    // Chuẩn bị bài làm đang QUEUED chờ AI
    const queuedAttempt = sanitizeAttempt({
      id: "att-queued-01",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "user-learner-01",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "The man is typing at his desk.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-queued-01",
        status: "QUEUED",
      }),
    });
    backend.attempts.push(queuedAttempt);

    await page.goto("/writing/attempts/att-queued-01/result");

    // Màn hình hiển thị trạng thái chờ chấm điểm với chu kỳ polling 5 giây
    await expect(
      page.getByRole("heading", { name: "AI đang chấm bài" }),
    ).toBeVisible();
    await expect(
      page.getByText("Trạng thái này tự cập nhật mỗi 5 giây."),
    ).toBeVisible();

    // Giả lập backend hoàn tất chấm điểm sau một lúc
    queuedAttempt.evaluation = sanitizeEvaluation({
      id: "eval-queued-01",
      status: "COMPLETED",
      estimatedScore: 185,
      summary:
        "Bài viết đạt mức điểm rất cao, cấu trúc ngữ pháp phong phú và chính xác.",
      strengths: ["Sử dụng từ vựng linh hoạt.", "Đúng ngữ pháp hoàn toàn."],
      improvements: ["Có thể bổ sung mệnh đề quan hệ để câu dài hơn."],
      feedback: [
        {
          questionPosition: 1,
          criterionScore: 3,
          feedback: "Đáp ứng chính xác từ khóa và tranh.",
          suggestedRevision:
            "The man is sitting and typing at his computer desk.",
        },
      ],
    });

    // Chờ polling 5 giây tự động cập nhật kết quả mà không cần tải lại trang thủ công
    await expect(
      page.getByRole("heading", { name: "Kết quả Writing" }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("185")).toBeVisible();
    await expect(page.getByText("/200")).toBeVisible();
  });

  test("TC-EVAL-03: Báo cáo kết quả chấm điểm đầy đủ chi tiết", async ({
    page,
  }) => {
    // Sử dụng bài đã chấm sẵn att-completed-01 (170/200)
    await page.goto("/writing/attempts/att-completed-01/result");

    // 1. Tiêu đề và tổng quan
    await expect(
      page.getByRole("heading", { name: "Kết quả Writing" }),
    ).toBeVisible();
    await expect(
      page.getByText("Điểm TOEIC Writing ước tính bởi AI"),
    ).toBeVisible();
    await expect(page.getByText("170")).toBeVisible();
    await expect(page.getByText("/200")).toBeVisible();

    // 2. Điểm theo Part
    await expect(page.getByText("Writing Part 1")).toBeVisible();
    await expect(page.getByText("Tổng điểm tiêu chí AI")).toBeVisible();

    // 3. Nhận xét tổng quan
    await expect(
      page.getByRole("heading", { name: "Nhận xét tổng quan" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Bài viết có ngữ pháp vững vàng, sử dụng từ vựng phong phú và cấu trúc câu mạch lạc.",
      ),
    ).toBeVisible();

    // 4. Danh sách Điểm làm tốt và Cần cải thiện
    await expect(
      page.getByRole("heading", { name: "Điểm làm tốt" }),
    ).toBeVisible();
    await expect(
      page.getByText("Sử dụng đúng thì và hòa hợp chủ vị chính xác."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cần cải thiện" }),
    ).toBeVisible();
    await expect(
      page.getByText("Chú ý đa dạng hóa liên từ nối câu."),
    ).toBeVisible();

    // 5. Gợi ý theo câu và nút toggle xem lại đề + bài làm
    await expect(
      page.getByRole("heading", { name: "Gợi ý theo câu" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Câu 1" })).toBeVisible();
    await expect(page.getByText("Điểm tiêu chí AI: 3")).toBeVisible();
    await expect(
      page.getByText("The person is typing diligently on the office computer."),
    ).toBeVisible();

    // Mở chi tiết xem lại đề và câu trả lời đã nộp
    const detailsToggle = page.locator("summary", {
      hasText: "Xem đề và bài đã nộp",
    });
    await expect(detailsToggle).toBeVisible();
    await detailsToggle.click();

    await expect(
      page.getByText("The person is typing diligently on the computer."),
    ).toBeVisible();
  });

  test('TC-EVAL-04: Xử lý lỗi AI và nút "Thử chấm lại"', async ({ page }) => {
    // Chuẩn bị bài nộp bị AI lỗi (FAILED)
    const failedAttempt = sanitizeAttempt({
      id: "att-failed-01",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "user-learner-01",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "The man is typing at his desk.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-failed-01",
        status: "FAILED",
        failureMessage:
          "Hệ thống AI đang quá tải hoặc gặp sự cố quota. Vui lòng thử lại sau.",
      }),
    });
    backend.attempts.push(failedAttempt);

    await page.goto("/writing/attempts/att-failed-01/result");

    // Hiển thị cảnh báo lỗi
    await expect(
      page.getByRole("heading", { name: "Chưa thể chấm bài lúc này" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Hệ thống AI đang quá tải hoặc gặp sự cố quota. Vui lòng thử lại sau.",
      ),
    ).toBeVisible();

    // Nút Thử chấm lại
    const retryBtn = page.getByRole("button", { name: "Thử chấm lại" });
    await expect(retryBtn).toBeVisible();
    await expect(retryBtn).toBeEnabled();

    // Bấm nút Thử chấm lại
    await retryBtn.click();

    // Hệ thống kích hoạt lại quy trình chấm AI
    await expect(
      page.getByRole("heading", { name: "AI đang chấm bài" }),
    ).toBeVisible();
    expect(failedAttempt.evaluation?.status).toBe("QUEUED");
  });
});
