import {
  InvalidAssessmentError,
  parseAssessment,
  type PronunciationAssessment,
} from "./assessment";

export type PronunciationErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_AUDIO"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "NETWORK";

export class PronunciationApiError extends Error {
  constructor(
    readonly code: PronunciationErrorCode,
    message: string,
    readonly status: number | null = null,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "PronunciationApiError";
  }
}

function fileName(type: string) {
  if (type.includes("ogg")) return "recording.ogg";
  if (type.includes("mp4") || type.includes("aac")) return "recording.mp4";
  if (type.includes("wav")) return "recording.wav";
  return "recording.webm";
}

function errorFor(response: Response): PronunciationApiError {
  const { status } = response;
  if (status === 401)
    return new PronunciationApiError(
      "UNAUTHORIZED",
      "Đăng nhập để được chấm phát âm.",
      status,
    );
  if (status === 400 || status === 413 || status === 422)
    return new PronunciationApiError(
      "INVALID_AUDIO",
      "Bản thu không hợp lệ. Hãy thu lại rõ hơn và ngắn hơn 10 giây.",
      status,
    );
  if (status === 429) {
    const seconds = Number(response.headers.get("retry-after"));
    const wait =
      Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
    return new PronunciationApiError(
      "RATE_LIMITED",
      wait
        ? `Bạn thử quá nhanh, hãy chờ ${wait} giây rồi thu lại.`
        : "Bạn thử quá nhanh, hãy chờ một chút rồi thu lại.",
      status,
      wait,
    );
  }
  return new PronunciationApiError(
    "UNAVAILABLE",
    "Chưa chấm được lúc này. Bạn vẫn có thể nghe lại bản thu và so với âm mẫu.",
    status,
  );
}

/** Sends one recording of `referenceText` to the same-origin assessment route. */
export async function assessPronunciation(
  audio: Blob,
  referenceText: string,
  signal?: AbortSignal,
): Promise<PronunciationAssessment> {
  const form = new FormData();
  form.append("file", audio, fileName(audio.type));
  form.append("referenceText", referenceText);
  form.append("locale", "en-US");

  let response: Response;
  try {
    response = await fetch("/api/pronunciation/assessments", {
      method: "POST",
      body: form,
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new PronunciationApiError(
      "NETWORK",
      "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
    );
  }

  if (!response.ok) throw errorFor(response);

  const body: unknown = await response.json().catch(() => null);
  try {
    return parseAssessment(body);
  } catch (error) {
    if (error instanceof InvalidAssessmentError)
      throw new PronunciationApiError(
        "INVALID_RESPONSE",
        "Kết quả chấm không đọc được. Hãy thử lại.",
        response.status,
      );
    throw error;
  }
}
