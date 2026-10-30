"use client";

import { useMemo, useState } from "react";
import {
  createAdminTestDraft,
  createQuestionId,
  deleteAdminQuestion,
  getAdminQuestions,
  getAdminWritingTests,
  saveAdminQuestion,
  saveAdminWritingTest,
  timingTemplates,
  validateTestForPublish,
  type AdminWritingQuestion,
  type AdminWritingTest,
  type QuestionFilter,
  type WritingQuestionStatus,
} from "@/features/writing/admin-mock";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/features/admin/components/content/admin-page-header";
import { ContentTabs } from "@/features/admin/components/content/content-tabs";
import type { WritingDifficulty, WritingPart } from "@/features/writing/types";

const parts: WritingPart[] = [1, 2, 3];
const difficulties: Array<WritingDifficulty | "ALL"> = [
  "ALL",
  "Dễ",
  "Trung bình",
  "Khó",
];
const statuses: Array<WritingQuestionStatus | "ALL"> = [
  "ALL",
  "PUBLISHED",
  "DRAFT",
  "ARCHIVED",
];
const statusLabel: Record<WritingQuestionStatus, string> = {
  PUBLISHED: "Hiển thị",
  DRAFT: "Bản nháp",
  ARCHIVED: "Lưu trữ",
};

type Draft = {
  id: string;
  part: WritingPart;
  code: string;
  topic: string;
  difficulty: WritingDifficulty;
  status: WritingQuestionStatus;
  rubricNotes: string;
  modelAnswer: string;
  imageName: string;
  imageAlt: string;
  keywordOne: string;
  keywordTwo: string;
  sender: string;
  recipient: string;
  subject: string;
  emailBody: string;
  directions: string;
  prompt: string;
  minimumWordCount: number;
  outline: string;
};

function toDraft(
  question?: AdminWritingQuestion,
  part: WritingPart = 1,
): Draft {
  const base = {
    id: question?.id ?? createQuestionId(part),
    part: question?.part ?? part,
    code: question?.code ?? `WP${part}-NEW`,
    topic: question?.topic ?? "Công việc",
    difficulty: question?.difficulty ?? "Dễ",
    status: question?.status ?? "DRAFT",
    rubricNotes: question?.rubricNotes ?? "",
    modelAnswer: question?.modelAnswer ?? "",
    imageName: "",
    imageAlt: "",
    keywordOne: "",
    keywordTwo: "",
    sender: "",
    recipient: "",
    subject: "",
    emailBody: "",
    directions: "",
    prompt: "",
    minimumWordCount: 300,
    outline: "",
  };
  if (!question) return base;
  if (question.part === 1)
    return {
      ...base,
      imageName: question.imageName,
      imageAlt: question.imageAlt,
      keywordOne: question.keywordOne,
      keywordTwo: question.keywordTwo,
    };
  if (question.part === 2)
    return {
      ...base,
      sender: question.sender,
      recipient: question.recipient,
      subject: question.subject,
      emailBody: question.emailBody,
      directions: question.directions,
    };
  return {
    ...base,
    prompt: question.prompt,
    minimumWordCount: question.minimumWordCount,
    outline: question.outline,
  };
}

function saveDraft(draft: Draft) {
  const base = {
    id: draft.id,
    code: draft.code.trim(),
    topic: draft.topic.trim(),
    difficulty: draft.difficulty,
    status: draft.status,
    updatedAtLabel: "Vừa cập nhật",
    rubricNotes: draft.rubricNotes.trim(),
    modelAnswer: draft.modelAnswer.trim(),
  };
  const question: AdminWritingQuestion =
    draft.part === 1
      ? {
          ...base,
          part: 1,
          imageName: draft.imageName,
          imageAlt: draft.imageAlt,
          keywordOne: draft.keywordOne,
          keywordTwo: draft.keywordTwo,
        }
      : draft.part === 2
        ? {
            ...base,
            part: 2,
            sender: draft.sender,
            recipient: draft.recipient,
            subject: draft.subject,
            emailBody: draft.emailBody,
            directions: draft.directions,
          }
        : {
            ...base,
            part: 3,
            prompt: draft.prompt,
            minimumWordCount: draft.minimumWordCount,
            outline: draft.outline,
          };
  if (!question.code || !question.topic) return "Mã bài và chủ đề là bắt buộc.";
  if (
    question.part === 1 &&
    (!question.imageName || !question.keywordOne || !question.keywordTwo)
  )
    return "Part 1 cần ảnh và hai từ gợi ý.";
  if (
    question.part === 2 &&
    (!question.sender ||
      !question.recipient ||
      !question.subject ||
      !question.emailBody ||
      !question.directions)
  )
    return "Part 2 cần đủ email đề bài và yêu cầu phản hồi.";
  if (
    question.part === 3 &&
    (!question.prompt || question.minimumWordCount < 1)
  )
    return "Part 3 cần đề bài và số từ tối thiểu.";
  saveAdminQuestion(question);
  return null;
}

