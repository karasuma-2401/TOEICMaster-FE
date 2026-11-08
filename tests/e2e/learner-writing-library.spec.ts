import { test, expect } from "@playwright/test";
import {
  MockWritingLearnerBackend,
  loginAsUser,
} from "./learner-writing-helpers";

test.describe("Learner Writing - Thư viện đề thi, Hướng dẫn & Luyện tập (/writing)", () => {
  let backend: MockWritingLearnerBackend;

  test.beforeEach(async ({ page, context }) => {
    backend = new MockWritingLearnerBackend();
    await backend.setupRoutes(page);
    await loginAsUser(context);
  });

  test("TC-LEARN-01: Thư viện đề thi Writing (/writing) - Hiển thị danh sách đề thi Full Test đã PUBLISHED và tìm kiếm", async ({
    page,
  }) => {
    await page.goto("/writing");
    await expect(
      page.getByRole("heading", { name: "Luyện Writing theo đúng nhịp thi" }),
    ).toBeVisible();

    // Hiển thị các đề thi Full test
    await expect(page.getByText("WT-PUB-FULL-01")).toBeVisible();
    await expect(
      page.getByText("TOEIC Writing Simulation Test 01"),
    ).toBeVisible();
    await expect(page.getByText("WT-PUB-FULL-02")).toBeVisible();

    // Tìm kiếm đề thi
    const searchInput = page.getByPlaceholder("Mã hoặc tên đề");
    await searchInput.fill("01");
    await expect(page.getByText("WT-PUB-FULL-01")).toBeVisible();
    await expect(page.getByText("WT-PUB-FULL-02")).not.toBeVisible();
  });

  test("TC-LEARN-02: Thư viện đề thi Writing (/writing) - Hiển thị 3 thẻ Part 1, 2, 3 và chuyển đến trang luyện tập", async ({
    page,
  }) => {
    await page.goto("/writing");

    // Kiểm tra 3 thẻ Part
    await expect(page.getByText("Viết câu theo tranh")).toBeVisible();
    await expect(page.getByText("Viết email phản hồi")).toBeVisible();
    await expect(page.getByText("Viết bài luận quan điểm")).toBeVisible();

    // Click vào thẻ Part 1
    await page.getByRole("link", { name: "Luyện Part 1 →" }).click();
    await expect(page).toHaveURL(/\/writing\/practice\/1/);
    await expect(
      page.getByRole("heading", { name: "Luyện bài tập Writing" }),
    ).toBeVisible();
  });

  test("TC-LEARN-03: Hướng dẫn thi (/writing/tests/[id]) - Xem tổng quan bài thi, thời gian chi tiết từng phần trước khi bắt đầu", async ({
    page,
  }) => {
    await page.goto("/writing/tests/test-pub-01");

    // Hiển thị tiêu đề đề thi và các thông số
    await expect(
      page.getByRole("heading", { name: "TOEIC Writing Simulation Test 01" }),
    ).toBeVisible();
    await expect(page.getByText("8 câu", { exact: true })).toBeVisible();

    // Hiển thị cấu trúc từng phần
    await expect(page.getByText("Writing Part 1")).toBeVisible();
    await expect(page.getByText("Writing Part 2")).toBeVisible();
    await expect(page.getByText("Writing Part 3")).toBeVisible();

    // Nút bắt đầu làm bài
    const startBtn = page.getByRole("button", { name: "Bắt đầu làm bài" });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();
  });

  test("TC-LEARN-04: Hướng dẫn thi (/writing/tests/[id]) - Bắt đầu làm bài thi chuyển hướng đến phòng thi ảo", async ({
    page,
  }) => {
    await page.goto("/writing/tests/test-pub-01");

    await page.getByRole("button", { name: "Bắt đầu làm bài" }).click();

    // Chuyển hướng sang phòng thi ảo /writing/attempts/[id]
    await expect(page).toHaveURL(/\/writing\/attempts\/att-test-/);
    await expect(
      page.getByText("TOEIC Writing Simulation Test 01"),
    ).toBeVisible();
  });

  test("TC-LEARN-05: Luyện tập câu hỏi lẻ (/writing/practice/[part]) - Danh sách bài tập lẻ không giới hạn thời gian", async ({
    page,
  }) => {
    await page.goto("/writing/practice/1");
    await expect(
      page.getByText("WRITING PART 1", { exact: true }),
    ).toBeVisible();

    // Hiển thị danh sách bài tập Part 1
    await expect(page.getByText("WP1-PRAC-01")).toBeVisible();
    await expect(page.getByText("Coffee Break Discussion")).toBeVisible();
    await expect(page.getByText("WP1-PRAC-02")).toBeVisible();

    // Bắt đầu luyện bài tập
    await page
      .locator("article", { hasText: "WP1-PRAC-01" })
      .getByRole("button", { name: "Làm bài" })
      .click();

    // Mở phòng thi ở chế độ luyện tập không giới hạn thời gian
    await expect(page).toHaveURL(/\/writing\/attempts\/att-prac-/);
    await expect(
      page.getByText("Luyện tập không giới hạn thời gian"),
    ).toBeVisible();
  });

  test("TC-LEARN-06: Lịch sử làm bài (/history/writing) - Xem danh sách bài đã làm và mở lại kết quả", async ({
    page,
  }) => {
    await page.goto("/history/writing");
    await expect(
      page.getByRole("heading", { name: "Lượt làm bài của bạn" }),
    ).toBeVisible();

    // Hiển thị bài đã làm trong danh sách
    await expect(
      page.getByText("TOEIC Writing Simulation Test 01").first(),
    ).toBeVisible();
    await expect(page.getByText("AI ước tính 170/200")).toBeVisible();

    // Bấm "Xem trạng thái" để mở báo cáo chi tiết
    await page.getByRole("link", { name: "Xem trạng thái" }).first().click();
    await expect(page).toHaveURL(
      /\/writing\/attempts\/att-completed-01\/result/,
    );
    await expect(
      page.getByRole("heading", { name: "Kết quả Writing" }),
    ).toBeVisible();
  });
});
