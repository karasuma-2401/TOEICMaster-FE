import { describe, expect, it } from "vitest";
import { encodeWav, toWav16kMono } from "./wav";

async function bytes(blob: Blob) {
  return new DataView(await blob.arrayBuffer());
}

function text(view: DataView, offset: number, length: number) {
  return String.fromCharCode(
    ...Array.from({ length }, (_, index) => view.getUint8(offset + index)),
  );
}

describe("encodeWav", () => {
  it("writes a 16 kHz mono 16-bit PCM header", async () => {
    const blob = encodeWav(new Float32Array(16000));
    const view = await bytes(blob);
    expect(blob.type).toBe("audio/wav");
    expect(view.byteLength).toBe(44 + 32000);
    expect(text(view, 0, 4)).toBe("RIFF");
    expect(text(view, 8, 8)).toBe("WAVEfmt ");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(text(view, 36, 4)).toBe("data");
    expect(view.getUint32(40, true)).toBe(32000);
  });

  it("clamps and scales samples", async () => {
    const view = await bytes(encodeWav(new Float32Array([1, -1, 2, -2, 0])));
    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x8000);
    expect(view.getInt16(48, true)).toBe(0x7fff);
    expect(view.getInt16(50, true)).toBe(-0x8000);
    expect(view.getInt16(52, true)).toBe(0);
  });
});

describe("toWav16kMono", () => {
  it("returns null without Web Audio support", async () => {
    expect(await toWav16kMono(new Blob(["x"]))).toBeNull();
  });
});
