import { test, expect } from "@playwright/test";
import {
  MockWritingLearnerBackend,
  loginAsUser,
  sanitizeAttempt,
  sanitizeQuestion,
  sanitizeEvaluation,
} from "./learner-writing-helpers";

test.describe("Bảo mật & Hạn mức (Writing Security & Limits)", () => {
  let backend: MockWritingLearnerBackend;

  test.beforeEach(async ({ page }) => {
    backend = new MockWritingLearnerBackend();
    await backend.setupRoutes(page);
  });

  test("TC-SEC-01: Hạn mức khách vãng lai - Chỉ được chấm AI tối đa 1 lần trong 24 giờ", async ({
    page,
  }) => {
    // Không đăng nhập (khách vãng lai / anonymous)
    // 1. Tạo bài thi khách thứ nhất
    const guestAttempt1 = sanitizeAttempt({
      id: "att-guest-01",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "guest-anon-session",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "A man is working on the laptop.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-guest-01",
        status: "CONSENT_REQUIRED",
      }),
    });
    backend.attempts.push(guestAttempt1);

    // Lần 1: Khách yêu cầu chấm AI -> Thành công
    await page.goto("/writing/attempts/att-guest-01/result");
    await page
      .getByRole("checkbox", {
        name: "Tôi đồng ý gửi bài làm đến dịch vụ AI để chấm ước tính.",
      })
      .check();
    await page.getByRole("button", { name: "Đồng ý và chấm bài" }).click();

    // Hệ thống chấp nhận lần chấm thứ nhất
    await expect(
      page.getByRole("heading", { name: "AI đang chấm bài" }),
    ).toBeVisible();
    expect(backend.guestConsentUsed).toBe(true);

    // 2. Tạo bài thi khách thứ hai trong vòng 24 giờ
    const guestAttempt2 = sanitizeAttempt({
      id: "att-guest-02",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "guest-anon-session",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "Two people are talking in the office.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-guest-02",
        status: "CONSENT_REQUIRED",
      }),
    });
    backend.attempts.push(guestAttempt2);

    // Lần 2: Khách yêu cầu chấm tiếp -> Bị chặn 409 Conflict
    await page.goto("/writing/attempts/att-guest-02/result");
    await page
      .getByRole("checkbox", {
        name: "Tôi đồng ý gửi bài làm đến dịch vụ AI để chấm ước tính.",
      })
      .check();
    await page.getByRole("button", { name: "Đồng ý và chấm bài" }).click();

    // Hiển thị thông báo vượt quá hạn mức khách ẩn danh
    await expect(
      page.getByText(
        "Phiên ẩn danh đã dùng lượt chấm AI trong 24 giờ qua. Hãy đăng nhập hoặc thử lại sau.",
      ),
    ).toBeVisible();
  });

  test("TC-SEC-02: Bảo mật bài làm - Không thể truy cập bài làm của người khác bằng link trực tiếp", async ({
    page,
    context,
  }) => {
    // Đăng nhập tài khoản học viên thông thường
    await loginAsUser(context, "user-learner-01", "learner@example.com");

    // Thử truy cập trực tiếp bài làm của người dùng khác (att-other-user-99 thuộc về victim-user-99)
    await page.goto("/writing/attempts/att-other-user-99");

    // Hệ thống chặn truy cập và hiển thị thông báo lỗi 404
    await expect(page.getByText("Không tìm thấy lượt làm bài.")).toBeVisible();

    // Xác nhận nội dung riêng tư của người khác không bị rò rỉ trên giao diện
    await expect(
      page.getByText("Private Attempt of Another User"),
    ).not.toBeVisible();
  });

  test("TC-SEC-03: Bảo mật nội dung - Giao diện học viên không hiển thị đáp án mẫu (Model Answer) hay prompt nội bộ", async ({
    page,
    context,
  }) => {
    await loginAsUser(context);

    // Mở trang kết quả bài thi đã chấm
    await page.goto("/writing/attempts/att-completed-01/result");

    await expect(
      page.getByRole("heading", { name: "Kết quả Writing" }),
    ).toBeVisible();

    // Lấy toàn bộ nội dung HTML được render trên trang học viên
    const pageContent = await page.content();

    // Đảm bảo không chứa prompt nội bộ của hệ thống AI hoặc system instruction bí mật
    expect(pageContent).not.toContain(
      "You are an expert TOEIC Writing evaluator",
    );
    expect(pageContent).not.toContain("System Prompt:");
    expect(pageContent).not.toContain("Internal rubric prompt");

    // Đảm bảo không render đáp án mẫu nội bộ bí mật
    expect(pageContent).not.toContain("Secret Model Answer:");
    expect(pageContent).not.toContain("OFFICIAL_ETS_SAMPLE_ANSWER");
  });

  test("TC-SEC-04: Phân quyền Route - Khách và tài khoản thường không thể truy cập vào các trang /admin/*", async ({
    page,
    context,
  }) => {
    // 1. Trường hợp Khách vãng lai (Chưa đăng nhập):
    // Truy cập trực tiếp vào Quản lý câu hỏi lẻ Writing
    await page.goto("/admin/content/writing");
    // Bị chuyển hướng sang trang đăng nhập với tham số next
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fcontent%2Fwriting/);

    // Truy cập trực tiếp vào Quản lý đề thi Writing
    await page.goto("/admin/tests/writing");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Ftests%2Fwriting/);

    // 2. Trường hợp Học viên thường đã đăng nhập (role: 'USER'):
    await loginAsUser(context, "normal-user-01", "normal@example.com");

    // Cố truy cập trang quản trị câu hỏi
    await page.goto("/admin/content/writing");
    // Bị chuyển hướng về trang chủ /
    await expect(page).toHaveURL("http://localhost:3000/");

    // Cố truy cập trang quản trị đề thi
    await page.goto("/admin/tests/writing");
    // Bị chuyển hướng về trang chủ /
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});
