import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { createScoreProfile } from "../exam-api";
import { CreateScoreProfileButton } from "./create-score-profile-button";

vi.mock("../exam-api", () => ({ createScoreProfile: vi.fn() }));

it("creates a profile with the entered mapping without inventing missing scores", async () => {
  const profile = {
    id: "profile",
    name: "Custom",
    isComplete: false,
    mappingCount: 2,
  };
  vi.mocked(createScoreProfile).mockResolvedValue(profile);
  const onCreated = vi.fn();
  render(<CreateScoreProfileButton onCreated={onCreated} />);
  fireEvent.click(screen.getByRole("button", { name: "Create score profile" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Profile name" }), {
    target: { value: "Custom" },
  });
  fireEvent.change(screen.getByLabelText("Listening 0 correct"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("Reading 100 correct"), {
    target: { value: "495" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() => expect(onCreated).toHaveBeenCalledWith(profile));
  expect(createScoreProfile).toHaveBeenCalledWith({
    name: "Custom",
    conversions: [
      { skill: "Listening", rawCorrectCount: 0, scaledScore: 5 },
      { skill: "Reading", rawCorrectCount: 100, scaledScore: 495 },
    ],
  });
});
