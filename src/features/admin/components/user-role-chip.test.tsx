// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserRoleChip } from "./user-role-chip";
import type { AdminUserRole } from "@/features/admin/users";

describe("UserRoleChip", () => {
  it("labels administrator accounts", () => {
    const props: { userRole: AdminUserRole } = { userRole: "ADMIN" };
    render(<UserRoleChip {...props} />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});
