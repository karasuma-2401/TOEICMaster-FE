"use client";

import { useEffect, useState } from "react";
import { ping } from "@/features/system/api";

export function ConnectionStatus() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    ping(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setState("error");
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="mt-10 flex items-center gap-4 text-sm text-slate-600">
      <output aria-live="polite">
        {state === "loading"
          ? "Đang kiểm tra kết nối…"
          : state === "ready"
            ? "Đã kết nối dịch vụ."
            : "Chưa kết nối được dịch vụ."}
      </output>
      {state === "error" && (
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 font-medium hover:bg-white focus-visible:outline-2 focus-visible:outline-blue-600"
          onClick={() => {
            setState("loading");
            setAttempt((value) => value + 1);
          }}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
