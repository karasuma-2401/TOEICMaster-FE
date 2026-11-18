// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LrListeningPlaylistApi } from "../api";
import { loadRoomState } from "../loaders";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { LrExamRoom } from "./lr-exam-room";

beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
    Promise.resolve(),
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(() => "blob:room-audio"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(new Blob(["mp3"]), { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const samplePlaylist: LrListeningPlaylistApi = {
  items: [
    {
      blockId: "block-1",
      part: 1,
      firstQuestionNumber: 1,
      audioAssetId: "asset-1",
      durationMs: 15_000,
      url: "https://minio.example.test/p1-q1.mp3",
      expiresAtUtc: "2026-11-19T12:00:00Z",
    },
    {
      blockId: "block-2",
      part: 3,
      firstQuestionNumber: 32,
      audioAssetId: "asset-2",
      durationMs: 20_000,
      url: "https://minio.example.test/p3-q32.mp3",
      expiresAtUtc: "2026-11-19T12:00:00Z",
    },
  ],
};

describe("LrExamRoom", () => {
  it("lets the learner answer and opens submit confirmation", () => {
    render(<LrExamRoom {...loadRoomState("x")} resultHref="/result" />);
    fireEvent.click(screen.getAllByRole("radio", { name: /D\./ })[0]);
    expect(
      screen.getAllByRole("radio", { checked: true }).length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài thi" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Xác nhận nộp bài L&R" }),
    );
    expect(push).toHaveBeenCalledWith("/result");
  });

  it("renders the reading phase with a locked listening palette", () => {
    render(<LrExamRoom {...loadRoomState("x", 147)} resultHref="/result" />);
    expect(screen.getByText("QUESTION 147")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Câu 1(,|$)/ })).toBeDisabled();
  });

  it("renders a single ListeningMasterPlayer without per-block audio elements or seekbars", async () => {
    const state = loadRoomState("x");
    const { container } = render(
      <LrExamRoom
        {...state}
        attemptId="attempt-room-1"
        phase="listening"
        playlist={samplePlaylist}
        resultHref="/result"
      />,
    );

    const player = screen.getByTestId("lr-master-audio-player");
    expect(player).toHaveAttribute("role", "region");
    expect(
      screen.getByRole("region", { name: "Trình phát audio phần Listening" }),
    ).toBeInTheDocument();

    // Zero per-block <audio> elements: at most 1 unified <audio> element in DOM.
    expect(container.querySelectorAll("audio").length).toBeLessThanOrEqual(1);
    expect(player.querySelector('input[type="range"]')).toBeNull();

    expect(player).toHaveTextContent(/Part 1\s*·\s*Câu 1/);
    expect(screen.getByTestId("lr-master-audio-time")).toHaveTextContent(
      /00:00\s*\/\s*00:35/,
    );

    const toggle = screen.getByTestId("lr-master-audio-toggle");
    expect(toggle).toHaveAccessibleName("Bắt đầu phát Listening");
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(screen.getByTestId("lr-master-audio-toggle")).toHaveAccessibleName(
        "Tạm dừng audio",
      ),
    );
  });

  it("does not render ListeningMasterPlayer during the reading phase", () => {
    render(
      <LrExamRoom
        {...loadRoomState("x", 147)}
        attemptId="attempt-room-2"
        phase="reading"
        playlist={samplePlaylist}
        resultHref="/result"
      />,
    );

    expect(
      screen.queryByTestId("lr-master-audio-player"),
    ).not.toBeInTheDocument();
  });
});
