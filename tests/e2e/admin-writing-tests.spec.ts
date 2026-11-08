import { test, expect } from "@playwright/test";
import path from "node:path";
import {
  MockWritingAdminBackend,
  FIXTURES_DIR,
  loginAsAdmin,
} from "./admin-writing-helpers";

test.describe("Admin Writing - Quản lý Đề thi Writing độc lập (/admin/tests/writing)", () => {
  let backend: MockWritingAdminBackend;

  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin(context);
    backend = new MockWritingAdminBackend();
    await backend.setupRoutes(page);
    await page.goto("/admin/tests/writing");
    await expect(
      page.getByRole("heading", { name: "Đề Writing" }),
    ).toBeVisible();
  });

  test("TC-TEST-01: Hiển thị danh sách đề thi độc lập, tìm kiếm và lọc theo trạng thái", async ({
    page,
  }) => {
    // Kiểm tra danh sách đề khởi tạo
    await expect(page.getByText("WT-DRAFT-01")).toBeVisible();
    await expect(page.getByText("WT-PUB-01")).toBeVisible();
    await expect(page.getByText("WT-ARC-01")).toBeVisible();

    // Lọc theo từ khóa tìm kiếm
    const searchInput = page.getByLabel("Tìm đề Writing");
    await searchInput.fill("PUB");
    await expect(page.getByText("WT-PUB-01")).toBeVisible();
    await expect(page.getByText("WT-DRAFT-01")).not.toBeVisible();

    // Lọc theo trạng thái Đã công bố
    await searchInput.clear();
    const statusSelect = page.getByLabel("Lọc trạng thái đề");
    await statusSelect.selectOption("PUBLISHED");
    await expect(page.getByText("WT-PUB-01")).toBeVisible();
    await expect(page.getByText("WT-DRAFT-01")).not.toBeVisible();

    // Lọc theo trạng thái Bản nháp
    await statusSelect.selectOption("DRAFT");
    await expect(page.getByText("WT-DRAFT-01")).toBeVisible();
    await expect(page.getByText("WT-PUB-01")).not.toBeVisible();

    // Lọc theo trạng thái Đã lưu trữ
    await statusSelect.selectOption("ARCHIVED");
    await expect(page.getByText("WT-ARC-01")).toBeVisible();
  });

  test("TC-TEST-02: Tạo đề thi mới trực tiếp (nhập trọn gói 8 câu 5/2/1) và Lưu nháp thành công", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Tạo đề Writing" }).click();
    const builder = page.getByRole("dialog", { name: "Soạn đề Writing" });
    await expect(builder).toBeVisible();
    await expect(builder.getByText("Soạn đề Writing · 5/2/1")).toBeVisible();

    // Kiểm tra có đủ 8 câu trong thanh điều hướng cấu trúc
    await expect(builder.getByText("Cấu trúc đề · 8 câu")).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 1 · Câu 1" }),
    ).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 1 · Câu 5" }),
    ).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 2 · Câu 1" }),
    ).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 2 · Câu 2" }),
    ).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 3 · Câu 1" }),
    ).toBeVisible();

    // Điền mã đề và tên đề
    await builder.getByLabel("Mã đề *").fill("WT-NEW-01");
    await builder.getByLabel("Tên đề *").fill("Đề thi Writing Mới 01");
    await builder
      .getByRole("textbox", { name: "Mô tả", exact: true })
      .fill("Mô tả đề thi tạo trực tiếp");

    // Bấm "Lưu nháp"
    await builder.getByRole("button", { name: "Lưu nháp" }).click();

    // Thành công đóng builder và hiển thị thông báo
    await expect(builder).not.toBeVisible();
    await expect(page.getByText("Đã lưu bản nháp đề Writing.")).toBeVisible();
    await expect(page.getByText("WT-NEW-01")).toBeVisible();
  });

  test("TC-TEST-03: Tạo đề thi thất bại khi để trống Mã đề hoặc Tên đề (Validation Error)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Tạo đề Writing" }).click();
    const builder = page.getByRole("dialog", { name: "Soạn đề Writing" });

    // Không điền gì và bấm Lưu nháp
    await builder.getByRole("button", { name: "Lưu nháp" }).click();
    await expect(builder.getByRole("alert")).toContainText(
      "Mã đề và tên đề là bắt buộc.",
    );

    // Chỉ điền mã đề mà không điền tên đề
    await builder.getByLabel("Mã đề *").fill("WT-FAIL-NO-TITLE");
    await builder.getByRole("button", { name: "Lưu nháp" }).click();
    await expect(builder.getByRole("alert")).toContainText(
      "Mã đề và tên đề là bắt buộc.",
    );
  });

  test("TC-TEST-04: Vòng đời đề thi - Cho phép Chỉnh sửa đề ở trạng thái Bản nháp (DRAFT)", async ({
    page,
  }) => {
    // Tìm dòng đề DRAFT và bấm "Chỉnh sửa"
    const draftRow = page.locator("tbody tr", { hasText: "WT-DRAFT-01" });
    await expect(
      draftRow.getByRole("button", { name: "Chỉnh sửa" }),
    ).toBeVisible();
    await draftRow.getByRole("button", { name: "Chỉnh sửa" }).click();

    const builder = page.getByRole("dialog", { name: "Soạn đề Writing" });
    await expect(builder).toBeVisible();
    await expect(builder.getByLabel("Mã đề *")).toHaveValue("WT-DRAFT-01");

    // Chỉnh sửa tên đề
    const titleInput = builder.getByLabel("Tên đề *");
    await titleInput.clear();
    await titleInput.fill("Đề thi Writing Bản nháp Đã Sửa");

    await builder.getByRole("button", { name: "Lưu nháp" }).click();
    await expect(builder).not.toBeVisible();
    await expect(page.getByText("Đã lưu bản nháp đề Writing.")).toBeVisible();
    await expect(
      page.getByText("Đề thi Writing Bản nháp Đã Sửa"),
    ).toBeVisible();
  });

  test("TC-TEST-05: Vòng đời đề thi - Cho phép Xóa đề ở trạng thái Bản nháp (DRAFT)", async ({
    page,
  }) => {
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toContain("Xóa vĩnh viễn đề nháp WT-DRAFT-01");
      dialog.accept();
    });

    const draftRow = page.locator("tbody tr", { hasText: "WT-DRAFT-01" });
    await expect(draftRow.getByRole("button", { name: "Xóa" })).toBeVisible();
    await draftRow.getByRole("button", { name: "Xóa" }).click();

    // Thông báo xóa thành công và đề biến mất khỏi bảng
    await expect(page.getByText("Đã xóa đề nháp.")).toBeVisible();
    await expect(page.getByText("WT-DRAFT-01")).not.toBeVisible();
  });

  test("TC-TEST-06: Vòng đời đề thi - PUBLISH đề thi đủ đúng 8 câu 5/2/1 thành công", async ({
    page,
  }) => {
    // Mở đề nháp có đủ 8 câu để công bố
    const draftRow = page.locator("tbody tr", { hasText: "WT-DRAFT-01" });
    await draftRow.getByRole("button", { name: "Chỉnh sửa" }).click();

    const builder = page.getByRole("dialog", { name: "Soạn đề Writing" });
    await expect(builder).toBeVisible();

    // Bấm "Lưu và công bố"
    await builder.getByRole("button", { name: "Lưu và công bố" }).click();

    // Thông báo xuất bản thành công
    await expect(builder).not.toBeVisible();
    await expect(page.getByText("Đã công bố đề Writing.")).toBeVisible();

    // Kiểm tra trạng thái đề đã đổi sang "Đã công bố"
    const updatedRow = page.locator("tbody tr", { hasText: "WT-DRAFT-01" });
    await expect(updatedRow.getByText("Đã công bố")).toBeVisible();
  });

  test("TC-TEST-07: Đóng băng (FREEZE) nội dung đề thi đã PUBLISH - Không cho phép chỉnh sửa", async ({
    page,
  }) => {
    // Kiểm tra dòng đề đã công bố WT-PUB-01
    const pubRow = page.locator("tbody tr", { hasText: "WT-PUB-01" });
    await expect(pubRow.getByText("Đã công bố", { exact: true })).toBeVisible();

    // Đề PUBLISHED chỉ có nút "Xem" và "Lưu trữ", TUYỆT ĐỐI KHÔNG có nút "Chỉnh sửa" hay "Xóa"
    await expect(pubRow.getByRole("button", { name: "Xem" })).toBeVisible();
    await expect(pubRow.getByRole("button", { name: "Lưu trữ" })).toBeVisible();
    await expect(
      pubRow.getByRole("button", { name: "Chỉnh sửa" }),
    ).not.toBeVisible();
    await expect(pubRow.getByRole("button", { name: "Xóa" })).not.toBeVisible();

    // Bấm xem chi tiết để kiểm tra đề chỉ ở chế độ đọc
    await pubRow.getByRole("button", { name: "Xem" }).click();
    const preview = page.getByRole("dialog", { name: "Chi tiết đề Writing" });
    await expect(preview).toBeVisible();
    await expect(preview.getByText("WT-PUB-01 · Đã công bố")).toBeVisible();
    await preview.getByRole("button", { name: "Đóng", exact: true }).click();
    await expect(preview).not.toBeVisible();
  });

  test("TC-TEST-08: Vòng đời đề thi - ARCHIVE (Lưu trữ đề) và RESTORE (Khôi phục đề)", async ({
    page,
  }) => {
    // 1. ARCHIVE đề WT-PUB-01
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Lưu trữ đề WT-PUB-01");
      dialog.accept();
    });

    const pubRow = page.locator("tbody tr", { hasText: "WT-PUB-01" });
    await pubRow.getByRole("button", { name: "Lưu trữ" }).click();
    await expect(page.getByText("Đã lưu trữ đề Writing.")).toBeVisible();

    // Trạng thái chuyển sang "Đã lưu trữ"
    const arcRow = page.locator("tbody tr", { hasText: "WT-PUB-01" });
    await expect(arcRow.getByText("Đã lưu trữ", { exact: true })).toBeVisible();

    // 2. RESTORE đề vừa lưu trữ
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Khôi phục đề WT-PUB-01");
      dialog.accept();
    });

    await arcRow.getByRole("button", { name: "Khôi phục" }).click();
    await expect(page.getByText("Đã khôi phục đề Writing.")).toBeVisible();

    // Trạng thái trở lại "Đã công bố"
    await expect(
      page
        .locator("tbody tr", { hasText: "WT-PUB-01" })
        .getByText("Đã công bố", { exact: true }),
    ).toBeVisible();
  });

  test("TC-TEST-09: Import toàn bộ đề thi hoàn chỉnh từ file Excel (.xlsx) 4 sheet thành công", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import đề Writing" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Import Excel đề Writing" }),
    ).toBeVisible();

    // Kiểm tra link tải file mẫu
    const templateLink = dialog.getByRole("link", { name: "Tải file mẫu" });
    await expect(templateLink).toBeVisible();
    await expect(templateLink).toHaveAttribute(
      "href",
      "/api/admin/writing/tests/import-template",
    );

    // Upload file Excel hợp lệ (4 sheet chuẩn 8 câu)
    const validExam = path.join(FIXTURES_DIR, "valid-complete-test.xlsx");
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(validExam);

    // Preview hiển thị file hợp lệ
    await expect(
      dialog.getByText("File hợp lệ, sẵn sàng tạo bản nháp."),
    ).toBeVisible();

    // Nút import được kích hoạt
    const importBtn = dialog.getByRole("button", { name: "Import bản nháp" });
    await expect(importBtn).toBeEnabled();
    await importBtn.click();

    // Đóng modal và hiển thị đề mới trong danh sách
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByText("Đã import đề Writing ở trạng thái nháp."),
    ).toBeVisible();
    await expect(page.getByText("WT-IMP-FULL")).toBeVisible();
  });

  test("TC-TEST-10: Import đề thi thất bại khi file Excel thiếu sheet hoặc sai số lượng câu chuẩn 5/2/1", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import đề Writing" });

    // 1. File thiếu sheet (chỉ có Manifest và Part 1)
    const missingSheetExam = path.join(
      FIXTURES_DIR,
      "invalid-missing-sheets-test.xlsx",
    );
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(missingSheetExam);

    // Bảng preview hiển thị lỗi yêu cầu đủ 4 sheet
    await expect(
      dialog.getByText("File cần đủ 4 sheet: Manifest, Part1, Part2, Part3."),
    ).toBeVisible();
    const importBtn = dialog.getByRole("button", { name: "Import bản nháp" });
    await expect(importBtn).toBeDisabled();

    // 2. File sai số lượng câu (Part 1 chỉ có 2 câu thay vì 5 câu)
    const wrongCountExam = path.join(FIXTURES_DIR, "invalid-counts-test.xlsx");
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(wrongCountExam);

    // Bảng preview hiển thị lỗi Part 1 cần đúng 5 câu
    await expect(dialog.getByText("Part 1 cần đúng 5 câu.")).toBeVisible();
    await expect(importBtn).toBeDisabled();
  });

  test("TC-TEST-11: Import đề thi thất bại khi dùng file Excel template của Listening & Reading", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import đề Writing" });

    // Sử dụng file output của LR trong project
    const lrExamFile = path.resolve(
      FIXTURES_DIR,
      "../../../../TOEICMaster-BE/outputs/admin-lr-exam-import-template/toeic-lr-exam-import-template.xlsx",
    );
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(lrExamFile);

    // Preview hiển thị lỗi do không khớp 4 sheet Writing
    await expect(
      dialog.getByText("File cần đủ 4 sheet: Manifest, Part1, Part2, Part3."),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Import bản nháp" }),
    ).toBeDisabled();
  });
});
