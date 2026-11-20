"use client";

import { useId, useSyncExternalStore } from "react";
import {
  defaultPreferences,
  readPreferences,
  reviewAudioRates,
  setMascotHidden,
  setReviewAudioRate,
  subscribePreferences,
  type ReviewAudioRate,
} from "@/features/user/preferences";
import { profileCard, profileInput, profileLabel } from "./profile-styles";

/**
 * Settings section of `/profile`. Only preferences that the app really uses
 * are exposed, so every control has a visible effect.
 */
export function ProfileSettingsCard() {
  const id = useId();
  const preferences = useSyncExternalStore(
    subscribePreferences,
    readPreferences,
    () => defaultPreferences,
  );

  function changeRate(rate: ReviewAudioRate) {
    setReviewAudioRate(rate);
  }

  function changeMascotHidden(hidden: boolean) {
    setMascotHidden(hidden);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={profileCard} aria-labelledby={`${id}-audio`}>
        <h3 className="text-xl font-semibold text-[#3d3935]" id={`${id}-audio`}>
          Tốc độ nghe lại bài L&amp;R
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#6b655f]">
          Áp dụng cho trình phát audio trong phần xem lại bài làm Listening.
        </p>
        <label className={`mt-5 ${profileLabel}`} htmlFor={`${id}-rate`}>
          Tốc độ mặc định
        </label>
        <select
          className={`${profileInput} cursor-pointer`}
          id={`${id}-rate`}
          onChange={(event) =>
            changeRate(event.target.value as ReviewAudioRate)
          }
          value={preferences.reviewAudioRate}
        >
          {reviewAudioRates.map((rate) => (
            <option key={rate} value={rate}>
              {rate}x
            </option>
          ))}
        </select>
        <p className="mt-3 text-xs text-[#6b655f]">
          Thiết lập được lưu trên trình duyệt này.
        </p>
      </section>

      <section className={profileCard} aria-labelledby={`${id}-mascot`}>
        <h3
          className="text-xl font-semibold text-[#3d3935]"
          id={`${id}-mascot`}
        >
          Trợ lý Míc
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#6b655f]">
          Míc hướng dẫn nhanh ở góc màn hình khi bạn mở một trang mới.
        </p>
        <label className="mt-5 flex items-start gap-3 text-sm text-[#3d3935]">
          <input
            checked={preferences.mascotHidden}
            className="mt-0.5 size-4 accent-[#df5a28]"
            onChange={(event) => changeMascotHidden(event.target.checked)}
            type="checkbox"
          />
          <span>
            Ẩn trợ lý Míc
            <span className="mt-1 block text-xs text-[#6b655f]">
              Bạn vẫn có thể mở lại bằng cách bỏ chọn.
            </span>
          </span>
        </label>
      </section>
    </div>
  );
}
