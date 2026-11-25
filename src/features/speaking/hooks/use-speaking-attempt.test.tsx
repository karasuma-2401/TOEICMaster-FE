// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpeakingAttempt } from "@/features/speaking/api";
import { parseAttempt } from "@/features/speaking/attempt";
import { attemptDto, ids } from "@/features/speaking/testing/fixtures";
import { useSpeakingAttempt } from "./use-speaking-attempt";

vi.mock("@/features/speaking/api", () => ({
  getSpeakingAttempt: vi.fn(),
  nextSpeakingPhase: vi.fn(),
}));
afterEach(() => vi.mocked(getSpeakingAttempt).mockReset());

const otherAttemptId = "11111111-1111-4111-8111-111111111111";

function pending() {
  return new Promise<ReturnType<typeof parseAttempt>>(() => undefined);
}

describe("useSpeakingAttempt", () => {
  it("passes an AbortSignal and aborts it when the attempt id changes", async () => {
    vi.mocked(getSpeakingAttempt)
      .mockReturnValueOnce(pending())
      .mockResolvedValueOnce(parseAttempt(attemptDto({ id: otherAttemptId })));

    const { result, rerender } = renderHook(
      ({ id }) => useSpeakingAttempt(id),
      { initialProps: { id: ids.attempt } },
    );
    await waitFor(() => expect(getSpeakingAttempt).toHaveBeenCalledTimes(1));
    const firstSignal = vi.mocked(getSpeakingAttempt).mock.calls[0][1];
    expect(firstSignal).toBeInstanceOf(AbortSignal);
    expect(firstSignal?.aborted).toBe(false);

    rerender({ id: otherAttemptId });

    expect(firstSignal?.aborted).toBe(true);
    await waitFor(() =>
      expect(result.current.attempt?.id).toBe(otherAttemptId),
    );
    expect(vi.mocked(getSpeakingAttempt).mock.calls[1][0]).toBe(otherAttemptId);
    expect(result.current.error).toBeNull();
  });

  it("aborts the in-flight refresh on unmount", async () => {
    vi.mocked(getSpeakingAttempt).mockReturnValueOnce(pending());

    const { unmount } = renderHook(() => useSpeakingAttempt(ids.attempt));
    await waitFor(() => expect(getSpeakingAttempt).toHaveBeenCalledTimes(1));
    const signal = vi.mocked(getSpeakingAttempt).mock.calls[0][1];

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("ignores a late response from the previous attempt", async () => {
    let resolveFirst: (value: ReturnType<typeof parseAttempt>) => void = () =>
      undefined;
    vi.mocked(getSpeakingAttempt)
      .mockReturnValueOnce(
        new Promise((done) => {
          resolveFirst = done;
        }),
      )
      .mockResolvedValueOnce(parseAttempt(attemptDto({ id: otherAttemptId })));

    const { result, rerender } = renderHook(
      ({ id }) => useSpeakingAttempt(id),
      { initialProps: { id: ids.attempt } },
    );
    await waitFor(() => expect(getSpeakingAttempt).toHaveBeenCalledTimes(1));
    rerender({ id: otherAttemptId });
    await waitFor(() =>
      expect(result.current.attempt?.id).toBe(otherAttemptId),
    );

    resolveFirst(parseAttempt(attemptDto()));
    await Promise.resolve();

    expect(result.current.attempt?.id).toBe(otherAttemptId);
  });
});
