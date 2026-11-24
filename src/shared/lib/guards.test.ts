import { describe, expect, it } from "vitest";
import {
  isBoolean,
  isGuid,
  isInteger,
  isIsoDate,
  isNonEmptyString,
  isNonNegativeInteger,
  isNullableGuid,
  isNullableIsoDate,
  isNullableString,
  isNumber,
  isOneOf,
  isPositiveInteger,
  isRecord,
  isString,
  isStringArray,
} from "./guards";

describe("shared/lib/guards", () => {
  it("validates records and strings", () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("str")).toBe(false);

    expect(isString("")).toBe(true);
    expect(isString(123)).toBe(false);

    expect(isNonEmptyString("ok")).toBe(true);
    expect(isNonEmptyString("   ")).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);

    expect(isNullableString(null)).toBe(true);
    expect(isNullableString("abc")).toBe(true);
    expect(isNullableString(undefined)).toBe(false);
  });

  it("validates numbers, integers, and booleans", () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-3.14)).toBe(true);
    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isNumber("1")).toBe(false);

    expect(isInteger(42)).toBe(true);
    expect(isInteger(4.2)).toBe(false);
    expect(isInteger(Number.NaN)).toBe(false);
    expect(isInteger(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isInteger("42")).toBe(false);

    expect(isNonNegativeInteger(0)).toBe(true);
    expect(isNonNegativeInteger(-1)).toBe(false);
    expect(isNonNegativeInteger(0.5)).toBe(false);

    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(-1)).toBe(false);
    expect(isPositiveInteger(1.5)).toBe(false);

    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean("true")).toBe(false);
  });

  it("validates RFC4122 and seeded GUIDs", () => {
    // v4, v7, and seeded deterministic 8-4-4-4-12 GUIDs
    expect(isGuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isGuid("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
    expect(isGuid("018f4b2c-9a10-7000-8000-000000000001")).toBe(true);
    expect(isGuid("00000000-0000-0000-0000-000000000001")).toBe(true);
    expect(isGuid("not-a-guid")).toBe(false);
    expect(isGuid("550e8400-e29b-41d4-a716-44665544000")).toBe(false);
    expect(isGuid("550e8400-e29b-41d4-a716-44665544000z")).toBe(false);
    expect(isGuid(123)).toBe(false);

    expect(isNullableGuid(null)).toBe(true);
    expect(isNullableGuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isNullableGuid("bad")).toBe(false);
  });

  it.each([
    "00000000-0000-0000-0000-000000000000",
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000042",
  ])(
    "accepts seeded zero-padded GUID %s in required and nullable fields",
    (id) => {
      expect(isGuid(id)).toBe(true);
      expect(isNullableGuid(id)).toBe(true);
      expect(isGuid(` ${id}`)).toBe(false);
      expect(isNullableGuid(`${id} `)).toBe(false);
    },
  );

  it("validates ISO dates, string arrays, and enum unions", () => {
    expect(isIsoDate("2026-11-22")).toBe(true);
    expect(isIsoDate("2026-11-22T09:30:00Z")).toBe(true);
    expect(isIsoDate("2026-11-22T09:30:00.123+07:00")).toBe(true);
    expect(isIsoDate("not-a-date")).toBe(false);
    expect(isIsoDate("12345")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate("2026-13-45")).toBe(false);
    expect(isIsoDate(null)).toBe(false);

    expect(isNullableIsoDate(null)).toBe(true);
    expect(isNullableIsoDate("2026-11-22T09:30:00Z")).toBe(true);
    expect(isNullableIsoDate("invalid")).toBe(false);

    expect(isStringArray(["a", "b"])).toBe(true);
    expect(isStringArray(["a", 1])).toBe(false);
    expect(isStringArray("a")).toBe(false);

    const isRole = isOneOf(["USER", "ADMIN"] as const);
    expect(isRole("USER")).toBe(true);
    expect(isRole("ADMIN")).toBe(true);
    expect(isRole("GUEST")).toBe(false);
    expect(isRole(123)).toBe(false);
    expect(isRole(null)).toBe(false);
  });
});
