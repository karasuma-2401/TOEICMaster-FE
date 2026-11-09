import { test, expect } from "@playwright/test";
import path from "node:path";
import {
  MockWritingAdminBackend,
  FIXTURES_DIR,
  chooseFilter,
  loginAsAdmin,
} from "./admin-writing-helpers";

test.describe("Admin Writing - Ngân hàng câu hỏi lẻ (/admin/content/writing)", () => {
  let backend: MockWritingAdminBackend;

  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin(context);
    backend = new MockWritingAdminBackend();
    await backend.setupRoutes(page);
    await page.goto("/admin/content/writing");
    await expect(
      page.getByRole("heading", { name: "Ngân hàng bài tập Writing" }),
    ).toBeVisible();
  });

  test("TC-CONTENT-01: Hiển thị danh sách câu hỏi lẻ và chuyển tab giữa Part 1, Part 2, Part 3", async ({
    page,
  }) => {
    // Mặc định tab Part 1 được chọn
    await expect(page.getByText("WP1-SEED-01")).toBeVisible();
    await expect(page.getByText("Office Workspace")).toBeVisible();

    // Chuyển sang Part 2
    await page.getByRole("button", { name: "Part 2" }).click();
    await expect(page.getByText("WP2-SEED-01")).toBeVisible();
    await expect(page.getByText("Customer Meeting")).toBeVisible();

    // Chuyển sang Part 3
    await page.getByRole("button", { name: "Part 3" }).click();
    await expect(page.getByText("WP3-SEED-01")).toBeVisible();
    await expect(page.getByText("Remote Work Opinion")).toBeVisible();
  });

  test("TC-CONTENT-02: Lọc bài tập theo từ khóa tìm kiếm và trạng thái", async ({
    page,
  }) => {
    // Tìm kiếm bài tập
    const searchInput = page.getByLabel("Tìm bài tập Writing");
    await searchInput.fill("Office");
    await expect(page.getByText("WP1-SEED-01")).toBeVisible();

    await searchInput.fill("Không tồn tại");
    await expect(page.getByText("WP1-SEED-01")).not.toBeVisible();
    await expect(
      page.getByText("Không tìm thấy bài tập phù hợp"),
    ).toBeVisible();

    // Xóa tìm kiếm và lọc trạng thái
    await searchInput.clear();
    await chooseFilter(page, /^Lọc trạng thái/, "Bản nháp");
    await expect(
      page.getByText("Không tìm thấy bài tập phù hợp"),
    ).toBeVisible();

    await chooseFilter(page, /^Lọc trạng thái/, "Hiển thị");
    await expect(page.getByText("WP1-SEED-01")).toBeVisible();
  });

  test("TC-CONTENT-03: Thêm mới câu hỏi Part 1 thành công (Happy Path: Đầy đủ thông tin & upload ảnh)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Thêm bài tập" }).click();
    const dialog = page.getByRole("dialog", { name: "Form bài tập Writing" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("WRITING PART 1")).toBeVisible();

    // Điền thông tin chung
    await dialog.getByLabel("Mã bài *").fill("WP1-NEW-01");
    await dialog.getByLabel("Chủ đề *").fill("Office Meeting Room");
    await dialog.getByLabel("Độ khó").selectOption("Trung bình");

    // Upload ảnh đề bài hợp lệ
    const validImage = path.join(FIXTURES_DIR, "valid-sample.png");
    await dialog.locator('input[type="file"]').setInputFiles(validImage);
    await expect(dialog.getByText("valid-sample.png")).toBeVisible();

    // Điền từ khóa Part 1
    await dialog.getByLabel("Từ gợi ý 1 *").fill("colleagues");
    await dialog.getByLabel("Từ gợi ý 2 *").fill("discuss");
    await dialog
      .getByLabel("Alt text ảnh")
      .fill("Colleagues discussing in a meeting room");

    // Lưu bài tập
    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();

    // Thông báo thành công và bài tập xuất hiện trên bảng
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Đã lưu bài tập.")).toBeVisible();
    await expect(page.getByText("WP1-NEW-01")).toBeVisible();
  });

  test("TC-CONTENT-04: Thêm câu hỏi Part 1 thất bại khi thiếu thông tin bắt buộc (Validation Error)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Thêm bài tập" }).click();
    const dialog = page.getByRole("dialog", { name: "Form bài tập Writing" });

    // 1. Khi chưa điền ảnh và từ gợi ý (mặc định đã có code WP1-NEW)
    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Part 1 cần ảnh và hai từ gợi ý.",
    );

    // 2. Xóa trắng mã bài -> Báo lỗi mã bài và chủ đề là bắt buộc
    await dialog.getByLabel("Mã bài *").clear();
    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Mã bài và chủ đề là bắt buộc.",
    );
  });

  test("TC-CONTENT-05: Upload ảnh Part 1 - Chặn file sai định dạng (.txt)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Thêm bài tập" }).click();
    const dialog = page.getByRole("dialog", { name: "Form bài tập Writing" });

    await dialog.getByLabel("Mã bài *").fill("WP1-INVALID-FMT");
    await dialog.getByLabel("Chủ đề *").fill("Test Format");
    await dialog.getByLabel("Từ gợi ý 1 *").fill("key1");
    await dialog.getByLabel("Từ gợi ý 2 *").fill("key2");

    // Upload file .txt thay vì ảnh
    const invalidFile = path.join(FIXTURES_DIR, "invalid-format.txt");
    await dialog.locator('input[type="file"]').setInputFiles(invalidFile);
    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();

    // Hệ thống báo lỗi định dạng ảnh
    await expect(dialog.getByRole("alert")).toContainText(
      "Định dạng ảnh không hợp lệ",
    );
  });

  test("TC-CONTENT-06: Upload ảnh Part 1 - Chặn file quá dung lượng cho phép (> 5MB)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Thêm bài tập" }).click();
    const dialog = page.getByRole("dialog", { name: "Form bài tập Writing" });

    await dialog.getByLabel("Mã bài *").fill("WP1-OVERSIZED");
    await dialog.getByLabel("Chủ đề *").fill("Test Size");
    await dialog.getByLabel("Từ gợi ý 1 *").fill("big");
    await dialog.getByLabel("Từ gợi ý 2 *").fill("file");

    // Upload file > 5MB
    const oversizedImage = path.join(FIXTURES_DIR, "oversized-image.png");
    await dialog.locator('input[type="file"]').setInputFiles(oversizedImage);
    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();

    // Hệ thống báo lỗi kích thước vượt quá 5 MiB
    await expect(dialog.getByRole("alert")).toContainText("vượt quá 5 MiB");
  });

  test("TC-CONTENT-07: Thêm mới câu hỏi Part 2 thành công và kiểm tra validation khi thiếu trường", async ({
    page,
  }) => {
    // Chuyển tab Part 2
    await page.getByRole("button", { name: "Part 2" }).click();
    await page.getByRole("button", { name: "+ Thêm bài tập" }).click();
    const dialog = page.getByRole("dialog", { name: "Form bài tập Writing" });
    await expect(dialog.getByText("WRITING PART 2")).toBeVisible();

    // 1. Kiểm tra validation khi thiếu trường
    await dialog.getByLabel("Mã bài *").fill("WP2-NEW-01");
    await dialog.getByLabel("Chủ đề *").fill("Supplier Delay");
    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Part 2 cần đủ email đề bài và yêu cầu phản hồi.",
    );

    // 2. Điền đầy đủ thông tin Part 2
    await dialog.getByLabel("From *").fill("purchasing@company.com");
    await dialog.getByLabel("To *").fill("vendor@supplier.com");
    await dialog.getByLabel("Subject *").fill("Order Delivery Status");
    await dialog
      .getByLabel("Nội dung email *")
      .fill("When will batch #902 be shipped?");
    await dialog
      .getByLabel("Yêu cầu phản hồi *")
      .fill("Apologize and provide the tracking code.");

    // Bấm lưu
    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Đã lưu bài tập.")).toBeVisible();
    await expect(page.getByText("WP2-NEW-01")).toBeVisible();
  });

  test("TC-CONTENT-08: Thêm mới câu hỏi Part 3 thành công và kiểm tra validation khi thiếu đề bài", async ({
    page,
  }) => {
    // Chuyển tab Part 3
    await page.getByRole("button", { name: "Part 3" }).click();
    await page.getByRole("button", { name: "+ Thêm bài tập" }).click();
    const dialog = page.getByRole("dialog", { name: "Form bài tập Writing" });
    await expect(dialog.getByText("WRITING PART 3")).toBeVisible();

    // 1. Kiểm tra validation khi thiếu đề bài
    await dialog.getByLabel("Mã bài *").fill("WP3-NEW-01");
    await dialog.getByLabel("Chủ đề *").fill("Higher Education");
    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Part 3 cần đề bài và số từ tối thiểu.",
    );

    // 2. Điền đầy đủ thông tin Part 3
    await dialog
      .getByLabel("Chủ đề bài luận *")
      .fill("Should university education be free for all students?");
    await dialog.getByLabel("Số từ tối thiểu *").fill("300");
    await dialog
      .getByLabel("Dàn ý gợi ý")
      .fill("1. Intro\n2. Social equity\n3. Fiscal impact\n4. Conclusion");

    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Đã lưu bài tập.")).toBeVisible();
    await expect(page.getByText("WP3-NEW-01")).toBeVisible();
  });

  test("TC-CONTENT-09: Chỉnh sửa bài tập hiện có thành công", async ({
    page,
  }) => {
    // Click nút "Sửa" trên dòng bài tập đầu tiên của Part 1
    const firstRow = page.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: "Sửa" }).click();

    const dialog = page.getByRole("dialog", { name: "Form bài tập Writing" });
    await expect(dialog).toBeVisible();

    // Sửa chủ đề
    const topicInput = dialog.getByLabel("Chủ đề *");
    await topicInput.clear();
    await topicInput.fill("Updated Office Workspace");

    await dialog.getByRole("button", { name: "Lưu bài tập" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Đã lưu bài tập.")).toBeVisible();
    await expect(page.getByText("Updated Office Workspace")).toBeVisible();
  });

  test("TC-CONTENT-10: Xóa/Lưu trữ bài tập hiện có thành công", async ({
    page,
  }) => {
    // Đăng ký confirm dialog tự động đồng ý
    page.on("dialog", (dialog) => dialog.accept());

    const firstRow = page.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: "Lưu trữ" }).click();

    await expect(page.getByText("Đã lưu trữ bài tập.")).toBeVisible();
  });

  test("TC-CONTENT-11: Import câu hỏi lẻ Part 1 bằng file Excel (.xlsx) hợp lệ", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "⇧ Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Excel Writing" });
    await expect(dialog).toBeVisible();

    // Chọn file Excel hợp lệ
    const validFile = path.join(FIXTURES_DIR, "valid-part1-exercise.xlsx");
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(validFile);

    // Bảng preview hiển thị các dòng hợp lệ
    await expect(dialog.getByText("Hợp lệ").first()).toBeVisible();

    // Nút import được kích hoạt
    const importBtn = dialog.getByRole("button", { name: "Import bài tập" });
    await expect(importBtn).toBeEnabled();
    await importBtn.click();

    // Thành công đóng modal và báo thông báo
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByText("Đã import dữ liệu bài tập thành công."),
    ).toBeVisible();
  });

  test("TC-CONTENT-12: Import câu hỏi lẻ thất bại khi file Excel thiếu cột bắt buộc", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "⇧ Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Excel Writing" });

    // Chọn file Excel thiếu cột
    const invalidFile = path.join(
      FIXTURES_DIR,
      "invalid-part1-missing-cols.xlsx",
    );
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(invalidFile);

    // Bảng preview hiển thị lỗi
    await expect(dialog.getByText("Thiếu Difficulty.")).toBeVisible();

    // Nút import bị vô hiệu hóa
    const importBtn = dialog.getByRole("button", { name: "Import bài tập" });
    await expect(importBtn).toBeDisabled();
  });
});
