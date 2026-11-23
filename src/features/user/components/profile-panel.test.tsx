// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/features/user/api";
import { ProfilePanel } from "./profile-panel";

const mocks = vi.hoisted(() => {
  const replace = vi.fn();
  return {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    replace,
    router: { replace },
  };
});
vi.mock("@/features/user/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/user/api")>();
  return {
    ...actual,
    getProfile: mocks.getProfile,
    updateProfile: mocks.updateProfile,
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("@/features/history/api", () => ({
  fetchUnifiedHistory: vi.fn().mockResolvedValue({
    items: [],
    unauthenticatedSkills: [],
  }),
}));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe("ProfilePanel", () => {
  const sampleProfile = {
    id: "user-1",
    displayName: "Noah Adams",
    email: "learner@example.com",
    phone: "0912345678",
    dateOfBirth: null,
    targetScore: 750,
    avatarVersion: null,
    hasPassword: true,
  };

  it("displays profile details, password change, and score goal on one page", () => {
    render(<ProfilePanel initialProfile={sampleProfile} />);

    expect(
      screen.getByRole("heading", { name: "Profile & Learning Goal" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveValue("Noah Adams");
    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.getByLabelText("Target score")).toHaveValue("750");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("hides the change password form for Google-only accounts", () => {
    render(
      <ProfilePanel
        initialProfile={{ ...sampleProfile, hasPassword: false }}
      />,
    );

    expect(
      screen.getByText(
        "This account signs in with Google and does not have a password.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
  });

  it("saves the goal without submitting an edited display name and preserves the name input", async () => {
    const user = userEvent.setup();
    mocks.updateProfile.mockResolvedValueOnce({
      ...sampleProfile,
      targetScore: 850,
    });
    render(<ProfilePanel initialProfile={sampleProfile} />);

    await user.type(screen.getByLabelText("Display name"), " B");
    await user.selectOptions(screen.getByLabelText("Target score"), "850");
    await user.click(screen.getByRole("button", { name: "Save goal" }));

    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        displayName: "Noah Adams",
        phone: "0912345678",
        dateOfBirth: null,
        targetScore: 850,
      }),
    );
    expect(await screen.findByText("850 / 990")).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveValue("Noah Adams B");
  });

  it("saves profile details with the latest target score after updating the goal", async () => {
    const user = userEvent.setup();
    mocks.updateProfile.mockResolvedValueOnce({
      ...sampleProfile,
      targetScore: 850,
    });
    render(<ProfilePanel initialProfile={sampleProfile} />);

    await user.selectOptions(screen.getByLabelText("Target score"), "850");
    await user.click(screen.getByRole("button", { name: "Save goal" }));
    await screen.findByText("850 / 990");

    mocks.updateProfile.mockResolvedValueOnce({
      ...sampleProfile,
      displayName: "Linh",
      targetScore: 850,
    });
    const name = screen.getByLabelText("Display name");
    await user.clear(name);
    await user.type(name, "Linh");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenLastCalledWith({
        displayName: "Linh",
        phone: "0912345678",
        dateOfBirth: null,
        targetScore: 850,
      }),
    );
  });

  it("keeps a target score that is not in the preset list", () => {
    render(
      <ProfilePanel initialProfile={{ ...sampleProfile, targetScore: 725 }} />,
    );
    expect(screen.getByLabelText("Target score")).toHaveValue("725");
  });

  it("shows loading state then renders the form once profile loads", async () => {
    let resolve!: (profile: typeof sampleProfile) => void;
    mocks.getProfile.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<ProfilePanel />);
    expect(screen.getByLabelText("Loading profile")).toBeInTheDocument();
    resolve(sampleProfile);
    expect(await screen.findByLabelText("Display name")).toBeInTheDocument();
  });

  it("shows an error and allows retrying", async () => {
    const user = userEvent.setup();
    mocks.getProfile.mockRejectedValueOnce(new Error("offline"));
    mocks.getProfile.mockResolvedValueOnce(sampleProfile);
    render(<ProfilePanel />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load profile.",
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByLabelText("Display name")).toBeInTheDocument();
  });

  it("redirects to login when the session expires", async () => {
    mocks.getProfile.mockRejectedValueOnce(
      new ApiError(401, "Session expired"),
    );
    render(<ProfilePanel />);
    await screen.findByRole("alert");
    expect(mocks.replace).toHaveBeenCalledWith("/login?next=%2Fprofile");
  });
});