function Drawer({
  initial,
  onClose,
  onSaved,
}: {
  initial: Draft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const input = (
    label: string,
    key: keyof Draft,
    area = false,
    number = false,
  ) => (
    <label className="block text-sm font-semibold">
      {label}
      <>
        {area ? (
          <textarea
            className="mt-1.5 min-h-24 w-full rounded-xl border border-[var(--admin-border)] p-3 font-normal"
            onChange={(e) => update(key, e.target.value as never)}
            value={draft[key] as string}
          />
        ) : (
          <input
            className="mt-1.5 h-11 w-full rounded-xl border border-[var(--admin-border)] px-3 font-normal"
            min={number ? 1 : undefined}
            onChange={(e) =>
              update(
                key,
                (number ? Number(e.target.value) : e.target.value) as never,
              )
            }
            type={number ? "number" : "text"}
            value={draft[key] as string | number}
          />
        )}
      </>
    </label>
  );
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40">
      <dialog
        aria-label="Form bài tập Writing"
        aria-modal="true"
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
        open
      >
        <header className="flex justify-between border-b border-[var(--admin-border)] p-6">
          <div>
            <p className="text-xs font-bold text-[var(--admin-brand-red)]">
              WRITING PART {draft.part}
            </p>
            <h2 className="mt-1 text-xl font-bold">
              Chỉnh sửa hoặc thêm bài tập
            </h2>
          </div>
          <button
            aria-label="Đóng form bài tập"
            className="rounded-lg p-2 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {input("Mã bài *", "code")}
            {input("Chủ đề *", "topic")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Độ khó
              <select
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--admin-border)] px-3 font-normal"
                onChange={(e) =>
                  update("difficulty", e.target.value as WritingDifficulty)
                }
                value={draft.difficulty}
              >
                {difficulties.slice(1).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Trạng thái
              <select
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--admin-border)] px-3 font-normal"
                onChange={(e) =>
                  update("status", e.target.value as WritingQuestionStatus)
                }
                value={draft.status}
              >
                {(
                  ["PUBLISHED", "DRAFT", "ARCHIVED"] as WritingQuestionStatus[]
                ).map((item) => (
                  <option key={item} value={item}>
                    {statusLabel[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {draft.part === 1 && (
            <>
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4 text-sm font-bold text-[var(--admin-brand-red)]">
                Hình ảnh đề bài *
                <span className="mt-1 block font-normal text-[var(--admin-muted)]">
                  {draft.imageName || "Chọn ảnh JPG/PNG, tối đa 5MB"}
                </span>
                <input
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={(e) =>
                    update("imageName", e.target.files?.[0]?.name ?? "")
                  }
                  type="file"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                {input("Từ gợi ý 1 *", "keywordOne")}
                {input("Từ gợi ý 2 *", "keywordTwo")}
              </div>
              {input("Alt text ảnh", "imageAlt")}
            </>
          )}
          {draft.part === 2 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {input("From *", "sender")}
                {input("To *", "recipient")}
              </div>
              {input("Subject *", "subject")}
              {input("Nội dung email *", "emailBody", true)}
              {input("Yêu cầu phản hồi *", "directions", true)}
            </>
          )}
          {draft.part === 3 && (
            <>
              {input("Chủ đề bài luận *", "prompt", true)}
              {input("Số từ tối thiểu *", "minimumWordCount", false, true)}
              {input("Dàn ý gợi ý", "outline", true)}
            </>
          )}
          {input("Rubric", "rubricNotes", true)}
          {input("Bài mẫu", "modelAnswer", true)}
          {error && (
            <p
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] p-5">
          <button
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-bold"
            onClick={onClose}
            type="button"
          >
            Hủy
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            onClick={() => {
              const nextError = saveDraft(draft);
              if (nextError) setError(nextError);
              else onSaved();
            }}
            style={{ background: "var(--admin-brand-gradient)" }}
            type="button"
          >
            Lưu bài tập
          </button>
        </footer>
      </dialog>
    </div>
  );
}

function Preview({
  question,
  onClose,
}: {
  question: AdminWritingQuestion;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4">
      <dialog
        aria-label="Preview bài tập"
        aria-modal="true"
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
        open
      >
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-bold text-[var(--admin-brand-red)]">
              GÓC NHÌN USER · PART {question.part}
            </p>
            <h2 className="mt-1 text-xl font-bold">{question.code}</h2>
          </div>
          <button aria-label="Đóng preview" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="mt-5 rounded-xl bg-[var(--admin-surface-muted)] p-5">
          {question.part === 1 ? (
            <>
              <div className="grid h-32 place-items-center rounded-lg bg-orange-100 text-sm">
                {question.imageName}
              </div>
              <p className="mt-4 font-bold">
                Dùng: {question.keywordOne} · {question.keywordTwo}
              </p>
            </>
          ) : question.part === 2 ? (
            <>
              <p>
                <b>From:</b> {question.sender}
              </p>
              <p>
                <b>To:</b> {question.recipient}
              </p>
              <p className="mt-2">
                <b>Subject:</b> {question.subject}
              </p>
              <p className="mt-4 whitespace-pre-line text-sm">
                {question.emailBody}
              </p>
            </>
          ) : (
            <>
              <p className="font-bold">{question.prompt}</p>
              <p className="mt-3 text-sm">
                Tối thiểu {question.minimumWordCount} từ
              </p>
            </>
          )}
        </div>
        <button
          className="mt-5 rounded-lg px-4 py-2 text-sm font-bold text-white"
          onClick={onClose}
          style={{ background: "var(--admin-brand-gradient)" }}
          type="button"
        >
          Đóng
        </button>
      </dialog>
    </div>
  );
}

function ImportDialog({
  part,
  onClose,
  onImported,
}: {
  part: WritingPart;
  onClose: () => void;
  onImported: () => void;
}) {
  const [picked, setPicked] = useState(false);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4">
      <dialog
        aria-label="Import Excel Writing"
        aria-modal="true"
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
        open
      >
        <header className="flex justify-between border-b border-[var(--admin-border)] p-6">
          <div>
            <h2 className="text-xl font-bold">Import Writing Part {part}</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Mỗi Part dùng template Excel riêng.
            </p>
          </div>
          <button aria-label="Đóng import" onClick={onClose} type="button">
            ×
          </button>
        </header>
        <div className="p-6">
          {!picked ? (
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-10 text-center">
              <b className="text-[var(--admin-brand-red)]">
                Chọn file .xlsx để preview
              </b>
              <span className="mt-2 block text-sm text-[var(--admin-muted)]">
                Tối đa 10MB
              </span>
              <input
                accept=".xlsx"
                className="sr-only"
                onChange={() => setPicked(true)}
                type="file"
              />
            </label>
          ) : (
            <table className="w-full overflow-hidden rounded-xl border border-[var(--admin-border)] text-left text-sm">
              <thead className="bg-[var(--admin-surface-muted)]">
                <tr>
                  <th className="p-3">Dòng</th>
                  <th className="p-3">Mã bài</th>
                  <th className="p-3">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3">2</td>
                  <td>WP{part}-IMPORT-01</td>
                  <td className="text-emerald-700">Hợp lệ</td>
                </tr>
                <tr>
                  <td className="border-t p-3">3</td>
                  <td className="border-t">—</td>
                  <td className="border-t text-red-700">Thiếu mã bài</td>
                </tr>
                <tr>
                  <td className="border-t p-3">4</td>
                  <td className="border-t">WP{part}-IMPORT-02</td>
                  <td className="border-t text-emerald-700">Hợp lệ</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] p-5">
          <button
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-bold"
            onClick={onClose}
            type="button"
          >
            Hủy
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            disabled={!picked}
            onClick={onImported}
            style={{ background: "var(--admin-brand-gradient)" }}
            type="button"
          >
            Import dòng hợp lệ
          </button>
        </footer>
      </dialog>
    </div>
  );
}

export function AdminWritingContentPage() {
  const [, setRevision] = useState(0);
  const [filter, setFilter] = useState<QuestionFilter>({
    part: 1,
    query: "",
    difficulty: "ALL",
    status: "ALL",
    page: 1,
    pageSize: 5,
  });
  const [drawer, setDrawer] = useState<Draft | null>(null);
  const [preview, setPreview] = useState<AdminWritingQuestion | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const list = getAdminQuestions();
  const matches = useMemo(
    () =>
      list.filter(
        (item) =>
          item.part === filter.part &&
          (filter.difficulty === "ALL" ||
            item.difficulty === filter.difficulty) &&
          (filter.status === "ALL" || item.status === filter.status) &&
          `${item.code} ${item.topic}`
            .toLocaleLowerCase("vi-VN")
            .includes(filter.query.toLocaleLowerCase("vi-VN")),
      ),
    [filter, list],
  );
  const pages = Math.max(1, Math.ceil(matches.length / 5));
  const page = Math.min(filter.page, pages);
  const items = matches.slice((page - 1) * 5, page * 5);
  const resetPage = (next: Partial<QuestionFilter>) =>
    setFilter((current) => ({ ...current, ...next, page: 1 }));
  return (
    <div>
      <AdminPageHeader
        actions={
          <>
            <button
              className="h-11 rounded-lg border border-[var(--admin-border)] px-4 text-sm font-bold"
              onClick={() => setImportOpen(true)}
              type="button"
            >
              ⇧ Import Excel
            </button>
            <button
              className="h-11 rounded-lg px-4 text-sm font-bold text-white"
              onClick={() => setDrawer(toDraft(undefined, filter.part))}
              style={{ background: "var(--admin-brand-gradient)" }}
              type="button"
            >
              + Thêm bài tập
            </button>
          </>
        }
        description="Tạo, tìm kiếm, preview và quản lý bài tập theo từng Part."
        title="Ngân hàng bài tập Writing"
      />
      <ContentTabs section="content" skill="writing" />
      {notice && <AdminNotice>{notice}</AdminNotice>}
      <div className="mt-6 flex gap-2">
        {parts.map((part) => (
          <button
            className={`rounded-lg px-4 py-2 text-sm font-bold ${part === filter.part ? "bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]" : "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"}`}
            key={part}
            onClick={() => resetPage({ part })}
            type="button"
          >
            Part {part}
          </button>
        ))}
      </div>
      <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="grid gap-3 border-b border-[var(--admin-border)] p-4 lg:grid-cols-[1fr_11rem_11rem]">
          <input
            aria-label="Tìm bài tập Writing"
            className="h-11 rounded-xl border border-[var(--admin-border)] px-3 text-sm"
            onChange={(e) => resetPage({ query: e.target.value })}
            placeholder="Tìm mã bài hoặc chủ đề..."
            value={filter.query}
          />
          <select
            aria-label="Lọc độ khó"
            className="h-11 rounded-xl border border-[var(--admin-border)] px-3 text-sm"
            onChange={(e) =>
              resetPage({
                difficulty: e.target.value as QuestionFilter["difficulty"],
              })
            }
            value={filter.difficulty}
          >
            {difficulties.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "Độ khó: Tất cả" : item}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc trạng thái"
            className="h-11 rounded-xl border border-[var(--admin-border)] px-3 text-sm"
            onChange={(e) =>
              resetPage({ status: e.target.value as QuestionFilter["status"] })
            }
            value={filter.status}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "Trạng thái: Tất cả" : statusLabel[item]}
              </option>
            ))}
          </select>
        </div>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[var(--admin-surface-muted)] text-xs text-[var(--admin-muted)]">
                <tr>
                  <th className="p-4">MÃ BÀI</th>
                  <th className="p-4">NỘI DUNG</th>
                  <th className="p-4">CHỦ ĐỀ</th>
                  <th className="p-4">ĐỘ KHÓ</th>
                  <th className="p-4">TRẠNG THÁI</th>
                  <th className="p-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {items.map((question) => (
                  <tr
                    className="border-t border-[var(--admin-border)]"
                    key={question.id}
                  >
                    <td className="p-4 font-bold text-[var(--admin-brand-red)]">
                      {question.code}
                    </td>
                    <td className="p-4 font-semibold">
                      {question.part === 1
                        ? `${question.keywordOne} / ${question.keywordTwo}`
                        : question.part === 2
                          ? question.subject
                          : question.prompt}
                    </td>
                    <td className="p-4">{question.topic}</td>
                    <td className="p-4">{question.difficulty}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-[var(--admin-nav-active)] px-2 py-1 text-xs font-bold text-[var(--admin-brand-red)]">
                        {statusLabel[question.status]}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        className="px-2"
                        onClick={() => setPreview(question)}
                        type="button"
                      >
                        Xem
                      </button>
                      <button
                        className="px-2 text-[var(--admin-brand-red)]"
                        onClick={() => setDrawer(toDraft(question))}
                        type="button"
                      >
                        Sửa
                      </button>
                      <button
                        className="px-2 text-red-700"
                        onClick={() => {
                          if (window.confirm(`Xóa ${question.code}?`)) {
                            deleteAdminQuestion(question.id);
                            setRevision((v) => v + 1);
                            setNotice("Đã xóa bài tập.");
                          }
                        }}
                        type="button"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-14 text-center">
            <b>Không tìm thấy bài tập phù hợp</b>
            <button
              className="ml-3 text-sm font-bold text-[var(--admin-brand-red)] underline"
              onClick={() =>
                setFilter((current) => ({
                  ...current,
                  query: "",
                  difficulty: "ALL",
                  status: "ALL",
                  page: 1,
                }))
              }
              type="button"
            >
              Xóa lọc
            </button>
          </div>
        )}
        <footer className="flex items-center justify-between border-t border-[var(--admin-border)] p-4 text-xs text-[var(--admin-muted)]">
          <span>{matches.length} bài tập</span>
          <div className="flex gap-2">
            <button
              aria-label="Trang trước"
              className="size-8 rounded border disabled:opacity-40"
              disabled={page <= 1}
              onClick={() =>
                setFilter((current) => ({ ...current, page: page - 1 }))
              }
              type="button"
            >
              ‹
            </button>
            <span className="grid size-8 place-items-center rounded bg-[var(--admin-nav-active)] font-bold text-[var(--admin-brand-red)]">
              {page}
            </span>
            <button
              aria-label="Trang sau"
              className="size-8 rounded border disabled:opacity-40"
              disabled={page >= pages}
              onClick={() =>
                setFilter((current) => ({ ...current, page: page + 1 }))
              }
              type="button"
            >
              ›
            </button>
          </div>
        </footer>
      </section>
      {drawer && (
        <Drawer
          initial={drawer}
          onClose={() => setDrawer(null)}
          onSaved={() => {
            setDrawer(null);
            setRevision((v) => v + 1);
            setNotice("Đã lưu bài tập trong mock repository.");
          }}
        />
      )}
      {preview && (
        <Preview onClose={() => setPreview(null)} question={preview} />
      )}
      {importOpen && (
        <ImportDialog
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            setNotice(
              "Đã import 2 dòng hợp lệ (mock). API thật sẽ được nối ở CP4.",
            );
          }}
          part={filter.part}
        />
      )}
    </div>
  );
}

