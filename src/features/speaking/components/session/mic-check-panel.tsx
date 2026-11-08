import type { MicrophoneStatus } from "@/features/speaking/hooks/use-voice-recorder";
import {
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import { formatMinutes } from "@/shared/ui/format-time";

const statusCopy: Record<
  MicrophoneStatus,
  { title: string; detail: string; tone: string }
> = {
  idle: {
    title: "Chưa kiểm tra micro",
    detail: "Cho phép truy cập micro để hệ thống ghi âm câu trả lời của bạn.",
    tone: "bg-slate-50 text-slate-700 ring-slate-200",
  },
  requesting: {
    title: "Đang chờ quyền micro…",
    detail: "Chọn “Cho phép” trong hộp thoại của trình duyệt.",
    tone: "bg-sky-50 text-sky-900 ring-sky-200",
  },
  ready: {
    title: "Micro đã sẵn sàng",
    detail: "Câu trả lời sẽ được ghi âm tự động trong mỗi pha trả lời.",
    tone: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  },
  denied: {
    title: "Không có quyền micro",
    detail:
      "Bạn vẫn có thể luyện theo thời gian nhưng sẽ không có bản ghi để nghe lại. Cấp quyền trong cài đặt trình duyệt rồi thử lại.",
    tone: "bg-amber-50 text-amber-900 ring-amber-200",
  },
  unsupported: {
    title: "Trình duyệt không hỗ trợ ghi âm",
    detail: "Bạn vẫn có thể luyện theo thời gian mà không có bản ghi.",
    tone: "bg-amber-50 text-amber-900 ring-amber-200",
  },
};

export function MicCheckPanel({
  status,
  questionCount,
  totalSeconds,
  onRequestAccess,
  onStart,
  starting = false,
}: {
  status: MicrophoneStatus;
  questionCount: number;
  totalSeconds: number;
  onRequestAccess: () => void;
  onStart: () => void;
  starting?: boolean;
}) {
  const copy = statusCopy[status];
  const canStart =
    status === "ready" || status === "denied" || status === "unsupported";
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Kiểm tra trước khi bắt đầu</h2>
        <p className="mt-1 text-sm text-slate-500">
          {questionCount} câu · khoảng {formatMinutes(totalSeconds)}. Hãy ngồi ở
          nơi yên tĩnh và đeo tai nghe nếu có.
        </p>
      </div>
      <div
        aria-live="polite"
        className={`flex gap-4 rounded-2xl p-5 ring-1 ${copy.tone}`}
      >
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-xl shadow-sm"
        >
          🎙
        </span>
        <div>
          <p className="font-bold">{copy.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{copy.detail}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
        {status !== "ready" && status !== "unsupported" && (
          <button
            className={secondaryAction}
            disabled={status === "requesting"}
            onClick={onRequestAccess}
            type="button"
          >
            {status === "denied" ? "Thử cấp quyền lại" : "Cho phép micro"}
          </button>
        )}
        <button
          className={primaryAction}
          disabled={!canStart || starting}
          onClick={onStart}
          type="button"
        >
          {starting ? "Đang tạo lượt làm…" : "Bắt đầu làm bài"}
        </button>
      </div>
    </div>
  );
}
