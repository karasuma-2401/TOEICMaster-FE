"use client";

import { useState } from "react";
import { createSpeakingTest } from "@/features/speaking/admin-api";
import { SpeakingApiError } from "@/features/speaking/http";
import { FileTextIcon, XIcon } from "../ui/icons";

const others = [
  [
    "Listening & Reading",
    "120 phút · 200 câu · Thang điểm ETS 10–990",
    "--sp-lr",
  ],
  ["Writing", "60 phút · 8 câu · Thang điểm ETS 0–200", "--sp-write"],
] as const;

/** Creates a Speaking draft, then hands its id to the builder. */
export function CreateTestModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (testId: string) => void;
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!code.trim() || !title.trim()) {
      setError("Mã đề và tên đề là bắt buộc.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { test } = await createSpeakingTest({
        code,
        title,
        description,
        exerciseIds: { 1: [], 2: [], 3: [], 4: [], 5: [] },
      });
      onCreated(test.id);
    } catch (cause) {
      setError(
        cause instanceof SpeakingApiError && cause.status === 409
          ? "Mã đề đã tồn tại."
          : cause instanceof Error
            ? cause.message
            : "Không thể tạo đề Speaking.",
      );
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-[rgb(40_36_33/45%)] p-4 backdrop-blur-[6px]">
      <dialog
        aria-label="Khởi tạo đề thi mới"
        aria-modal="true"
        className="static m-0 w-full max-w-[1000px] rounded-[20px] bg-(--sp-surface) p-0 text-(--sp-ink) shadow-(--sp-shadow-modal)"
        open
      >
        <header className="flex items-center gap-3 border-b border-(--sp-line) p-5">
          <span className="grid size-11 place-items-center rounded-[10px] bg-(--sp-success-bg) text-(--sp-success)">
            <FileTextIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-medium leading-8">
              Khởi tạo đề thi mới
            </h2>
            <p className="text-[13px] text-(--sp-ink-2)">
              Thiết lập thông tin cơ bản trước khi lắp ráp câu hỏi.
            </p>
          </div>
          <button
            aria-label="Đóng"
            className="sp-focus grid size-9 cursor-pointer place-items-center rounded-lg bg-(--sp-subtle)"
            onClick={onClose}
            type="button"
          >
            <XIcon size={16} />
          </button>
        </header>
        <div className="space-y-4 p-5">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Loại đề thi</legend>
            <div className="space-y-2">
              <div className="flex min-h-[84px] items-center gap-3 rounded-[10px] border-[1.5px] border-(--sp-speak-line) bg-(--sp-speak-bg) px-4 font-semibold text-(--sp-speak)">
                <input
                  checked
                  className="accent-(--sp-brand)"
                  readOnly
                  type="radio"
                />
                <span>
                  Speaking
                  <span className="block text-[13px]">
                    20 phút · 11 câu · Thang điểm ETS 0–200
                  </span>
                </span>
              </div>
              {others.map(([name, detail, tone]) => (
                <div
                  className="flex min-h-[84px] items-center gap-3 rounded-[10px] border-[1.5px] border-(--sp-line) px-4 font-semibold opacity-60"
                  key={name}
                  style={{ color: `var(${tone})` }}
                >
                  <input disabled type="radio" />
                  <span>
                    {name}
                    <span className="block text-[13px]">
                      {detail} · Tạo ở mục kỹ năng tương ứng
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold">
            Mã đề <span className="text-(--sp-danger)">*</span>
            <input
              className="sp-input mt-1 font-normal"
              onChange={(event) => setCode(event.target.value)}
              placeholder="ETS-2025-TEST-01"
              value={code}
            />
          </label>
          <label className="block text-sm font-semibold">
            Tên đề thi <span className="text-(--sp-danger)">*</span>
            <input
              className="sp-input mt-1 font-normal"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="ETS Speaking · Test 01"
              value={title}
            />
          </label>
          <label className="block text-sm font-semibold">
            Mô tả ngắn
            <textarea
              className="sp-input mt-1 font-normal"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Mô tả ngắn cho đề thi…"
              rows={2}
              value={description}
            />
          </label>
          {error && (
            <p
              className="text-sm font-semibold text-(--sp-danger)"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-(--sp-line) p-5">
          <button
            className="sp-btn sp-btn-outline"
            onClick={onClose}
            type="button"
          >
            Hủy
          </button>
          <button
            className="sp-btn sp-btn-cta"
            disabled={busy}
            onClick={() => void submit()}
            type="button"
          >
            {busy ? "Đang tạo…" : "Khởi tạo bản nháp & Mở Workspace →"}
          </button>
        </footer>
      </dialog>
    </div>
  );
}