function slots(part: WritingPart) {
  return part === 1 ? 5 : part === 2 ? 2 : 1;
}
function questionName(id: string) {
  const question = getAdminQuestions().find((item) => item.id === id);
  return question
    ? `${question.code} · ${question.topic}`
    : "Chưa chọn câu hỏi";
}

function Builder({
  initial,
  onClose,
  onSaved,
}: {
  initial: AdminWritingTest;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const template = timingTemplates[0];
  const replaceSlot = (part: WritingPart, index: number, id: string) =>
    setDraft((current) => ({
      ...current,
      questionIds: {
        ...current.questionIds,
        [part]: current.questionIds[part].map((old, currentIndex) =>
          currentIndex === index ? id : old,
        ),
      },
    }));
  const persist = (publish: boolean) => {
    const next = {
      ...draft,
      status: publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
    };
    const nextErrors = publish
      ? validateTestForPublish(next)
      : !next.code.trim() || !next.title.trim()
        ? ["Mã đề và tên đề là bắt buộc."]
        : [];
    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }
    saveAdminWritingTest(next);
    onSaved(publish ? "Đề đã được công bố." : "Đã lưu bản nháp đề Writing.");
  };
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40">
      <dialog
        aria-label="Test builder Writing"
        aria-modal="true"
        className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl"
        open
      >
        <header className="flex justify-between border-b border-[var(--admin-border)] p-6">
          <div>
            <p className="text-xs font-bold text-[var(--admin-brand-red)]">
              TEST BUILDER · 5/2/1
            </p>
            <h2 className="mt-1 text-xl font-bold">Tạo/chỉnh sửa đề Writing</h2>
          </div>
          <button
            aria-label="Đóng test builder"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Mã đề *
              <input
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--admin-border)] px-3 font-normal"
                onChange={(e) =>
                  setDraft((current) => ({ ...current, code: e.target.value }))
                }
                value={draft.code}
              />
            </label>
            <label className="text-sm font-semibold">
              Tên đề *
              <input
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--admin-border)] px-3 font-normal"
                onChange={(e) =>
                  setDraft((current) => ({ ...current, title: e.target.value }))
                }
                value={draft.title}
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Mô tả
            <textarea
              className="mt-1.5 min-h-20 w-full rounded-xl border border-[var(--admin-border)] p-3 font-normal"
              onChange={(e) =>
                setDraft((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
              value={draft.description}
            />
          </label>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="font-bold">{template.label}</p>
            <p className="mt-1 text-xs text-[var(--admin-muted)]">
              {template.description}
            </p>
          </div>
          {parts.map((part) => (
            <section
              className="rounded-xl border border-[var(--admin-border)] p-4"
              key={part}
            >
              <h3 className="font-bold">
                Writing Part {part} · {slots(part)} câu
              </h3>
              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                Chuẩn bị {template.values[part].preparationSeconds}s · Làm bài{" "}
                {template.values[part].responseSeconds >= 60
                  ? `${template.values[part].responseSeconds / 60} phút`
                  : `${template.values[part].responseSeconds}s`}
              </p>
              <div className="mt-3 space-y-2">
                {Array.from({ length: slots(part) }, (_, index) => (
                  <label
                    className="grid gap-2 text-sm sm:grid-cols-[5rem_1fr] sm:items-center"
                    key={index}
                  >
                    <b>Câu {index + 1}</b>
                    <select
                      className="h-10 rounded-lg border border-[var(--admin-border)] px-3"
                      onChange={(e) => replaceSlot(part, index, e.target.value)}
                      value={draft.questionIds[part][index] ?? ""}
                    >
                      <option value="">Chọn câu hỏi</option>
                      {getAdminQuestions()
                        .filter(
                          (question) =>
                            question.part === part &&
                            question.status === "PUBLISHED",
                        )
                        .map((question) => (
                          <option key={question.id} value={question.id}>
                            {questionName(question.id)}
                          </option>
                        ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>
          ))}
          {errors.length > 0 && (
            <div
              className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              <b>Chưa thể công bố</b>
              <ul className="mt-2 list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {showPreview && (
            <dialog
              aria-label="Preview đề Writing cho User"
              aria-modal="true"
              className="fixed inset-0 z-[80] m-auto w-[min(42rem,calc(100%-2rem))] rounded-2xl border border-[var(--admin-border)] bg-white p-6 shadow-2xl"
              open
            >
              <p className="text-xs font-bold tracking-[0.12em] text-[var(--admin-brand-red)]">
                GÓC NHÌN USER · TRƯỚC KHI BẮT ĐẦU
              </p>
              <h3 className="mt-2 text-2xl font-bold">
                {draft.title || "Chưa đặt tên đề"}
              </h3>
              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                {draft.description || "Chưa có mô tả cho đề Writing này."}
              </p>
              <div className="mt-5 space-y-3">
                {parts.map((part) => (
                  <div
                    className="rounded-xl bg-[var(--admin-surface-muted)] p-4"
                    key={part}
                  >
                    <b>Writing Part {part}</b>
                    <p className="mt-1 text-sm text-[var(--admin-muted)]">
                      {draft.questionIds[part].filter(Boolean).length}/
                      {slots(part)} câu · Chuẩn bị{" "}
                      {template.values[part].preparationSeconds}s · Làm bài{" "}
                      {template.values[part].responseSeconds >= 60
                        ? `${template.values[part].responseSeconds / 60} phút`
                        : `${template.values[part].responseSeconds}s`}
                    </p>
                  </div>
                ))}
              </div>
              <button
                className="mt-6 rounded-lg px-4 py-2 text-sm font-bold text-white"
                onClick={() => setShowPreview(false)}
                style={{ background: "var(--admin-brand-gradient)" }}
                type="button"
              >
                Đóng preview
              </button>
            </dialog>
          )}
        </div>
        <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] p-5">
          <button
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-bold"
            onClick={onClose}
            type="button"
          >
            Hủy
          </button>
          <button
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-bold"
            onClick={() => persist(false)}
            type="button"
          >
            Lưu bản nháp
          </button>
          <button
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-bold"
            onClick={() => setShowPreview(true)}
            type="button"
          >
            Xem trước User
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            onClick={() => persist(true)}
            style={{ background: "var(--admin-brand-gradient)" }}
            type="button"
          >
            Xuất bản đề
          </button>
        </footer>
      </dialog>
    </div>
  );
}

export function AdminWritingTestsPage() {
  const [, setRevision] = useState(0);
  const [builder, setBuilder] = useState<AdminWritingTest | null>(null);
  const [notice, setNotice] = useState("");
  const tests = getAdminWritingTests();
  return (
    <div>
      <AdminPageHeader
        actions={
          <button
            className="h-11 rounded-lg px-4 text-sm font-bold text-white"
            onClick={() => setBuilder(createAdminTestDraft())}
            style={{ background: "var(--admin-brand-gradient)" }}
            type="button"
          >
            + Tạo đề Writing
          </button>
        }
        description="Lắp đề 5/2/1, dùng timing template và kiểm tra điều kiện xuất bản."
        title="Đề Writing"
      />
      <ContentTabs section="tests" skill="writing" />
      {notice && <AdminNotice>{notice}</AdminNotice>}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[var(--admin-surface-muted)] text-xs text-[var(--admin-muted)]">
              <tr>
                <th className="p-4">MÃ ĐỀ</th>
                <th className="p-4">TÊN ĐỀ</th>
                <th className="p-4">CẤU TRÚC</th>
                <th className="p-4">TRẠNG THÁI</th>
                <th className="p-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr
                  className="border-t border-[var(--admin-border)]"
                  key={test.id}
                >
                  <td className="p-4 font-bold text-[var(--admin-brand-red)]">
                    {test.code}
                  </td>
                  <td className="p-4">
                    <b>{test.title}</b>
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">
                      {test.updatedAtLabel}
                    </p>
                  </td>
                  <td className="p-4">
                    {test.questionIds[1].length}/5 ·{" "}
                    {test.questionIds[2].length}/2 ·{" "}
                    {test.questionIds[3].length}/1
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${test.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {test.status === "PUBLISHED" ? "Công bố" : "Bản nháp"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      className="font-bold text-[var(--admin-brand-red)]"
                      onClick={() => setBuilder(test)}
                      type="button"
                    >
                      Mở builder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {builder && (
        <Builder
          initial={builder}
          onClose={() => setBuilder(null)}
          onSaved={(message) => {
            setBuilder(null);
            setRevision((value) => value + 1);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}
