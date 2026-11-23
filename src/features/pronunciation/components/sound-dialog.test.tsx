// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { findSound } from "../ipa-sounds";
import { SoundDialog } from "./sound-dialog";

vi.mock("./practice-recorder", () => ({
  PracticeRecorder: ({ example }: { example: { word: string } }) => (
    <p>Practice word {example.word}</p>
  ),
}));

function renderDialog(
  overrides: Partial<Parameters<typeof SoundDialog>[0]> = {},
) {
  const props = {
    sound: findSound("th-voiceless")!,
    wordIndex: 0,
    onWordChange: vi.fn(),
    onSelectSound: vi.fn(),
    onClose: vi.fn(),
    onAssessed: vi.fn(),
    ...overrides,
  };
  render(<SoundDialog {...props} />);
  return props;
}

describe("SoundDialog", () => {
  it("shows how to say the sound, the example words and the practice area", () => {
    const { sound } = renderDialog();
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toHaveAttribute("open");
    // jsdom lacks showModal, so check the labelling wiring directly.
    const heading = document.getElementById(
      dialog.getAttribute("aria-labelledby") ?? "",
    );
    expect(heading).toHaveTextContent("Sound /θ/");
    expect(
      within(dialog).getByText(/Consonants · voiceless/),
    ).toBeInTheDocument();
    for (const step of sound.articulation)
      expect(within(dialog).getByText(step)).toBeInTheDocument();
    expect(
      within(dialog).getByText(`Common mistake: ${sound.commonMistake}`),
    ).toBeInTheDocument();
    for (const word of ["think", "three", "month"])
      expect(
        within(dialog).getByRole("button", { name: `Practice word ${word}` }),
      ).toBeInTheDocument();
    expect(within(dialog).getByText("Practice word think")).toBeInTheDocument();
    expect(
      within(dialog).getAllByRole("button", {
        name: "Listen to sample /θ/",
      }),
    ).not.toHaveLength(0);
  });

  it("practises the chosen example word", () => {
    renderDialog({ wordIndex: 2 });
    expect(screen.getByText("Practice word month")).toBeInTheDocument();
  });

  it("switches words, jumps to the partner and to neighbours", async () => {
    const props = renderDialog();
    await userEvent.click(
      screen.getByRole("button", { name: "Practice word month" }),
    );
    expect(props.onWordChange).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByRole("button", { name: "/ð/" }));
    expect(props.onSelectSound).toHaveBeenLastCalledWith("th-voiced");
    await userEvent.click(screen.getByRole("button", { name: "Next: /ð/" }));
    expect(props.onSelectSound).toHaveBeenLastCalledWith("th-voiced");
    await userEvent.click(
      screen.getByRole("button", { name: "Previous: /v/" }),
    );
    expect(props.onSelectSound).toHaveBeenLastCalledWith("v");
  });

  it("closes with the close button", async () => {
    const props = renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("links to the audio credits", () => {
    renderDialog();
    expect(screen.getByRole("link", { name: "Audio credits" })).toHaveAttribute(
      "href",
      "/audio/ipa/CREDITS.md",
    );
  });
});
