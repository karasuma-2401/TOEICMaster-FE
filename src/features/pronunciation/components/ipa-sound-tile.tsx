import { focusRing } from "@/shared/components/practice/styles";
import type { IpaSound } from "../ipa-sounds";

export function IpaSoundTile({
  sound,
  practiced,
  onSelect,
}: {
  sound: IpaSound;
  practiced: boolean;
  onSelect: (slug: string) => void;
}) {
  const example = sound.examples[0].word;
  return (
    <button
      aria-haspopup="dialog"
      aria-label={`Sound /${sound.symbol}/, example ${example}${practiced ? ", practiced" : ""}`}
      className={`relative flex min-h-20 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-(--sp-line)/70 bg-white px-2 py-3 text-center transition hover:border-(--sp-hero-line) hover:shadow-(--sp-shadow-card) ${focusRing}`}
      onClick={() => onSelect(sound.slug)}
      type="button"
    >
      <span className="text-2xl leading-none">{sound.symbol}</span>
      <span className="text-[13px] text-(--sp-ink-2)">{example}</span>
      {practiced && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-1.5 text-xs text-(--sp-success)"
        >
          ✓
        </span>
      )}
    </button>
  );
}
