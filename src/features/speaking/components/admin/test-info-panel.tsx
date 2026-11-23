import {
  adminInput,
  adminTextarea,
} from "@/features/admin/components/content/admin-styles";
import { AdminPanel } from "@/features/admin/components/content/admin-workspace";
import { partDurationSeconds } from "@/features/speaking/part-specs";
import { speakingParts, type SpeakingTest } from "@/features/speaking/types";
import { formatMinutes } from "@/shared/ui/format-time";

type TestInfo = Pick<SpeakingTest, "code" | "title" | "description">;

export function TestInfoPanel({
  value,
  disabled,
  onChange,
}: {
  value: TestInfo;
  disabled: boolean;
  onChange: (next: Partial<TestInfo>) => void;
}) {
  const totalSeconds = speakingParts.reduce(
    (total, part) => total + partDurationSeconds(part),
    0,
  );
  return (
    <AdminPanel
      description={`Standard TOEIC Speaking · 11 questions · about ${formatMinutes(totalSeconds)}`}
      title="Test info"
    >
      <fieldset className="space-y-4" disabled={disabled}>
        <label className="block text-sm font-semibold">
          Test code *
          <input
            className={adminInput}
            onChange={(event) => onChange({ code: event.target.value })}
            value={value.code}
          />
        </label>
        <label className="block text-sm font-semibold">
          Test title *
          <input
            className={adminInput}
            onChange={(event) => onChange({ title: event.target.value })}
            value={value.title}
          />
        </label>
        <label className="block text-sm font-semibold">
          Description
          <textarea
            className={adminTextarea}
            onChange={(event) => onChange({ description: event.target.value })}
            value={value.description}
          />
        </label>
      </fieldset>
    </AdminPanel>
  );
}
