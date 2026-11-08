import type { ReadAloudContent } from "@/features/speaking/types";

export function ReadAloudPrompt({
  content,
  recording = false,
}: {
  content: ReadAloudContent;
  recording?: boolean;
}) {
  return (
    <article>
      <p className="sp-overline text-(--sp-brand)">ĐỌC THÀNH TIẾNG</p>
      <p className="mt-3 text-sm text-(--sp-ink-2)" lang="en">
        Read the text below aloud.
        {recording && " Your response is being recorded."}
      </p>
      <p
        className="my-5 border-y border-(--sp-line) py-6 text-[22px] leading-[1.9]"
        lang="en"
      >
        {content.passage}
      </p>
      <p className="text-[13px] text-(--sp-ink-2)">
        Đọc rõ ràng với tốc độ tự nhiên. Tiếp tục đọc cho đến khi hoàn thành
        đoạn văn.
      </p>
    </article>
  );
}
