// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUsersApiError } from "@/features/admin/api";
import { toast } from "@/shared/ui/toast";
import { UsersPage } from "./users-page";

const router = { replace: vi.fn() };
let url = "";
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/admin/users",
  useSearchParams: () => new URLSearchParams(url),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/admin/api", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/admin/api")>();
  return { ...original, getAdminUsers: vi.fn() };
});
vi.mock("@/shared/ui/toast", () => ({ toast: { error: vi.fn() } }));

import { getAdminUsers } from "@/features/admin/api";

const data = {
  items: [],
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
  stats: { totalUsers: 0, activeUsers: 0, pendingUsers: 0, lockedUsers: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  url = "";
});

describe("UsersPage", () => {
  it("shows loading followed by the empty state", async () => {
    vi.mocked(getAdminUsers).mockResolvedValue(data);
    render(<UsersPage />);
    expect(
      screen.getByLabelText("Đang tải danh sách người dùng"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Chưa có người dùng nào")).toBeInTheDocument(),
    );
  });

  it("shows a retry action for service failures", async () => {
    vi.mocked(getAdminUsers).mockRejectedValue(
      new AdminUsersApiError(502, "Dịch vụ lỗi."),
    );
    render(<UsersPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Thử lại" }),
      ).toBeInTheDocument(),
    );
  });

  it("redirects a forbidden session and shows the shared warning toast", async () => {
    vi.mocked(getAdminUsers).mockRejectedValue(
      new AdminUsersApiError(403, "Bạn không có quyền."),
    );
    render(<UsersPage />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(toast.error).toHaveBeenCalledWith(
      "Tài khoản của bạn không có quyền truy cập khu vực quản trị.",
    );
  });

  it("provides a login path when refreshing an expired session fails", async () => {
    vi.mocked(getAdminUsers).mockRejectedValue(
      new AdminUsersApiError(401, "Phiên đăng nhập đã hết hạn."),
    );
    render(<UsersPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Đăng nhập lại" }),
      ).toHaveAttribute("href", "/login?next=%2Fadmin%2Fusers"),
    );
  });

  it("distinguishes a filtered empty result from an empty account list", async () => {
    url = "q=khongton tai";
    vi.mocked(getAdminUsers).mockResolvedValue({
      ...data,
      stats: {
        totalUsers: 12,
        activeUsers: 8,
        pendingUsers: 2,
        lockedUsers: 2,
      },
    });
    render(<UsersPage />);
    await waitFor(() =>
      expect(
        screen.getByText("Không tìm thấy kết quả phù hợp"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Xóa bộ lọc" }),
    ).toBeInTheDocument();
  });
});
