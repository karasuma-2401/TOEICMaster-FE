import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createScopedStorageKey,
  readScopedStorage,
  writeScopedStorage,
} from "./storage";

const values = new Map<string, string>();
const storage = {
  getItem: vi.fn((key: string) => values.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    values.set(key, value);
  }),
};

beforeEach(() => {
  values.clear();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("shared scoped browser storage", () => {
  it("isolates users, guests, namespaces, and individual keys", () => {
    const learner = { namespace: "flashcards", userId: "learner-1" };
    expect(writeScopedStorage(learner, "progress", "mastered")).toBe(true);
    expect(readScopedStorage(learner, "progress")).toBe("mastered");
    expect(
      readScopedStorage({ ...learner, userId: "learner-2" }, "progress"),
    ).toBeNull();
    expect(
      readScopedStorage({ ...learner, userId: null }, "progress"),
    ).toBeNull();
    expect(
      readScopedStorage({ ...learner, namespace: "pronunciation" }, "progress"),
    ).toBeNull();
    expect(readScopedStorage(learner, "match-best")).toBeNull();
  });

  it("does not collide on separators or the literal user ID guest", () => {
    const scopes = [
      { namespace: "a:b", userId: "learner" },
      { namespace: "a", userId: "b:learner" },
      { namespace: "flashcards", userId: "guest" },
      { namespace: "flashcards", userId: null },
    ];
    expect(
      new Set(scopes.map((scope) => createScopedStorageKey(scope, "key:1")))
        .size,
    ).toBe(4);
    expect(createScopedStorageKey(scopes[0]!, "key:1")).not.toBe(
      createScopedStorageKey(scopes[0]!, "key%3A1"),
    );
  });

  it("rejects empty scope parts rather than silently assigning them to guests", () => {
    expect(() =>
      createScopedStorageKey(
        { namespace: "flashcards", userId: "" },
        "progress",
      ),
    ).toThrow();
    expect(() =>
      createScopedStorageKey({ namespace: " ", userId: null }, "progress"),
    ).toThrow();
    expect(() =>
      createScopedStorageKey({ namespace: "flashcards", userId: null }, " "),
    ).toThrow();
  });

  it("returns an empty result on the server and when browser storage is blocked", () => {
    const scope = { namespace: "flashcards", userId: null };
    vi.unstubAllGlobals();
    expect(readScopedStorage(scope, "progress")).toBeNull();
    expect(writeScopedStorage(scope, "progress", "{}")).toBe(false);
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("SecurityError");
      },
    });
    expect(readScopedStorage(scope, "progress")).toBeNull();
    expect(writeScopedStorage(scope, "progress", "{}")).toBe(false);
  });

  it("contains read and quota failures without exposing or overwriting another scope", () => {
    const scope = { namespace: "flashcards", userId: "learner" };
    storage.getItem.mockImplementationOnce(() => {
      throw new Error("SecurityError");
    });
    storage.setItem.mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });
    expect(readScopedStorage(scope, "progress")).toBeNull();
    expect(writeScopedStorage(scope, "progress", "{}")).toBe(false);
    expect(values.size).toBe(0);
  });
});
