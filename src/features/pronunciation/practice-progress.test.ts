import { afterEach, describe, expect, it, vi } from "vitest";
import {
  markPracticed,
  practiceStorageKey,
  readPracticed,
} from "./practice-progress";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("practice progress", () => {
  it("returns an empty set without a window", () => {
    expect(readPracticed().size).toBe(0);
    expect(markPracticed("p").has("p")).toBe(true);
  });

  it("stores and reads practised slugs", () => {
    const storage = fakeStorage();
    vi.stubGlobal("window", { localStorage: storage });
    markPracticed("p");
    markPracticed("b");
    markPracticed("p");
    expect([...readPracticed()]).toEqual(["p", "b"]);
    expect(storage.data.get(practiceStorageKey)).toBe('["p","b"]');
  });

  it("treats corrupt data as empty", () => {
    vi.stubGlobal("window", {
      localStorage: fakeStorage({ [practiceStorageKey]: "{oops" }),
    });
    expect(readPracticed().size).toBe(0);
    vi.stubGlobal("window", {
      localStorage: fakeStorage({ [practiceStorageKey]: '{"a":1}' }),
    });
    expect(readPracticed().size).toBe(0);
  });

  it("does not crash when storage throws", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("blocked");
      },
    });
    expect(readPracticed().size).toBe(0);
    expect(() => markPracticed("p")).not.toThrow();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
      },
    });
    expect(markPracticed("p").has("p")).toBe(true);
  });
});
