// Learner preferences persisted in the browser; there is no backend setting yet.

export type ReviewAudioRate = "0.8" | "1.0" | "1.2";

export interface UserPreferences {
  reviewAudioRate: ReviewAudioRate;
  mascotHidden: boolean;
}

export const reviewAudioRates: ReviewAudioRate[] = ["0.8", "1.0", "1.2"];

const reviewAudioRateKey = "toeicmaster-review-audio-rate";
const mascotHiddenKey = "toeicmaster-mascot-hidden";

/** Same-tab notification; the storage event only fires in other tabs. */
export const preferencesChangedEvent = "toeicmaster:preferences-changed";

export const defaultPreferences: UserPreferences = {
  reviewAudioRate: "1.0",
  mascotHidden: false,
};

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isReviewAudioRate(value: unknown): value is ReviewAudioRate {
  return value === "0.8" || value === "1.0" || value === "1.2";
}

let cachedSnapshot: UserPreferences = defaultPreferences;

export function readPreferences(): UserPreferences {
  const store = storage();
  if (!store) return defaultPreferences;
  const savedRate = store.getItem(reviewAudioRateKey);
  const mascotHidden = store.getItem(mascotHiddenKey);
  const reviewAudioRate = isReviewAudioRate(savedRate)
    ? savedRate
    : defaultPreferences.reviewAudioRate;
  const hidden = mascotHidden === "1";
  if (
    cachedSnapshot.reviewAudioRate === reviewAudioRate &&
    cachedSnapshot.mascotHidden === hidden
  ) {
    return cachedSnapshot;
  }
  cachedSnapshot = { reviewAudioRate, mascotHidden: hidden };
  return cachedSnapshot;
}

export function subscribePreferences(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(preferencesChangedEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(preferencesChangedEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function getReviewAudioRate(): ReviewAudioRate {
  return readPreferences().reviewAudioRate;
}

export function isMascotHidden(): boolean {
  return readPreferences().mascotHidden;
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(preferencesChangedEvent));
}

export function setReviewAudioRate(rate: ReviewAudioRate) {
  const store = storage();
  try {
    store?.setItem(reviewAudioRateKey, rate);
  } catch {
    // Storage quota or private mode: keep the in-memory UI usable.
  }
  notify();
}

export function setMascotHidden(hidden: boolean) {
  const store = storage();
  try {
    store?.setItem(mascotHiddenKey, hidden ? "1" : "0");
  } catch {
    // Storage quota or private mode: keep the in-memory UI usable.
  }
  notify();
}
