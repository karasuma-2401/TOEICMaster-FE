import { useRef, useState } from "react";
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
        cancelLabel="Keep working"
        confirmLabel="Leave test"
        id="leave-title"
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Leave the test room?"
      >
        <p>Your current progress will not be saved.</p>
      </ConfirmDialog>,
    );

    expect(document.querySelectorAll("dialog")).toHaveLength(0);
    const dialog = await screen.findByRole("dialog", {
      name: "Leave the test room?",
    });
    expect(dialog).toHaveAccessibleDescription(
      "Your current progress will not be saved.",
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

  it.each(["Escape", "Cancel"] as const)(
    "forwards returnFocusRef and restores focus on %s",
    async (dismissMethod) => {
      const user = userEvent.setup();
      function Wrapper() {
        const [open, setOpen] = useState(false);
        const submitRef = useRef<HTMLButtonElement | null>(null);
        return (
          <>
            <button onClick={() => setOpen(true)} ref={submitRef} type="button">
              Submit
            </button>
            <ConfirmDialog
              cancelLabel="Go back"
              confirmLabel="Confirm submit"
              id="practice-confirm"
              onCancel={() => setOpen(false)}
              onConfirm={() => setOpen(false)}
              open={open}
              returnFocusRef={submitRef}
              title="Submit Writing attempt?"
            >
              <p>Locked after submit.</p>
            </ConfirmDialog>
          </>
        );
      }

      render(<Wrapper />);
      const submitBtn = screen.getByRole("button", { name: "Submit" });
      await user.click(submitBtn);
      await screen.findByRole("dialog", { name: "Submit Writing attempt?" });
      if (dismissMethod === "Escape") {
        await user.keyboard("{Escape}");
      } else {
        await user.click(screen.getByRole("button", { name: "Go back" }));
      }
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(submitBtn).toHaveFocus();
      });
    },
  );
});
