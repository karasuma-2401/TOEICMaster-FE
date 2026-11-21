"use client";

import { Plus, Trash2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState, type FormEvent } from "react";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import { slugifyDeckTitle } from "../storage";
import type { FlashcardDeck, FlashcardItem } from "../types";

interface DraftCard {
  key: string;
  term: string;
  phonetic: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
}

function createEmptyDraft(index: number): DraftCard {
  return {
    key: `draft-${Date.now()}-${index}`,
    term: "",
    phonetic: "",
    partOfSpeech: "noun",
    meaningVi: "",
    exampleEn: "",
    exampleVi: "",
  };
}

export function DeckCreateDialog({
  open,
  onOpenChange,
  onCreateDeck,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDeck: (deck: FlashcardDeck) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [draftCards, setDraftCards] = useState<DraftCard[]>([
    createEmptyDraft(1),
    createEmptyDraft(2),
  ]);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDraftCards([createEmptyDraft(1), createEmptyDraft(2)]);
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const updateCard = (
    key: string,
    field: keyof Omit<DraftCard, "key">,
    value: string,
  ) => {
    setDraftCards((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addCardRow = () => {
    setDraftCards((prev) => [...prev, createEmptyDraft(prev.length + 1)]);
  };

  const removeCardRow = (key: string) => {
    setDraftCards((prev) =>
      prev.length > 1 ? prev.filter((item) => item.key !== key) : prev,
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Vui lòng nhập tên bộ thẻ.");
      return;
    }

    const validCards: FlashcardItem[] = draftCards
      .filter((item) => item.term.trim() && item.meaningVi.trim())
      .map((item, idx) => ({
        id: `custom-${Date.now()}-${idx}`,
        term: item.term.trim(),
        phonetic: item.phonetic.trim(),
        partOfSpeech: item.partOfSpeech.trim() || "noun",
        meaningVi: item.meaningVi.trim(),
        exampleEn: item.exampleEn.trim(),
        exampleVi: item.exampleVi.trim(),
        collocations: [],
        toeicPart: "Từ vựng cá nhân",
        level: "B2",
      }));

    if (validCards.length === 0) {
      setError("Cần ít nhất 1 thẻ có đầy đủ từ tiếng Anh và nghĩa tiếng Việt.");
      return;
    }

    const deckId = `custom-deck-${Date.now()}`;
    const newDeck: FlashcardDeck = {
      id: deckId,
      slug: `${slugifyDeckTitle(cleanTitle)}-${Date.now().toString(36).slice(-4)}`,
      title: cleanTitle,
      description:
        description.trim() || "Bộ từ vựng TOEIC do bạn tự biên soạn.",
      category: "custom",
      targetScore: "Cá nhân",
      estimatedMinutes: Math.max(2, Math.ceil(validCards.length * 0.8)),
      isCustom: true,
      cards: validCards,
    };

    onCreateDeck(newDeck);
    handleOpenChange(false);
  };

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby="create-deck-description"
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[#ece9e5] bg-white shadow-[0_24px_64px_-12px_rgb(0_0_0/0.25)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#ece9e5] px-6 py-5">
            <div>
              <Dialog.Title className="text-xl font-bold text-[#2b2724]">
                Tạo bộ Flashcard mới
              </Dialog.Title>
              <Dialog.Description
                className="mt-1 text-sm text-[#5f5953]"
                id="create-deck-description"
              >
                Lưu bộ từ vựng riêng của bạn ngay trên trình duyệt để ôn tập
                cùng các bộ đề chuẩn TOEIC.
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
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#2b2724]">
                    Tên bộ thẻ <span className="text-[#bd2a2a]">*</span>
                  </span>
                  <input
                    className="sp-input"
                    maxLength={80}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ví dụ: Từ vựng Part 7 hay sai tuần này"
                    type="text"
                    value={title}
                  />
                </label>

                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#2b2724]">
                    Mô tả ngắn
                  </span>
                  <input
                    className="sp-input"
                    maxLength={160}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ghi chú chủ đề hoặc mục tiêu ôn tập"
                    type="text"
                    value={description}
                  />
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#2b2724]">
                    Danh sách thẻ ({draftCards.length})
                  </span>
                  <button
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#df5a28] transition hover:bg-[#fbf0e6] ${focusRing}`}
                    onClick={addCardRow}
                    type="button"
                  >
                    <Plus aria-hidden="true" className="size-3.5" />
                    Thêm thẻ
                  </button>
                </div>

                <div className="space-y-3">
                  {draftCards.map((card, index) => (
                    <div
                      className="rounded-xl border border-[#ece9e5] bg-[#faf7f5] p-4"
                      key={card.key}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="sp-mono text-xs font-semibold text-[#5f5953]">
                          Thẻ #{index + 1}
                        </span>
                        {draftCards.length > 1 && (
                          <button
                            aria-label={`Xóa thẻ ${index + 1}`}
                            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#5f5953] transition hover:bg-[#f6e1e1] hover:text-[#bd2a2a] ${focusRing}`}
                            onClick={() => removeCardRow(card.key)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                            Xóa
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          aria-label={`Từ tiếng Anh thẻ ${index + 1}`}
                          className="sp-input min-h-10 bg-white"
                          onChange={(e) => {
                            updateCard(card.key, "term", e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="Từ tiếng Anh (vd: reimburse) *"
                          type="text"
                          value={card.term}
                        />
                        <input
                          aria-label={`Nghĩa tiếng Việt thẻ ${index + 1}`}
                          className="sp-input min-h-10 bg-white"
                          onChange={(e) => {
                            updateCard(card.key, "meaningVi", e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="Nghĩa tiếng Việt *"
                          type="text"
                          value={card.meaningVi}
                        />
                        <input
                          aria-label={`Phiên âm thẻ ${index + 1}`}
                          className="sp-input min-h-10 bg-white"
                          onChange={(e) =>
                            updateCard(card.key, "phonetic", e.target.value)
                          }
                          placeholder="Phiên âm IPA (không bắt buộc)"
                          type="text"
                          value={card.phonetic}
                        />
                        <select
                          aria-label={`Từ loại thẻ ${index + 1}`}
                          className="sp-input min-h-10 bg-white"
                          onChange={(e) =>
                            updateCard(card.key, "partOfSpeech", e.target.value)
                          }
                          value={card.partOfSpeech}
                        >
                          <option value="noun">noun (danh từ)</option>
                          <option value="verb">verb (động từ)</option>
                          <option value="adjective">adjective (tính từ)</option>
                          <option value="adverb">adverb (trạng từ)</option>
                          <option value="phrasal verb">
                            phrasal verb (cụm động từ)
                          </option>
                        </select>
                        <input
                          aria-label={`Câu ví dụ tiếng Anh thẻ ${index + 1}`}
                          className="sp-input min-h-10 bg-white sm:col-span-2"
                          onChange={(e) =>
                            updateCard(card.key, "exampleEn", e.target.value)
                          }
                          placeholder="Câu ví dụ tiếng Anh (không bắt buộc)"
                          type="text"
                          value={card.exampleEn}
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
              <button className={primaryAction} type="submit">
                Lưu bộ thẻ
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
