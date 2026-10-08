import { getJson } from "@/shared/api/client";

export interface PingResponse {
  service: string;
  status: "ok";
}

export async function ping(signal?: AbortSignal): Promise<PingResponse> {
  const value = await getJson<unknown>("/api/system/ping", signal);
  if (
    typeof value !== "object" ||
    value === null ||
    !("service" in value) ||
    typeof value.service !== "string" ||
    !("status" in value) ||
    value.status !== "ok"
  ) {
    throw new Error("Phản hồi dịch vụ không hợp lệ.");
  }
  return { service: value.service, status: value.status };
}
