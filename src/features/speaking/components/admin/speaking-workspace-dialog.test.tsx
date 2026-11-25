// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SpeakingWorkspaceDialog } from "./speaking-workspace-dialog";

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <div className="sp-theme" data-testid="theme-root">
      <button onClick={() => setOpen(true)} type="button">
        + Create Speaking test
      </button>
      <table>
        <tbody>
          <tr>
            <td>
              <button type="button">Background row</button>
            </td>
          </tr>
        </tbody>
      </table>
      {open && (
        <SpeakingWorkspaceDialog
          actions={
            <button onClick={close} type="button">
              Close builder
            </button>
          }
          eyebrow="TEST BUILDER"
          label="Direct Speaking test authoring"
          onClose={close}
          title="New Speaking test"
        >
          <input aria-label="Test title" />
        </SpeakingWorkspaceDialog>
      )}
    </div>
  );
}

describe("SpeakingWorkspaceDialog", () => {
  it("is a named modal that keeps Tab focus inside and hides the page behind it", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole("button", { name: "+ Create Speaking test" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Direct Speaking test authoring",
    });
    // Portaled inside the `.sp-theme` root so Speaking tokens/fonts still apply.
    expect(screen.getByTestId("theme-root")).toContainElement(dialog);
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement),
    );

    for (let press = 0; press < 8; press += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    expect(
      screen.queryByRole("button", { name: "Background row" }),
    ).not.toBeInTheDocument();
  });

  it("routes Escape through onClose and restores focus to the opener", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole("button", {
      name: "+ Create Speaking test",
    });
    await user.click(opener);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
