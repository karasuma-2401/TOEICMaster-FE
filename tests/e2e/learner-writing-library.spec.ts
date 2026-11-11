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
      page.getByRole("heading", { name: "Đề thi Writing", level: 1 }),
    ).toBeVisible();

    // Hiển thị các đề thi Full test
    await expect(
      page.getByText("TOEIC Writing Simulation Test 01"),
    ).toBeVisible();
    await expect(
      page.getByText("TOEIC Writing Simulation Test 02"),
    ).toBeVisible();

    // Tìm kiếm đề thi theo mã
    const searchInput = page.getByPlaceholder("Tìm kiếm tên đề Writing...");
    await searchInput.fill("WT-PUB-FULL-01");
    await expect(
      page.getByText("TOEIC Writing Simulation Test 01"),
    ).toBeVisible();
    await expect(
      page.getByText("TOEIC Writing Simulation Test 02"),
    ).not.toBeVisible();
  });

  test("TC-LEARN-02: Thư viện đề thi Writing (/writing) - Mở trang luyện tập và chuyển giữa các Part", async ({
    page,
  }) => {
    await page.goto("/writing");

    await page.getByRole("link", { name: "Bài tập", exact: true }).click();
    await expect(page).toHaveURL(/\/writing\/practice\/1/);
    await expect(
      page.getByRole("heading", { name: "Bài tập Writing", level: 1 }),
    ).toBeVisible();

    // Kiểm tra 3 Part
    await expect(
      page.getByRole("link", { name: "Part 1 · Viết câu theo tranh" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Part 3 · Viết bài luận quan điểm" }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: "Part 2 · Viết email phản hồi" })
      .click();
    await expect(page).toHaveURL(/\/writing\/practice\/2/);
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
    await expect(page.getByText("Part 1 · Viết câu theo tranh")).toBeVisible();
    await expect(page.getByText("Part 2 · Phản hồi email")).toBeVisible();
    await expect(page.getByText("Part 3 · Bài luận quan điểm")).toBeVisible();

    // Nút bắt đầu làm bài
    const startBtn = page.getByRole("button", {
      name: "BẮT ĐẦU LÀM BÀI WRITING",
    });
    await expect(startBtn).toBeDisabled();
    await page.getByRole("checkbox").check();
    await expect(startBtn).toBeEnabled();
  });

  test("TC-LEARN-04: Hướng dẫn thi (/writing/tests/[id]) - Bắt đầu làm bài thi chuyển hướng đến phòng thi ảo", async ({
    page,
  }) => {
    await page.goto("/writing/tests/test-pub-01");

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "BẮT ĐẦU LÀM BÀI WRITING" }).click();

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
      page.getByRole("heading", { name: "Bài tập Writing", level: 1 }),
    ).toBeVisible();

    // Hiển thị danh sách bài tập Part 1
    await expect(page.getByText("Coffee Break Discussion")).toBeVisible();

    // Bắt đầu luyện bài tập
    await page
      .locator("article", { hasText: "Coffee Break Discussion" })
      .getByRole("button", { name: "Làm bài Writing" })
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
