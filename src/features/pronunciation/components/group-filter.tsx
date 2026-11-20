import { focusRing } from "@/shared/components/practice/styles";
import { groupLabels, groupOrder, type IpaGroup } from "../ipa-sounds";
import { pill, pillActive, pillIdle } from "./tones";

export type GroupFilterValue = IpaGroup | "all";

export function GroupFilter({
  value,
  onChange,
}: {
  value: GroupFilterValue;
  onChange: (value: GroupFilterValue) => void;
}) {
  const options: { id: GroupFilterValue; label: string }[] = [
    { id: "all", label: "Tất cả" },
    ...groupOrder.map((id) => ({ id, label: groupLabels[id] })),
  ];
  return (
    <fieldset className="flex min-w-0 flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">Lọc theo nhóm âm</legend>
      {options.map((option) => (
        <button
          aria-pressed={option.id === value}
          className={`${pill} ${focusRing} ${option.id === value ? pillActive : pillIdle}`}
          key={option.id}
          onClick={() => onChange(option.id)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
