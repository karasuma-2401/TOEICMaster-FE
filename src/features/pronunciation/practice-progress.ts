// Which sounds this browser has practised. A per-viewer convenience only:
// storage can be missing or throw, and the page must work without it.

export const practiceStorageKey = "toeicmaster.ipa.practiced";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();

/** Raw stored value; a stable string so it can serve as a store snapshot. */
export function practicedSnapshot(): string {
  try {
    return storage()?.getItem(practiceStorageKey) ?? "";
  } catch {
    return "";
  }
}

/** Notifies on changes from this tab and from other tabs. */
export function subscribePracticed(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function parsePracticed(raw: string): Set<string> {
  try {
    if (!raw) return new Set();
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return new Set();
    return new Set(
      value.filter((item): item is string => typeof item === "string"),
    );
  } catch {
    return new Set();
  }
}

export function readPracticed(): Set<string> {
  return parsePracticed(practicedSnapshot());
}

/** Adds `slug` and returns the updated set; storage errors are ignored. */
export function markPracticed(slug: string): Set<string> {
  const next = readPracticed();
  next.add(slug);
  try {
    storage()?.setItem(practiceStorageKey, JSON.stringify([...next]));
  } catch {
    // Private mode or quota: progress simply is not remembered.
  }
  listeners.forEach((listener) => listener());
  return next;
}
