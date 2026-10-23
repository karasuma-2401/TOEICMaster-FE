import type { MicrophoneStatus } from "@/features/speaking/hooks/use-voice-recorder";

const bars = [0.35, 0.6, 0.85, 1, 0.85, 0.6, 0.35];

/** Live microphone meter shown under the prompt during an attempt. */
export function RecorderStatus({
  micStatus,
  recording,
  level,
}: {
  micStatus: MicrophoneStatus;
  recording: boolean;
  level: number;
}) {
  const message =
    micStatus !== "ready"
      ? "Không ghi âm · đang luyện theo thời gian"
      : recording
        ? "Đang ghi âm câu trả lời…"
        : "Micro sẵn sàng · sẽ bật khi đến pha trả lời";
  return (
    <div
      aria-live="polite"
      className={`flex items-center gap-4 rounded-2xl px-4 py-3 ring-1 ${recording ? "bg-rose-50 ring-rose-200" : "bg-slate-50 ring-slate-200"}`}
    >
      <span
        aria-hidden="true"
        className={`grid size-10 shrink-0 place-items-center rounded-full text-white ${recording ? "bg-rose-500 shadow-[0_0_0_6px_rgb(244_63_94/0.15)]" : "bg-slate-300"}`}
      >
        <span
          className={`size-3 rounded-full bg-white ${recording ? "animate-pulse" : ""}`}
        />
      </span>
      <p
        className={`flex-1 text-sm font-semibold ${recording ? "text-rose-800" : "text-slate-600"}`}
      >
        {message}
      </p>
      <span aria-hidden="true" className="flex h-8 items-center gap-1">
        {bars.map((weight, index) => (
          <span
            className={`w-1 rounded-full transition-[height] duration-100 ${recording ? "bg-rose-400" : "bg-slate-300"}`}
            key={index}
            style={{
              height: `${Math.max(12, (recording ? level : 0) * weight * 100)}%`,
            }}
          />
        ))}
      </span>
    </div>
  );
}
