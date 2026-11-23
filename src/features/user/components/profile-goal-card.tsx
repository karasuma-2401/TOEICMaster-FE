"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, updateProfile } from "@/features/user/api";
import { type UserProfile, toUpdateRequest } from "@/features/user/profile";
import { toast } from "@/shared/ui/toast";
import {
  profileCard,
  profileInput,
  profileLabel,
  profilePrimaryButton,
} from "./profile-styles";

const MAX_SCORE = 990;
const presetScores = [450, 550, 650, 750, 850, 900, 950];

function TargetGauge({ score }: { score: number | null }) {
  const filled = score === null ? 0 : (score / MAX_SCORE) * 100;
  const arc = "M 16 110 A 94 94 0 0 1 204 110";
  return (
    <div className="relative mx-auto mt-6 w-full max-w-[260px]">
      <svg aria-hidden="true" className="w-full" viewBox="0 0 220 118">
        <path d={arc} fill="none" stroke="#efece8" strokeWidth="14" />
        <path
          d={arc}
          fill="none"
          pathLength={100}
          stroke="#df5a28"
          strokeDasharray={`${filled} 100`}
          strokeWidth="14"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-[32px] font-bold leading-none text-[#df5a28]">
          {score ?? "-"} / {MAX_SCORE}
        </p>
        <p className="mt-1.5 text-sm text-[#6b655f]">target score</p>
      </div>
    </div>
  );
}

export function ProfileGoalCard({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved?: (profile: UserProfile) => void;
}) {
  const id = useId();
  const saved = profile.targetScore === null ? "" : String(profile.targetScore);
  const [value, setValue] = useState(saved);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string>();
  const router = useRouter();
  const score = value === "" ? null : Number(value);
  // A score set before the presets existed stays selectable.
  const scores =
    profile.targetScore === null || presetScores.includes(profile.targetScore)
      ? presetScores
      : [...presetScores, profile.targetScore].sort((a, b) => a - b);

  async function save() {
    setPending(true);
    setNotice(undefined);
    try {
      const updated = await updateProfile(
        toUpdateRequest({ ...profile, targetScore: value }),
      );
      onSaved?.(updated);
      toast.success("Target score saved.");
      window.dispatchEvent(
        new CustomEvent("profile:updated", { detail: updated }),
      );
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 429) {
        setNotice(
          `Too many attempts. Please try again in ${reason.retryAfter ?? 0} seconds.`,
        );
      } else if (reason instanceof ApiError && reason.status === 401) {
        router.replace("/login?next=%2Fprofile");
      } else {
        toast.error("Unable to save target score. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={profileCard}>
      <h3 className="text-xl font-semibold text-[#3d3935]">Score Goal</h3>
      <label className={`mt-5 ${profileLabel}`} htmlFor={`${id}-targetScore`}>
        Target score
      </label>
      <select
        className={`${profileInput} cursor-pointer`}
        id={`${id}-targetScore`}
        onChange={(event) => setValue(event.target.value)}
        value={value}
      >
        <option value="">No goal set</option>
        {scores.map((item) => (
          <option key={item} value={item}>
            {item}+
          </option>
        ))}
      </select>

      <TargetGauge score={score} />

      <p className="mt-6 text-[15px] leading-6 text-[#4a4541]">
        {score === null
          ? "Choose a target score to personalize your practice journey."
          : `You are aiming for ${score}/${MAX_SCORE} points. Keep practicing every day to reach ${score} soon!`}
      </p>

      <button
        className={`mt-5 ${profilePrimaryButton}`}
        disabled={value === saved || pending}
        onClick={() => void save()}
        type="button"
      >
        {pending ? "Saving..." : "Save goal"}
      </button>

      {notice && (
        <output className="mt-4 block rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
          {notice}
        </output>
      )}
    </section>
  );
}
