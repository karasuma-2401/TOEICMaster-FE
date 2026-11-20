import {
  flatPhonemes,
  heardDifferentWord,
  scoreBand,
  scoreBandLabels,
  scoreTargetPhoneme,
  type PronunciationAssessment,
} from "../assessment";
import type { IpaSound } from "../ipa-sounds";
import { bandText, card } from "./tones";

export function AssessmentResult({
  assessment,
  sound,
}: {
  assessment: PronunciationAssessment;
  sound: IpaSound;
}) {
  if (assessment.recognitionStatus === "NoSpeech") {
    return (
      <p className="rounded-xl bg-(--sp-subtle) px-3 py-2.5 text-sm text-(--sp-ink-2)">
        Không nhận ra giọng nói. Hãy nói to, rõ hơn và đặt micro gần miệng.
      </p>
    );
  }

  const target = scoreTargetPhoneme(assessment, sound);
  const phonemes = flatPhonemes(assessment);
  const percent = target?.score ?? Math.round(assessment.accuracyScore);
  const band = scoreBand(percent);
  const heardOther = heardDifferentWord(assessment);
  const tip = target?.heardInstead
    ? (sound.confusions?.[target.heardInstead] ?? sound.commonMistake)
    : null;

  return (
    <div className={`${card} px-[18px] py-4`}>
      <p className="text-xs uppercase text-(--sp-ink-2)">
        {target ? `Phát âm chuẩn /${sound.symbol}/` : "Phát âm chuẩn cả từ"}
      </p>
      <p className="mt-1 flex items-baseline gap-3">
        <span className="text-[36px] font-bold leading-[44px] text-[#f4511e]">
          {percent}%
        </span>
        <span className={`text-[13px] ${bandText[band]}`}>
          {scoreBandLabels[band]}
        </span>
      </p>
      <p className="mt-1 text-[13px] text-(--sp-ink-2)">
        Độ chính xác cả từ {Math.round(assessment.accuracyScore)}% · Điểm phát
        âm {Math.round(assessment.pronunciationScore)}%
        {!target && " · Không tách được điểm riêng cho âm này"}
      </p>

      {phonemes.length > 0 && (
        <ul aria-label="Điểm từng âm" className="mt-3 flex flex-wrap gap-1.5">
          {phonemes.map((item, index) => {
            const isTarget = target?.indexes.includes(index) ?? false;
            const score = Math.round(item.accuracyScore);
            const label = `${item.phoneme}: ${score} điểm`;
            return (
              <li
                aria-label={isTarget ? `${label}, âm đang luyện` : label}
                className={`rounded-md border px-2 py-1 text-[13px] ${
                  isTarget
                    ? "border-(--sp-hero-line) bg-(--sp-orange-soft)"
                    : "border-(--sp-line)/70"
                }`}
                key={`${item.phoneme}-${index}`}
                title={label}
              >
                {item.phoneme}{" "}
                <span className={bandText[scoreBand(score)]}>{score}</span>
              </li>
            );
          })}
        </ul>
      )}

      {(target?.heardInstead || heardOther) && (
        <div className="mt-3 text-[13px] leading-5 text-(--sp-ink-2)">
          {target?.heardInstead && (
            <p>
              Hệ thống nghe giống /{target.heardInstead}/ hơn /{sound.symbol}/.
            </p>
          )}
          {heardOther && (
            <p>Hệ thống nghe thành “{assessment.recognizedText}”.</p>
          )}
          {tip && <p>{tip}</p>}
        </div>
      )}
    </div>
  );
}
