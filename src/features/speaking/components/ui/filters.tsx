import { SearchIcon } from "./icons";

/** Search box with a leading icon, shared by the Speaking list toolbars. */
export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative min-w-60 flex-1">
      <SearchIcon
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--sp-ink-3)"
        size={18}
      />
      <input
        aria-label={label}
        className="sp-input min-h-11! rounded-full! pl-10!"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  );
}

/** Mutually exclusive filter shown as pills, so every option stays visible. */
export function FilterPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="inline-flex rounded-full border border-(--sp-line) bg-(--sp-subtle) p-1">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            aria-pressed={active}
            className={`sp-focus cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] transition ${active ? "bg-(--sp-surface) font-semibold text-(--sp-brand) shadow-(--sp-shadow-card)" : "text-(--sp-ink-2) hover:text-(--sp-ink)"}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
