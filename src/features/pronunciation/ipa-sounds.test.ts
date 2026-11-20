import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  consonantRows,
  findSound,
  ipaSounds,
  isIpaGroup,
  soundsByGroup,
} from "./ipa-sounds";

describe("ipaSounds", () => {
  it("has the 44 sounds split 12 / 8 / 24", () => {
    expect(ipaSounds).toHaveLength(44);
    expect(soundsByGroup("monophthong")).toHaveLength(12);
    expect(soundsByGroup("diphthong")).toHaveLength(8);
    expect(soundsByGroup("consonant")).toHaveLength(24);
  });

  it("uses unique, URL-safe slugs and symbols", () => {
    const slugs = ipaSounds.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
    const symbols = ipaSounds.map((item) => item.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("links voiceless/voiced pairs both ways", () => {
    for (const item of ipaSounds) {
      if (!item.pairSlug) continue;
      const partner = findSound(item.pairSlug);
      expect(partner?.pairSlug).toBe(item.slug);
      expect(partner?.subgroup).not.toBe(item.subgroup);
    }
  });

  it("highlights the target symbol inside every example transcription", () => {
    for (const item of ipaSounds) {
      for (const example of item.examples) {
        const [start, end] = example.highlight;
        expect(start).toBeGreaterThanOrEqual(0);
        expect(end).toBeLessThanOrEqual(example.ipa.length);
        expect(example.ipa.slice(start, end)).toBe(item.symbol);
        expect(example.word).toMatch(/^[A-Za-z' -]{1,40}$/);
      }
    }
  });

  it("has guidance and at least one assessor mapping per sound", () => {
    for (const item of ipaSounds) {
      expect(item.articulation.length).toBeGreaterThanOrEqual(2);
      expect(item.articulation.length).toBeLessThanOrEqual(4);
      expect(item.commonMistake).not.toBe("");
      expect(item.azurePhonemes.length).toBeGreaterThan(0);
      expect(item.audioSrc).toBe(`/audio/ipa/${item.slug}.mp3`);
    }
  });

  it("lays consonants out as 8 pairs plus 8 others", () => {
    const { pairs, others } = consonantRows();
    expect(pairs).toHaveLength(8);
    expect(others).toHaveLength(8);
    for (const [voiceless, voiced] of pairs) {
      expect(voiceless.subgroup).toBe("voiceless");
      expect(voiced.subgroup).toBe("voiced");
    }
  });

  it("finds sounds by slug and rejects unknown values", () => {
    expect(findSound("th-voiceless")?.symbol).toBe("θ");
    expect(findSound("nope")).toBeUndefined();
    expect(findSound(null)).toBeUndefined();
    expect(isIpaGroup("diphthong")).toBe(true);
    expect(isIpaGroup("vowel")).toBe(false);
  });

  it("ships a sample MP3 and a credit line for every sound", () => {
    const folder = path.join(process.cwd(), "public", "audio", "ipa");
    const credits = readFileSync(path.join(folder, "CREDITS.md"), "utf8");
    for (const item of ipaSounds) {
      const file = path.join(process.cwd(), "public", item.audioSrc);
      expect(existsSync(file), item.audioSrc).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(1000);
      expect(credits).toMatch(new RegExp(`\\|\\s*\`${item.slug}\`\\s*\\|`));
    }
  });
});
