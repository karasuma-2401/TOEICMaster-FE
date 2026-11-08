import type { SpeakingTest } from "@/features/speaking/types";
import { Chip } from "../ui/primitives";

type TestInfo = Pick<SpeakingTest, "code" | "title" | "description">;

export function TestInfoPanel({
  value,
  disabled,
  published,
  onChange,
}: {
  value: TestInfo;
  disabled: boolean;
  published: boolean;
  onChange: (next: Partial<TestInfo>) => void;
}) {
  return (
    <section className="sp-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Thông tin đề</h3>
        <Chip dot tone={published ? "success" : "neutral"}>
          {published ? "Chính thức" : "Bản nháp"}
        </Chip>
      </div>
      <fieldset className="mt-3 space-y-3" disabled={disabled}>
        <label className="block text-[13px] font-medium">
          Tên đề thi *
          <input
            className="sp-input mt-1"
            onChange={(event) => onChange({ title: event.target.value })}
            value={value.title}
          />
        </label>
        <label className="block text-[13px] font-medium">
          Mã đề *
          <input
            className="sp-input mt-1"
            onChange={(event) => onChange({ code: event.target.value })}
            value={value.code}
          />
        </label>
        <label className="block text-[13px] font-medium">
          Mô tả
          <textarea
            className="sp-input mt-1"
            onChange={(event) => onChange({ description: event.target.value })}
            rows={3}
            value={value.description}
          />
        </label>
      </fieldset>
      <p className="mt-3 text-xs text-(--sp-ink-3)">
        11 câu · 5 Parts · ~20 phút · Thang 200
      </p>
    </section>
  );
}
