// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KnowledgeConfirmDialog } from "./knowledge-ui-primitives";

const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  "showModal",
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  "close",
);

afterEach(() => {
  cleanup();
  if (originalShowModal) {
    Object.defineProperty(
      HTMLDialogElement.prototype,
      "showModal",
      originalShowModal,
    );
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  }
  if (originalClose) {
    Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  }
});

function installDialogMethods() {
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  const close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: showModal,
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: close,
  });
  return { close, showModal };
}

function renderDialog({
  onCancel = vi.fn(),
  onConfirm = vi.fn(),
  pending = false,
}: {
  onCancel?: () => void;
  onConfirm?: () => void;
  pending?: boolean;
} = {}) {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)} type="button">
          Open confirmation
        </button>
        <KnowledgeConfirmDialog
          description="This action cannot be undone."
          onCancel={() => {
            onCancel();
            setOpen(false);
          }}
          onConfirm={onConfirm}
          open={open}
          pending={pending}
          title="Confirm deletion"
        />
      </>
    );
  }
  return { ...render(<Harness />), onCancel, onConfirm };
}

describe("KnowledgeConfirmDialog", () => {
  it("opens from the keyboard, contains focus, cancels on Escape, and restores focus", async () => {
    const user = userEvent.setup();
    const { showModal, close } = installDialogMethods();
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    const trigger = screen.getByRole("button", { name: "Open confirmation" });

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    const cancel = within(dialog).getByRole("button", { name: "Hủy" });
    const confirm = within(dialog).getByRole("button", {
      name: "Xác nhận xóa",
    });
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveFocus();

    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
    expect(
      screen.queryByRole("dialog", { name: "Confirm deletion" }),
    ).toBeNull();
  });

  it("cancels from the Cancel button and backdrop", async () => {
    const user = userEvent.setup();
    installDialogMethods();
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    const trigger = screen.getByRole("button", { name: "Open confirmation" });

    await user.click(trigger);
    await user.click(
      within(
        screen.getByRole("dialog", { name: "Confirm deletion" }),
      ).getByRole("button", { name: "Hủy" }),
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    fireEvent.click(dialog);
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(trigger).toHaveFocus();
  });

  it("locks Escape, backdrop, Cancel, and confirmation while pending", async () => {
    const user = userEvent.setup();
    installDialogMethods();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderDialog({ onCancel, onConfirm, pending: true });
    await user.click(screen.getByRole("button", { name: "Open confirmation" }));

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    const cancel = within(dialog).getByRole("button", { name: "Hủy" });
    const confirm = within(dialog).getByRole("button", {
      name: "Đang xử lý...",
    });
    expect(cancel).toBeDisabled();
    expect(confirm).toBeDisabled();

    await user.keyboard("{Escape}");
    fireEvent.click(dialog);
    const cancelEvent = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Confirm deletion" }),
    ).toBeInTheDocument();
  });

  it("falls back to an open dialog when showModal is unavailable", async () => {
    const user = userEvent.setup();
    Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
    Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open confirmation" }));

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByRole("button", { name: "Hủy" })).toHaveFocus();
  });
});
