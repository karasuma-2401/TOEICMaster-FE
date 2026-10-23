import type { SpeakingPhase } from "@/features/speaking/attempt";
import type { PhaseTone } from "@/shared/components/practice/phase-timer";

export const phaseCopy: Record<
  SpeakingPhase,
  { label: string; tone: PhaseTone; hint: string; skipLabel: string }
> = {
  READING: {
    label: "Đọc thông tin",
    tone: "prepare",
    hint: "Đọc kỹ bảng thông tin. Câu hỏi sẽ xuất hiện khi hết thời gian đọc.",
    skipLabel: "Đã đọc xong",
  },
  PREPARING: {
    label: "Chuẩn bị",
    tone: "prepare",
    hint: "Chuẩn bị ý. Micro tự bật khi hết thời gian chuẩn bị.",
    skipLabel: "Bắt đầu nói ngay",
  },
  RESPONDING: {
    label: "Đang ghi âm",
    tone: "recording",
    hint: "Trả lời to, rõ ràng. Câu sẽ khóa khi hết giờ.",
    skipLabel: "Hoàn tất câu trả lời",
  },
};
