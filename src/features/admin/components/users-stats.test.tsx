// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UsersStats } from "./users-stats";

describe("UsersStats", () => {
  it("shows counts and selects the matching status filter", () => {
    const onSelectStatus = vi.fn();
    render(
      <UsersStats
        stats={{
          totalUsers: 20,
          activeUsers: 15,
          pendingUsers: 3,
          lockedUsers: 2,
        }}
        selectedStatus="ALL"
        onSelectStatus={onSelectStatus}
      />,
    );
    expect(screen.getByText("20")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Bị khóa/ }));
    expect(onSelectStatus).toHaveBeenCalledWith("LOCKED");
  });
});
