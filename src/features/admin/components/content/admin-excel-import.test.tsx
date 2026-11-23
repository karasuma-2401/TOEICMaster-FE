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
  return { onSelect, onReject, input: screen.getByLabelText(/Excel file/) };
}

describe("ExcelFileSlot", () => {
  it("accepts a dropped workbook", () => {
    const { onSelect, input } = renderSlot();
    const file = new File(["x"], "exam.XLSX");

    fireEvent.drop(input, {
      dataTransfer: { files: [file] },
    });

    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it("rejects the wrong type and oversized files", () => {
    const { onSelect, onReject, input } = renderSlot();

    fireEvent.change(input, {
      target: { files: [new File(["x"], "exam.csv")] },
    });
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(2 ** 20 + 1)], "exam.xlsx")] },
    });

    expect(onReject).toHaveBeenCalledWith(
      "Only .xlsx Excel files are supported.",
    );
    expect(onReject).toHaveBeenCalledWith("Excel file must not exceed 1 MiB.");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the chosen file", () => {
    renderSlot(new File(["x"], "test-exam.xlsx"));

    expect(screen.getByText("test-exam.xlsx")).toBeInTheDocument();
    expect(screen.getByText("Change file")).toBeInTheDocument();
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
        summary="Summary"
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
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
