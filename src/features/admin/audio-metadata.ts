export function readAudioDurationMs(file: File): Promise<number | null> {
  if (typeof URL === "undefined" || typeof Audio === "undefined") {
    return Promise.resolve(null);
  }
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const audio = new Audio(objectUrl);
    audio.preload = "metadata";

    const finish = (durationMs: number | null) => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("error", handleError);
      URL.revokeObjectURL(objectUrl);
      resolve(durationMs);
    };

    const handleLoaded = () => {
      const durationSec = audio.duration;
      if (Number.isFinite(durationSec) && durationSec > 0) {
        finish(Math.round(durationSec * 1000));
      } else {
        finish(null);
      }
    };

    const handleError = () => {
      finish(null);
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("error", handleError);
  });
}
