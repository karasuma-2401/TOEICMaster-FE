// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/features/user/api";
import type { UserProfile } from "@/features/user/profile";
import { ProfileDetailsCard } from "./profile-details-card";

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/features/user/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/user/api")>();
  return {
    ...actual,
    updateProfile: mocks.updateProfile,
    uploadAvatar: mocks.uploadAvatar,
  };
});
vi.mock("@/shared/ui/toast", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

const sampleUser: UserProfile = {
  id: "user-1",
  displayName: "Noah Adams",
  email: "learner@example.com",
  phone: "0912345678",
  dateOfBirth: "1998-05-12",
  targetScore: 750,
  avatarVersion: null,
  hasPassword: true,
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateProfile.mockResolvedValue({
    ...sampleUser,
    displayName: "Noah Clark",
  });
  mocks.uploadAvatar.mockResolvedValue({ ...sampleUser, avatarVersion: "v2" });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:avatar-preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("ProfileDetailsCard", () => {
  it("keeps Save changes button disabled when there are no changes", () => {
    render(<ProfileDetailsCard profile={sampleUser} />);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("submits trimmed data, disables the button while saving, and shows success toast", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    let finishSave!: (profile: UserProfile) => void;
    mocks.updateProfile.mockReturnValueOnce(
      new Promise((resolve) => {
        finishSave = resolve;
      }),
    );
    render(<ProfileDetailsCard onSaved={onSaved} profile={sampleUser} />);
    const nameInput = screen.getByLabelText("Display name");
    await user.clear(nameInput);
    await user.type(nameInput, "  Noah Clark  ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mocks.updateProfile).toHaveBeenCalledWith({
      displayName: "Noah Clark",
      phone: "0912345678",
      dateOfBirth: "1998-05-12",
      targetScore: 750,
    });
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    const saved = { ...sampleUser, displayName: "Noah Clark" };
    finishSave(saved);
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(mocks.success).toHaveBeenCalledWith("Changes saved.");
  });

  it("does not submit when client-side validation fails and binds 400 errors to the right field", async () => {
    const user = userEvent.setup();
    render(<ProfileDetailsCard profile={sampleUser} />);
    const nameInput = screen.getByLabelText("Display name");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(
      await screen.findByText("Please enter a display name."),
    ).toBeInTheDocument();
    expect(mocks.updateProfile).not.toHaveBeenCalled();

    await user.type(nameInput, "Linh B");
    mocks.updateProfile.mockRejectedValueOnce(
      new ApiError(400, "Invalid", { displayName: "Invalid name." }),
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Invalid name.")).toBeInTheDocument();
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
  });

  it("displays read-only email, phone number, and date of birth", () => {
    render(<ProfileDetailsCard profile={sampleUser} />);
    expect(screen.getByLabelText("Date of birth")).toHaveValue("1998-05-12");
    expect(screen.getByLabelText("Phone number")).toHaveValue("0912345678");
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.getByText(/Verified/)).toBeInTheDocument();
  });

  it("rejects invalid images and previews then uploads a valid image once", async () => {
    const { container } = render(<ProfileDetailsCard profile={sampleUser} />);
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "bad.gif", { type: "image/gif" })] },
    });
    expect(
      await screen.findByText("Only JPG or PNG images are supported."),
    ).toBeInTheDocument();
    expect(mocks.uploadAvatar).not.toHaveBeenCalled();

    let finishUpload!: (profile: UserProfile) => void;
    mocks.uploadAvatar.mockReturnValueOnce(
      new Promise((resolve) => {
        finishUpload = resolve;
      }),
    );
    fireEvent.change(input, {
      target: { files: [new File(["image"], "ok.png", { type: "image/png" })] },
    });
    expect(mocks.uploadAvatar).toHaveBeenCalledTimes(1);
    expect(mocks.uploadAvatar).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ok.png" }),
    );
    expect(
      screen.getByRole("img", { name: "Avatar of Noah Adams" }),
    ).toHaveAttribute("src", "blob:avatar-preview");
    finishUpload({ ...sampleUser, avatarVersion: "v2" });
  });
});
