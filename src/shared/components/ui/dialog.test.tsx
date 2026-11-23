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
        <button type="button">Open dialog</button>
      </DialogTrigger>
      <DialogContent variant={variant}>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Dialog description details</DialogDescription>
        </DialogHeader>
        <input aria-label="Exam name" type="text" />
        <DialogFooter>
          <DialogClose asChild>
            <button type="button">Cancel</button>
          </DialogClose>
          <button type="button">Confirm</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe("ui/dialog", () => {
  it("opens modal via trigger, exposes accessible title/description, traps focus, closes on Escape, and restores focus", async () => {
    const user = userEvent.setup();
    render(<DemoDialog variant="modal" />);

    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", {
      name: "Dialog title",
    });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-testid", "ui-dialog-content");
    expect(dialog).toHaveAttribute("data-variant", "modal");
    expect(dialog).toHaveAccessibleDescription("Dialog description details");

    const input = screen.getByLabelText("Exam name");
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Confirm" });
    const closeBtn = screen.getByRole("button", { name: "Close" });

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

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Dialog title",
    });
    expect(dialog).toHaveAttribute("data-variant", "drawer");
    const closeBtn = screen.getByRole("button", { name: "Close" });
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
          cancelLabel="Stay"
          confirmLabel="Submit"
          id="confirm-title"
          onCancel={() => {
            onCancel();
            setOpen(false);
          }}
          onConfirm={onConfirm}
          title="Confirm submission"
        >
          Are you sure you want to submit?
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

    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("ConfirmDialog invokes onCancel on Escape and DialogContent respects showCloseButton=false", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        id="esc-title"
        onCancel={onCancel}
        onConfirm={vi.fn()}
        title="Confirm deletion"
      >
        This action cannot be undone.
      </ConfirmDialog>,
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Confirm deletion",
    });
    expect(dialog.querySelector('button[aria-label="Close"]')).toBeNull();
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
