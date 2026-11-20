// Converts a browser recording (WebM/Ogg/MP4) to 16 kHz mono 16-bit PCM WAV, the
// format the assessor needs, so the backend does not have to transcode it.

export const targetSampleRate = 16000;

/** Wraps float samples (-1..1) in a canonical 44-byte-header PCM WAV. */
export function encodeWav(
  samples: Float32Array,
  sampleRate = targetSampleRate,
): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1)
      view.setUint8(offset + index, value.charCodeAt(index));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(
      44 + index * 2,
      value < 0 ? value * 0x8000 : value * 0x7fff,
      true,
    );
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Decodes and resamples a recording to 16 kHz mono WAV. Returns `null` when the
 * browser cannot decode it; callers then send the original recording.
 */
export async function toWav16kMono(recording: Blob): Promise<Blob | null> {
  if (
    typeof window === "undefined" ||
    typeof window.AudioContext === "undefined" ||
    typeof window.OfflineAudioContext === "undefined"
  )
    return null;
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(
      await recording.arrayBuffer(),
    );
    const length = Math.max(1, Math.ceil(decoded.duration * targetSampleRate));
    const offline = new OfflineAudioContext(1, length, targetSampleRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return encodeWav(rendered.getChannelData(0));
  } catch {
    return null;
  } finally {
    void context.close().catch(() => undefined);
  }
}
