import { describe, expect, it, vi } from "vitest";

const hotToast = vi.hoisted(() => ({
  dismiss: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  promise: vi.fn(),
  success: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({ default: hotToast }));

import { toast } from "./toast";

describe("toast", () => {
  it("delegates success, error, loading, promise, and dismiss operations", () => {
    const task = Promise.resolve("done");
    const messages = { loading: "Saving...", success: "Saved." };

    toast.success("Success");
    toast.error("Something went wrong");
    toast.loading("Processing...");
    toast.promise(task, messages);
    toast.dismiss("toast-id");

    expect(hotToast.success).toHaveBeenCalledWith("Success", undefined);
    expect(hotToast.error).toHaveBeenCalledWith(
      "Something went wrong",
      undefined,
    );
    expect(hotToast.loading).toHaveBeenCalledWith("Processing...", undefined);
    expect(hotToast.promise).toHaveBeenCalledWith(task, messages, undefined);
    expect(hotToast.dismiss).toHaveBeenCalledWith("toast-id");
  });
});
