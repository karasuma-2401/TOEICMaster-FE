// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ADMIN_USERS_QUERY } from "@/features/admin/users";
import { UsersToolbar } from "./users-toolbar";

afterEach(() => vi.useRealTimers());

describe("UsersToolbar", () => {
  it("reports search and filter changes", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const onRoleChange = vi.fn();
    render(
      <UsersToolbar
        query={DEFAULT_ADMIN_USERS_QUERY}
        selectedCount={0}
        onSearch={onSearch}
        onRoleChange={onRoleChange}
        onStatusChange={vi.fn()}
        onExport={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Mai" },
    });
    fireEvent.change(screen.getByLabelText("Lọc theo vai trò"), {
      target: { value: "ADMIN" },
    });
    act(() => vi.advanceTimersByTime(299));
    expect(onSearch).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onSearch).toHaveBeenCalledWith("Mai");
    expect(onRoleChange).toHaveBeenCalledWith("ADMIN");
  });
});
