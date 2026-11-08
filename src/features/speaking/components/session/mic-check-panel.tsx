"use client";

import { useEffect, useState } from "react";
import type { MicrophoneStatus } from "@/features/speaking/hooks/use-voice-recorder";
import { CheckCircleIcon, MicIcon, MicOffIcon } from "../ui/icons";
import { Waveform } from "../ui/primitives";

/** Peak level that proves the microphone actually picks up a voice. */
const levelThreshold = 0.15;

/** The only step before an attempt: allow the microphone and say a few words. */
export function MicCheckPanel({
  status,
  level = 0,
  deviceLabel = "",
  onRequestAccess,
  onStart,
  starting = false,
  requireDevices = true,
}: {
  status: MicrophoneStatus;
  level?: number;
  deviceLabel?: string;
  onRequestAccess: () => void;
  onStart: () => void;
  starting?: boolean;
  /** Mock tests need a working microphone; Part practice may run on timers. */
  requireDevices?: boolean;
}) {
  const [heard, setHeard] = useState(false);
  useEffect(() => {
    if (status !== "ready" || level < levelThreshold) return;
    const task = window.setTimeout(() => setHeard(true), 0);
    return () => window.clearTimeout(task);
  }, [level, status]);

  const granted = status === "ready";
  const blocked = status === "denied" || status === "unsupported";
  const passed = granted && heard;
  const canStart = requireDevices ? passed : granted || blocked;

  const title = passed
    ? "Micro hoạt động tốt"
    : granted
      ? "Hãy đọc thử: “Testing 1 2 3”"
      : status === "denied"
        ? "Micro đang bị chặn"
        : status === "unsupported"
          ? "Trình duyệt không hỗ trợ ghi âm"
          : "Đang chờ quyền micro…";

  return (
    <section className="sp-card mx-auto max-w-[640px] p-8 text-center">
      <span
        className={`mx-auto grid size-16 place-items-center rounded-full ${passed ? "bg-(--sp-success-bg) text-(--sp-success)" : blocked ? "bg-(--sp-danger-bg) text-(--sp-danger)" : "bg-(--sp-orange-soft) text-(--sp-brand)"}`}
      >
        {passed ? (
          <CheckCircleIcon size={32} />
        ) : blocked ? (
          <MicOffIcon size={32} />
        ) : (
          <MicIcon size={32} />
        )}
      </span>
      <h2 aria-live="polite" className="mt-4 text-2xl font-semibold">
        {title}
      </h2>
      {deviceLabel && (
        <p className="mt-1 text-[13px] text-(--sp-ink-2)">{deviceLabel}</p>
      )}

      {status === "denied" ? (
        <p className="mx-auto mt-3 max-w-md text-sm text-(--sp-ink-2)">
          Bấm biểu tượng ổ khóa cạnh thanh URL, chọn Microphone → Cho phép, rồi
          thử lại.
        </p>
      ) : (
        !blocked && (
          <div className="mt-5 flex justify-center">
            <Waveform
              bars={36}
              className={
                passed ? "text-(--sp-success-line)" : "text-(--sp-brand)"
              }
              level={granted ? Math.max(level, 0.12) : 0.12}
            />
          </div>
        )
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        {!granted && status !== "unsupported" && (
          <button
            className="sp-btn sp-btn-outline"
            disabled={status === "requesting"}
            onClick={onRequestAccess}
            type="button"
          >
            {status === "denied" ? "Thử cấp quyền lại" : "Cho phép micro"}
          </button>
        )}
        <button
          className="sp-btn sp-btn-cta sp-btn-locked sp-btn-lg w-full max-w-xs"
          disabled={!canStart || starting}
          onClick={onStart}
          type="button"
        >
          {starting ? "Đang tạo lượt làm…" : "Bắt đầu làm bài →"}
        </button>
        <p className="text-xs text-(--sp-ink-3)">
          Âm thanh chỉ được thu trong pha trả lời của từng câu.
        </p>
      </div>
    </section>
  );
}
