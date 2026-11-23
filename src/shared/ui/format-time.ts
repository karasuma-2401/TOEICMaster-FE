/** Formats a non-negative number of seconds as `mm:ss`. */
export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)
    .toString()
    .padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`;
}

/** Rounds up to whole minutes, e.g. `90` -> `2 min`. */
export function formatMinutes(seconds: number) {
  return `${Math.ceil(seconds / 60)} min`;
}

/** Short label for a phase length, e.g. `45s`, `1 min`, `1 min 30s`. */
export function formatPhase(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest}s` : `${minutes} min`;
}
