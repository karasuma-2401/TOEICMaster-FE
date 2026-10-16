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
    const messages = { loading: "Đang lưu...", success: "Đã lưu." };

    toast.success("Thành công");
    toast.error("Có lỗi xảy ra");
    toast.loading("Đang xử lý...");
    toast.promise(task, messages);
    toast.dismiss("toast-id");

    expect(hotToast.success).toHaveBeenCalledWith("Thành công", undefined);
    expect(hotToast.error).toHaveBeenCalledWith("Có lỗi xảy ra", undefined);
    expect(hotToast.loading).toHaveBeenCalledWith("Đang xử lý...", undefined);
    expect(hotToast.promise).toHaveBeenCalledWith(task, messages, undefined);
    expect(hotToast.dismiss).toHaveBeenCalledWith("toast-id");
  });
});
