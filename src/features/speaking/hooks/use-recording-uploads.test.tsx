// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadSpeakingRecording } from "@/features/speaking/api";
import { parseAttempt } from "@/features/speaking/attempt";
import { attemptDto, ids } from "@/features/speaking/testing/fixtures";
import { useRecordingUploads } from "./use-recording-uploads";

vi.mock("@/features/speaking/api", () => ({
  uploadSpeakingRecording: vi.fn(),
}));
afterEach(() => vi.mocked(uploadSpeakingRecording).mockReset());

const recording = {
  blob: new Blob(["a"], { type: "audio/webm" }),
  url: "blob:1",
  durationSeconds: 12,
};

describe("useRecordingUploads", () => {
  it("uploads each recording once and retries a failed upload", async () => {
    vi.mocked(uploadSpeakingRecording)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(parseAttempt(attemptDto()));
    const onAttempt = vi.fn();
    const { result, rerender } = renderHook(
      ({ recordings }) =>
        useRecordingUploads(ids.attempt, recordings, onAttempt),
      { initialProps: { recordings: { 2: recording } } },
    );

    await waitFor(() => expect(result.current.states[2]).toBe("failed"));
    rerender({ recordings: { 2: recording } });
    expect(uploadSpeakingRecording).toHaveBeenCalledOnce();

    act(() => result.current.retry(2));
    await waitFor(() => expect(result.current.states[2]).toBe("uploaded"));
    expect(uploadSpeakingRecording).toHaveBeenLastCalledWith(
      ids.attempt,
      2,
      recording.blob,
      12,
    );
    expect(onAttempt).toHaveBeenCalledOnce();
  });
});
