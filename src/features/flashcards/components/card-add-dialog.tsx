"use client";

import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState, type FormEvent } from "react";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import type { CreateFlashcardCardPayload } from "../api";
import type { CefrLevel } from "../types";

export function CardAddDialog({
  deckTitle,
  open,
  onOpenChange,
  onAddCard,
}: {
  deckTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (payload: CreateFlashcardCardPayload) => Promise<void> | void;
}) {
  const [term, setTerm] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("noun");
  const [level, setLevel] = useState<CefrLevel>("B2");
  const [exampleEn, setExampleEn] = useState("");
  const [exampleVi, setExampleVi] = useState("");
  const [collocationsText, setCollocationsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTerm("");
    setMeaningVi("");
    setPhonetic("");
    setPartOfSpeech("noun");
    setLevel("B2");
    setExampleEn("");
    setExampleVi("");
    setCollocationsText("");
    setError(null);
    setSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanTerm = term.trim();
    const cleanMeaning = meaningVi.trim();
    if (!cleanTerm || !cleanMeaning) {
      setError("Vui lòng nhập đầy đủ từ tiếng Anh và nghĩa tiếng Việt.");
      return;
    }

    const collocations = collocationsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      await onAddCard({
        term: cleanTerm,
        meaningVi: cleanMeaning,
        phonetic: phonetic.trim() || undefined,
        partOfSpeech: partOfSpeech.trim() || "noun",
        level,
        exampleEn: exampleEn.trim() || undefined,
        exampleVi: exampleVi.trim() || undefined,
        collocations,
        toeicPart: "Từ vựng cá nhân",
      });
      handleOpenChange(false);
    } catch {
      setError("Không thể thêm từ vào bộ thẻ. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby="add-card-description"
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[#ece9e5] bg-white shadow-[0_24px_64px_-12px_rgb(0_0_0/0.25)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#ece9e5] px-6 py-5">
            <div>
              <Dialog.Title className="text-xl font-bold text-[#2b2724]">
                Thêm từ vào bộ thẻ
              </Dialog.Title>
              <Dialog.Description
                className="mt-1 text-sm text-[#5f5953]"
                id="add-card-description"
              >
                Bộ thẻ:{" "}
                <span className="font-semibold text-[#2b2724]">
                  {deckTitle}
                </span>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Đóng hộp thoại"
                className={`grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-[#5f5953] transition hover:bg-[#f4f1ee] hover:text-[#2b2724] ${focusRing}`}
                type="button"
              >
                <X aria-hidden="true" className="size-4" strokeWidth={2} />
              </button>
            </Dialog.Close>
          </div>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleSubmit}
          >
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-[#2b2724]">
                    Từ tiếng Anh <span className="text-[#bd2a2a]">*</span>
                  </span>
                  <input
                    className="sp-input min-h-10"
                    maxLength={120}
                    onChange={(e) => {
                      setTerm(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ví dụ: invoice"
                    type="text"
                    value={term}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-[#2b2724]">
                    Nghĩa tiếng Việt <span className="text-[#bd2a2a]">*</span>
                  </span>
                  <input
                    className="sp-input min-h-10"
                    maxLength={300}
                    onChange={(e) => {
                      setMeaningVi(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ví dụ: hóa đơn thanh toán"
                    type="text"
                    value={meaningVi}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-[#2b2724]">
                    Phiên âm IPA
                  </span>
                  <input
                    className="sp-input min-h-10"
                    maxLength={120}
                    onChange={(e) => setPhonetic(e.target.value)}
                    placeholder="Ví dụ: /ˈɪn.vɔɪs/"
                    type="text"
                    value={phonetic}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold text-[#2b2724]">
                      Từ loại
                    </span>
                    <select
                      className="sp-input min-h-10"
                      onChange={(e) => setPartOfSpeech(e.target.value)}
                      value={partOfSpeech}
                    >
                      <option value="noun">noun</option>
                      <option value="verb">verb</option>
                      <option value="adjective">adjective</option>
                      <option value="adverb">adverb</option>
                      <option value="phrasal verb">phrasal verb</option>
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold text-[#2b2724]">
                      Trình độ
                    </span>
                    <select
                      className="sp-input min-h-10"
                      onChange={(e) => setLevel(e.target.value as CefrLevel)}
                      value={level}
                    >
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                    </select>
                  </label>
                </div>

                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#2b2724]">
                    Câu ví dụ tiếng Anh
                  </span>
                  <input
                    className="sp-input min-h-10"
                    maxLength={400}
                    onChange={(e) => setExampleEn(e.target.value)}
                    placeholder="Please check the invoice before Friday."
                    type="text"
                    value={exampleEn}
                  />
                </label>

                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#2b2724]">
                    Dịch nghĩa câu ví dụ
                  </span>
                  <input
                    className="sp-input min-h-10"
                    maxLength={400}
                    onChange={(e) => setExampleVi(e.target.value)}
                    placeholder="Vui lòng kiểm tra hóa đơn trước thứ Sáu."
                    type="text"
                    value={exampleVi}
                  />
                </label>

                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#2b2724]">
                    Cụm từ đi kèm (phân cách bằng dấu phẩy)
                  </span>
                  <input
                    className="sp-input min-h-10"
                    maxLength={300}
                    onChange={(e) => setCollocationsText(e.target.value)}
                    placeholder="issue an invoice, overdue invoice"
                    type="text"
                    value={collocationsText}
                  />
                </label>
              </div>

              {error && (
                <p
                  className="rounded-lg border border-[#d9544f]/40 bg-[#f6e1e1] px-3.5 py-2.5 text-sm font-medium text-[#bd2a2a]"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#ece9e5] px-6 py-4">
              <Dialog.Close asChild>
                <button className={secondaryAction} type="button">
                  Hủy
                </button>
              </Dialog.Close>
              <button
                className={primaryAction}
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Đang lưu..." : "Thêm vào bộ thẻ"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
