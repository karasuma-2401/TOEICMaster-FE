/** @deprecated Use `HttpError` from `@/shared/api/http` for new code. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** @deprecated Use `requestJson` from `@/shared/api/http` with an explicit boundary parser. */
export async function getJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Không thể kết nối dịch vụ.");
  }
  return (await response.json()) as T;
}
