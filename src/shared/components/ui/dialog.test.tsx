import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ConfirmDialog,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

function DemoDialog({ variant = "modal" }: { variant?: "modal" | "drawer" }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button">Mở hộp thoại</button>
      </DialogTrigger>
      <DialogContent variant={variant}>
        <DialogHeader>
          <DialogTitle>Tiêu đề hộp thoại</DialogTitle>
          <DialogDescription>Mô tả chi tiết hộp thoại</DialogDescription>
        </DialogHeader>
        <input aria-label="Tên bài thi" type="text" />
        <DialogFooter>
          <DialogClose asChild>
            <button type="button">Hủy bỏ</button>
          </DialogClose>
          <button type="button">Xác nhận</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe("ui/dialog", () => {
  it("opens modal via trigger, exposes accessible title/description, traps focus, closes on Escape, and restores focus", async () => {
    const user = userEvent.setup();
    render(<DemoDialog variant="modal" />);

    const trigger = screen.getByRole("button", { name: "Mở hộp thoại" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", {
      name: "Tiêu đề hộp thoại",
    });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-testid", "ui-dialog-content");
    expect(dialog).toHaveAttribute("data-variant", "modal");
    expect(dialog).toHaveAccessibleDescription("Mô tả chi tiết hộp thoại");

    const input = screen.getByLabelText("Tên bài thi");
    const cancel = screen.getByRole("button", { name: "Hủy bỏ" });
    const confirm = screen.getByRole("button", { name: "Xác nhận" });
    const closeBtn = screen.getByRole("button", { name: "Đóng" });

    // Focus moves inside the dialog on open
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Tab and Shift+Tab cycle within dialog focusable controls
    input.focus();
    await user.tab();
    expect(document.activeElement).toBe(cancel);
    await user.tab();
    expect(document.activeElement).toBe(confirm);
    await user.tab();
    expect(document.activeElement).toBe(closeBtn);
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(closeBtn);

    // Escape closes dialog and restores focus to trigger
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(trigger);
  });

  it("supports drawer variant with focus-visible ring classes", async () => {
    const user = userEvent.setup();
    render(<DemoDialog variant="drawer" />);

    await user.click(screen.getByRole("button", { name: "Mở hộp thoại" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Tiêu đề hộp thoại",
    });
    expect(dialog).toHaveAttribute("data-variant", "drawer");
    const closeBtn = screen.getByRole("button", { name: "Đóng" });
    expect(closeBtn.className).toContain("focus-visible:outline-2");
  });

  it("ConfirmDialog focuses cancel initially, handles Escape/cancel, and invokes onConfirm", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    function ControlledConfirm() {
      const [open, setOpen] = useState(true);
      if (!open) return null;
      return (
        <ConfirmDialog
          cancelLabel="Ở lại"
          confirmLabel="Nộp bài"
          id="confirm-title"
          onCancel={() => {
            onCancel();
            setOpen(false);
          }}
          onConfirm={onConfirm}
          title="Xác nhận nộp bài"
        >
          Bạn chắc chắn muốn nộp bài?
        </ConfirmDialog>
      );
    }

    render(<ControlledConfirm />);
    const cancelBtn = await screen.findByTestId("confirm-dialog-cancel");
    const confirmBtn = screen.getByTestId("confirm-dialog-confirm");
    expect(document.querySelectorAll("dialog")).toHaveLength(0);
    await waitFor(() => {
      expect(document.activeElement).toBe(cancelBtn);
    });

    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
