import { NextRequest } from "next/server";
import { problem } from "@/features/auth/server/backend";
import { forwardBffRequest } from "@/shared/server/bff-proxy";

/** Part 1 image upload limit: 5 MiB file plus multipart overhead. */
export const imageUploadLimit = 5 * 1024 * 1024 + 64 * 1024;
/** Excel import limit: 10 MiB file plus multipart overhead. */
export const importUploadLimit = 10 * 1024 * 1024 + 64 * 1024;
/** JSON write payload cap for admin Writing endpoints. */
export const jsonBodyLimit = 1024 * 1024;

type Method = "GET" | "POST" | "PUT" | "DELETE";
const id = "[0-9a-f-]{36}";
const routes: {
  pattern: RegExp;
  methods: Method[];
  uploadLimit?: number;
}[] = [
  { pattern: /^exercises$/, methods: ["GET", "POST"] },
  {
    pattern: new RegExp(`^exercises/${id}$`, "i"),
    methods: ["GET", "PUT", "DELETE"],
  },
  {
    pattern: /^exercises\/imports\/validate$/,
    methods: ["POST"],
    uploadLimit: importUploadLimit,
  },
  {
    pattern: /^exercises\/import$/,
    methods: ["POST"],
    uploadLimit: importUploadLimit,
  },
  {
    pattern: /^media\/images$/,
    methods: ["POST"],
    uploadLimit: imageUploadLimit,
  },
  { pattern: new RegExp(`^media/${id}$`, "i"), methods: ["GET"] },
  { pattern: /^tests$/, methods: ["GET", "POST"] },
  { pattern: /^tests\/import-template$/, methods: ["GET"] },
  {
    pattern: /^tests\/imports\/validate$/,
    methods: ["POST"],
    uploadLimit: importUploadLimit,
  },
  {
    pattern: /^tests\/import$/,
    methods: ["POST"],
    uploadLimit: importUploadLimit,
  },
  {
    pattern: new RegExp(`^tests/${id}$`, "i"),
    methods: ["GET", "PUT", "DELETE"],
  },
  { pattern: new RegExp(`^tests/${id}/publish$`, "i"), methods: ["POST"] },
  { pattern: new RegExp(`^tests/${id}/archive$`, "i"), methods: ["POST"] },
  { pattern: new RegExp(`^tests/${id}/restore$`, "i"), methods: ["POST"] },
  { pattern: new RegExp(`^evaluations/${id}$`, "i"), methods: ["GET"] },
];

export async function forwardAdminWriting(
  request: NextRequest,
  segments: string[],
  method: Method,
) {
  const path = segments.join("/");
  const route = routes.find((item) => item.pattern.test(path));
  if (!route || !route.methods.includes(method))
    return problem(404, "Writing admin API not found.");

  const search = new URL(request.url).search;
  const isMultipart = route.uploadLimit !== undefined;
  const bodyMode =
    method === "GET" || method === "DELETE"
      ? "none"
      : isMultipart
        ? "multipart"
        : "optional-json";

  return forwardBffRequest(request, {
    upstreamPath: `/api/v1/admin/writing/${path}${search}`,
    method,
    auth: "admin",
    bodyMode,
    maxBodyBytes: route.uploadLimit ?? jsonBodyLimit,
    timeoutMs: isMultipart ? 30_000 : 10_000,
    oversizeMessage: "File exceeds the allowed size limit.",
    unreachableMessage: "Service is unavailable. Please try again later.",
  });
}
