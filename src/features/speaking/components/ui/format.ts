/** `mm:ss` for countdowns and players. */
export function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Wall-clock length of an attempt, e.g. `19 phút 42 giây`. */
export function formatElapsed(startUtc: string, endUtc: string | null) {
  if (!endUtc) return "—";
  const seconds = Math.max(
    0,
    Math.round((Date.parse(endUtc) - Date.parse(startUtc)) / 1000),
  );
  return `${Math.floor(seconds / 60)} phút ${seconds % 60} giây`;
}
