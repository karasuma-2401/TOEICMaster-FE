// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExcelFileSlot, ExcelImportDialog } from "./admin-excel-import";

afterEach(cleanup);

function renderSlot(file: File | null = null) {
  const onSelect = vi.fn();
  const onReject = vi.fn();
  render(
    <ExcelFileSlot
      file={file}
      maxMb={1}
      onReject={onReject}
      onSelect={onSelect}
    />,
  );
  return { onSelect, onReject, input: screen.getByLabelText(/File Excel/) };
}

describe("ExcelFileSlot", () => {
  it("accepts a dropped workbook", () => {
    const { onSelect, input } = renderSlot();
    const file = new File(["x"], "de.XLSX");

    fireEvent.drop(input, {
      dataTransfer: { files: [file] },
    });

    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it("rejects the wrong type and oversized files", () => {
    const { onSelect, onReject, input } = renderSlot();

    fireEvent.change(input, {
      target: { files: [new File(["x"], "de.csv")] },
    });
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(2 ** 20 + 1)], "de.xlsx")] },
    });

    expect(onReject).toHaveBeenCalledWith("Chỉ hỗ trợ file Excel .xlsx.");
    expect(onReject).toHaveBeenCalledWith(
      "File Excel không được vượt quá 1 MiB.",
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the chosen file", () => {
    renderSlot(new File(["x"], "de-thi.xlsx"));

    expect(screen.getByText("de-thi.xlsx")).toBeInTheDocument();
    expect(screen.getByText("Đổi file")).toBeInTheDocument();
  });
});

describe("ExcelImportDialog", () => {
  const dialog = (busy: boolean, onClose = vi.fn()) => {
    render(
      <ExcelImportDialog
        busy={busy}
        canSubmit
        onClose={onClose}
        onSubmit={vi.fn()}
        submitLabel="Import"
        summary="Tóm tắt"
        title="Import"
      >
        <span />
      </ExcelImportDialog>,
    );
    return onClose;
  };

  it("closes on Escape when idle", () => {
    const onClose = dialog(false);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cannot be dismissed while an upload is running", () => {
    const onClose = dialog(true);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
  });
});
