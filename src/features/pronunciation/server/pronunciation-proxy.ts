import { createBffProxy } from "@/shared/server/bff-proxy";

/** 1 MiB of audio plus room for the multipart envelope and text fields. */
export const maxAssessmentBytes = 1024 * 1024 + 64 * 1024;
const timeoutMs = 20_000;

/**
 * Forwards one recording to the backend pronunciation assessor. Without a
 * session the request still goes through so the backend decides (401 today).
 */
export const forwardPronunciationAssessment = createBffProxy({
  upstreamPath: "/api/v1/pronunciation/assessments",
  method: "POST",
  auth: "optional",
  sameOrigin: true,
  bodyMode: "multipart",
  maxBodyBytes: maxAssessmentBytes,
  timeoutMs,
  missingBaseUrlMessage: "Chưa chấm được phát âm lúc này.",
  unreachableMessage: "Chưa chấm được phát âm lúc này.",
  timeoutMessage: "Hệ thống chấm phản hồi quá lâu.",
  oversizeMessage: "Bản thu vượt quá giới hạn.",
});
