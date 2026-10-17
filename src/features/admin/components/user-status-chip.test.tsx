// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserStatusChip } from "./user-status-chip";

describe("UserStatusChip", () => {
  it("uses a text label for the status", () => {
    render(<UserStatusChip status="PENDING" />);
    expect(screen.getByText("Chờ xác minh")).toBeInTheDocument();
  });
});
