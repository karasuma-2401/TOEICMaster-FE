/** Shared runtime type guards for validating unknown HTTP and storage boundaries. */

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

export function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

export function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && value > 0;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isGuid(value: unknown): value is string {
  return typeof value === "string" && GUID_REGEX.test(value);
}

export function isNullableGuid(value: unknown): value is string | null {
  return value === null || isGuid(value);
}

export function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ISO_DATE_REGEX.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

export function isNullableIsoDate(value: unknown): value is string | null {
  return value === null || isIsoDate(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

export function isOneOf<T extends string>(
  allowed: readonly T[],
): (value: unknown) => value is T {
  const allowedSet = new Set<string>(allowed);
  return (value: unknown): value is T =>
    typeof value === "string" && allowedSet.has(value);
}
