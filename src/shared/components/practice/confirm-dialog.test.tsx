import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

describe("practice/ConfirmDialog", () => {
  it("renders via Radix Dialog without raw <dialog> tags, focuses cancel initially, and handles callbacks", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        cancelLabel="Tiếp tục làm"
        confirmLabel="Thoát phòng thi"
        id="leave-title"
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Rời khỏi phòng thi?"
      >
        <p>Tiến độ hiện tại sẽ không được lưu.</p>
      </ConfirmDialog>,
    );

    expect(document.querySelectorAll("dialog")).toHaveLength(0);
    const dialog = await screen.findByRole("dialog", {
      name: "Rời khỏi phòng thi?",
    });
    expect(dialog).toHaveAccessibleDescription(
      "Tiến độ hiện tại sẽ không được lưu.",
    );

    const cancelBtn = screen.getByTestId("confirm-dialog-cancel");
    const confirmBtn = screen.getByTestId("confirm-dialog-confirm");
    await waitFor(() => {
      expect(document.activeElement).toBe(cancelBtn);
    });

    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
