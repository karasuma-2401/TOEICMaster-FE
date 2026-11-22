// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { findSound } from "../ipa-sounds";
import { SoundDialog } from "./sound-dialog";

vi.mock("./practice-recorder", () => ({
  PracticeRecorder: ({ example }: { example: { word: string } }) => (
    <p>Luyện từ {example.word}</p>
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
    expect(heading).toHaveTextContent("Âm /θ/");
    expect(within(dialog).getByText(/Phụ âm · vô thanh/)).toBeInTheDocument();
    for (const step of sound.articulation)
      expect(within(dialog).getByText(step)).toBeInTheDocument();
    expect(
      within(dialog).getByText(`Lỗi thường gặp: ${sound.commonMistake}`),
    ).toBeInTheDocument();
    for (const word of ["think", "three", "month"])
      expect(
        within(dialog).getByRole("button", { name: `Luyện từ ${word}` }),
      ).toBeInTheDocument();
    expect(within(dialog).getByText("Luyện từ think")).toBeInTheDocument();
    expect(
      within(dialog).getAllByRole("button", { name: "Nghe âm mẫu /θ/" }),
    ).not.toHaveLength(0);
  });

  it("practises the chosen example word", () => {
    renderDialog({ wordIndex: 2 });
    expect(screen.getByText("Luyện từ month")).toBeInTheDocument();
  });

  it("switches words, jumps to the partner and to neighbours", async () => {
    const props = renderDialog();
    await userEvent.click(
      screen.getByRole("button", { name: "Luyện từ month" }),
    );
    expect(props.onWordChange).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByRole("button", { name: "/ð/" }));
    expect(props.onSelectSound).toHaveBeenLastCalledWith("th-voiced");
    await userEvent.click(screen.getByRole("button", { name: "Âm sau: /ð/" }));
    expect(props.onSelectSound).toHaveBeenLastCalledWith("th-voiced");
    await userEvent.click(
      screen.getByRole("button", { name: "Âm trước: /v/" }),
    );
    expect(props.onSelectSound).toHaveBeenLastCalledWith("v");
  });

  it("closes with the close button", async () => {
    const props = renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("links to the audio credits", () => {
    renderDialog();
    expect(screen.getByRole("link", { name: "Nguồn audio" })).toHaveAttribute(
      "href",
      "/audio/ipa/CREDITS.md",
    );
  });
});
