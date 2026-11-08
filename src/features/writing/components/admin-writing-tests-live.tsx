"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/features/admin/components/content/admin-page-header";
import { ContentTabs } from "@/features/admin/components/content/content-tabs";
import {
  createWritingTest,
  deleteWritingTestDraft,
  archiveWritingTest,
  getWritingExercise,
  getWritingTest,
  importWritingTestFile,
  listWritingTests,
  publishWritingTest,
  restoreWritingTest,
  updateWritingTest,
  uploadWritingImage,
  type WritingExerciseInput,
  type WritingTestDto,
  type WritingTestInput,
} from "@/features/writing/admin-api";
import { AdminWritingPrompt } from "./admin-writing-prompt";

type Part = 1 | 2 | 3;
const testStatusLabel: Record<WritingTestDto["status"], string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã công bố",
  ARCHIVED: "Đã lưu trữ",
};
type QuestionDraft = {
  part: Part;
  sequenceNumber: number;
  imageAssetId: string;
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
  rubricNotes: string;
  modelAnswer: string;
};

function emptyQuestion(part: Part, sequenceNumber: number): QuestionDraft {
  return {
    part,
    sequenceNumber,
    imageAssetId: "",
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
    rubricNotes: "",
    modelAnswer: "",
  };
}

function blankQuestions() {
  return ([1, 2, 3] as Part[]).flatMap((part) =>
    Array.from({ length: part === 1 ? 5 : part === 2 ? 2 : 1 }, (_, i) =>
      emptyQuestion(part, i + 1),
    ),
  );
}

function fromSnapshot(
  question: WritingTestDto["questions"][number],
): QuestionDraft | null {
  if (!question.snapshotJson) return null;
  try {
    const value: unknown = JSON.parse(question.snapshotJson);
    if (!value || typeof value !== "object" || Array.isArray(value))
      return null;
    const record = value as Record<string, unknown>;
    const read = (key: string) =>
      typeof record[key] === "string" ? (record[key] as string) : "";
    return {
      ...emptyQuestion(question.part, question.sequenceNumber),
      imageAssetId: read("ImageAssetId"),
      imageAlt: read("ImageAlt"),
      keywordOne: read("KeywordOne"),
      keywordTwo: read("KeywordTwo"),
      sender: read("Sender"),
      recipient: read("Recipient"),
      subject: read("Subject"),
      emailBody: read("EmailBody"),
      directions: read("Directions"),
      prompt: read("Prompt"),
      minimumWordCount:
        typeof record.MinimumWordCount === "number"
          ? record.MinimumWordCount
          : 300,
      outline: read("Outline"),
      rubricNotes: read("RubricNotes"),
      modelAnswer: read("ModelAnswer"),
    };
  } catch {
    return null;
  }
}

const fields: Record<
  Part,
  Array<{ key: keyof QuestionDraft; label: string; area?: boolean }>
> = {
  1: [
    { key: "imageAlt", label: "Mô tả ảnh *" },
    { key: "keywordOne", label: "Từ khóa 1 *" },
    { key: "keywordTwo", label: "Từ khóa 2 *" },
  ],
  2: [
    { key: "sender", label: "Người gửi *" },
    { key: "recipient", label: "Người nhận *" },
    { key: "subject", label: "Chủ đề email *" },
    { key: "emailBody", label: "Nội dung email *", area: true },
    { key: "directions", label: "Yêu cầu phản hồi *", area: true },
  ],
  3: [
    { key: "prompt", label: "Đề bài *", area: true },
    { key: "minimumWordCount", label: "Số từ tối thiểu *" },
    { key: "outline", label: "Dàn ý", area: true },
  ],
};
const inputClass =
  "mt-1 block w-full rounded-lg border border-[var(--admin-border)] p-2 font-normal";

function ImportTest({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageId, setImageId] = useState("");
  const validate = async (selected: File) => {
    setFile(selected);
    setPreview(null);
    setBusy(true);
    try {
      const result = await importWritingTestFile(selected, true);
      if (typeof result.isValid !== "boolean" || !Array.isArray(result.errors))
        throw new Error("Phản hồi kiểm tra không hợp lệ.");
      setPreview({ isValid: result.isValid, errors: result.errors });
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể kiểm tra file.",
      );
    } finally {
      setBusy(false);
    }
  };
  const commit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await importWritingTestFile(file, false);
      onImported();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể import đề.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4">
      <dialog
        open
        aria-modal="true"
        aria-label="Import đề Writing"
        className="relative m-0 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-xl font-bold">Import Excel đề Writing</h2>
        <p className="mt-2 text-sm">
          File gồm 4 sheet: Manifest, Part1, Part2 và Part3. Ảnh Part 1 cần được
          tải lên trước.
        </p>
        <a
          className="mt-3 inline-block text-sm font-semibold text-orange-700 underline"
          href="/api/admin/writing/tests/import-template"
          download="writing-test-template.xlsx"
        >
          Tải file mẫu
        </a>
        <label className="mt-4 block text-sm font-semibold">
          Tải ảnh Part 1 để lấy ImageAssetId
          <input
            className={inputClass}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (!selected) return;
              setBusy(true);
              void uploadWritingImage(selected)
                .then((asset) => {
                  setImageId(asset.id);
                  setError("");
                })
                .catch((cause: unknown) =>
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "Không thể tải ảnh.",
                  ),
                )
                .finally(() => setBusy(false));
            }}
          />
        </label>
        {imageId && (
          <p className="mt-2 break-all text-sm">
            ImageAssetId: <code>{imageId}</code>
          </p>
        )}
        <p className="mt-2 text-xs text-slate-600">
          SequenceNumber: 1–5 cho Part 1, 6–7 cho Part 2 và 8 cho Part 3.
        </p>
        <label className="mt-4 block text-sm font-semibold">
          Chọn file .xlsx
          <input
            className={inputClass}
            type="file"
            accept=".xlsx"
            disabled={busy}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) void validate(selected);
            }}
          />
        </label>
        {preview && (
          <output className="mt-4 block rounded-lg bg-slate-50 p-3 text-sm">
            {preview.isValid ? (
              "File hợp lệ, sẵn sàng tạo bản nháp."
            ) : (
              <ul className="list-disc pl-5">
                {preview.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </output>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2"
            onClick={onClose}
            type="button"
          >
            Hủy
          </button>
          <button
            className="rounded-lg bg-orange-600 px-4 py-2 font-bold text-white disabled:opacity-50"
            disabled={!preview?.isValid || busy}
            onClick={() => void commit()}
            type="button"
          >
            Import bản nháp
          </button>
        </div>
      </dialog>
    </div>
  );
}

function TestBuilder({
  initial,
  onClose,
  onSaved,
}: {
  initial: WritingTestDto | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [questions, setQuestions] = useState(() =>
    blankQuestions().map((question) => {
      const match = initial?.questions.find(
        (item) =>
          item.part === question.part &&
          item.sequenceNumber === question.sequenceNumber,
      );
      return match ? (fromSnapshot(match) ?? question) : question;
    }),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(initial);
  const change = (
    index: number,
    key: keyof QuestionDraft,
    value: string | number,
  ) =>
    setQuestions((items) =>
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  const upload = async (index: number, file: File) => {
    setBusy(true);
    try {
      change(index, "imageAssetId", (await uploadWritingImage(file)).id);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải ảnh.");
    } finally {
      setBusy(false);
    }
  };
  const save = async (publish: boolean) => {
    setBusy(true);
    try {
      if (!code.trim() || !title.trim())
        throw new Error("Mã đề và tên đề là bắt buộc.");
      const selected = questions.filter(
        (question) =>
          !!question.imageAssetId ||
          !!question.rubricNotes.trim() ||
          !!question.modelAnswer.trim() ||
          fields[question.part].some((field) =>
            field.key === "minimumWordCount"
              ? question.minimumWordCount !== 300
              : String(question[field.key]).trim().length > 0,
          ),
      );
      const input: WritingTestInput = {
        code,
        title,
        description,
        questions: selected.map((question) => {
          const content: WritingExerciseInput = {
            ...question,
            code: `${code.trim()}-P${question.part}-${question.sequenceNumber}`,
            topic: title,
            difficulty: "MEDIUM",
            status: "DRAFT",
            imageAssetId: question.imageAssetId || null,
          };
          return {
            part: question.part,
            sequenceNumber: question.sequenceNumber,
            exerciseId: null,
            content,
          };
        }),
      };
      const saved = current
        ? await updateWritingTest(current.id, current.version, input)
        : await createWritingTest(input);
      setCurrent(saved);
      if (publish) await publishWritingTest(saved.id, saved.version);
      onSaved(
        publish ? "Đã công bố đề Writing." : "Đã lưu bản nháp đề Writing.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu đề.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40">
      <dialog
        open
        aria-label="Soạn đề Writing"
        aria-modal="true"
        className="relative m-0 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl"
      >
        <header className="flex justify-between border-b border-[var(--admin-border)] p-5">
          <h2 className="text-xl font-bold">Soạn đề Writing · 5/2/1</h2>
          <button onClick={onClose} type="button" aria-label="Đóng">
            ×
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <label className="block text-sm font-semibold">
            Mã đề *
            <input
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold">
            Tên đề *
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold">
            Mô tả
            <textarea
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <p className="text-sm text-slate-600">
            Có thể lưu bản nháp chưa đủ câu; mỗi câu đã nhập cần đầy đủ trường
            bắt buộc.
          </p>
          {questions.map((question, index) => (
            <section
              className="space-y-3 rounded-xl border border-[var(--admin-border)] p-4"
              key={`${question.part}-${question.sequenceNumber}`}
            >
              <h3 className="font-bold">
                Part {question.part} · Câu {question.sequenceNumber}
              </h3>
              {question.part === 1 && (
                <label className="block text-sm font-semibold">
                  Ảnh đề bài *
                  <input
                    className={inputClass}
                    accept="image/jpeg,image/png,image/webp"
                    type="file"
                    disabled={busy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void upload(index, file);
                    }}
                  />
                  {question.imageAssetId && (
                    <span className="text-xs text-green-700">
                      Ảnh đã tải lên
                    </span>
                  )}
                </label>
              )}
              {fields[question.part].map((field) => (
                <label className="block text-sm font-semibold" key={field.key}>
                  {field.label}
                  {field.area ? (
                    <textarea
                      className={inputClass}
                      value={String(question[field.key])}
                      onChange={(event) =>
                        change(index, field.key, event.target.value)
                      }
                    />
                  ) : (
                    <input
                      className={inputClass}
                      type={
                        field.key === "minimumWordCount" ? "number" : "text"
                      }
                      value={question[field.key]}
                      onChange={(event) =>
                        change(
                          index,
                          field.key,
                          field.key === "minimumWordCount"
                            ? Number(event.target.value)
                            : event.target.value,
                        )
                      }
                    />
                  )}
                </label>
              ))}
              <label className="block text-sm font-semibold">
                Tiêu chí chấm
                <textarea
                  className={inputClass}
                  value={question.rubricNotes}
                  onChange={(e) => change(index, "rubricNotes", e.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold">
                Bài tham khảo nội bộ (không bắt buộc)
                <textarea
                  className={inputClass}
                  value={question.modelAnswer}
                  onChange={(e) => change(index, "modelAnswer", e.target.value)}
                />
              </label>
            </section>
          ))}
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
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2"
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>
          <button
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2"
            disabled={busy}
            onClick={() => void save(false)}
            type="button"
          >
            Lưu nháp
          </button>
          <button
            className="rounded-lg bg-orange-600 px-4 py-2 font-bold text-white"
            disabled={busy}
            onClick={() => void save(true)}
            type="button"
          >
            Lưu và công bố
          </button>
        </footer>
      </dialog>
    </div>
  );
}

function TestPreview({
  test,
  onClose,
}: {
  test: WritingTestDto;
  onClose: () => void;
}) {
  const questions = [...test.questions].sort(
    (a, b) => a.part - b.part || a.sequenceNumber - b.sequenceNumber,
  );
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40">
      <dialog
        open
        aria-label="Chi tiết đề Writing"
        aria-modal="true"
        className="relative m-0 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--admin-border)] p-6">
          <div>
            <p className="text-xs font-bold text-[var(--admin-brand-red)]">
              {test.code} · {testStatusLabel[test.status]}
            </p>
            <h2 className="mt-1 text-xl font-bold">{test.title}</h2>
            {test.description && (
              <p className="mt-2 whitespace-pre-line text-sm text-[var(--admin-muted)]">
                {test.description}
              </p>
            )}
          </div>
          <button
            aria-label="Đóng chi tiết đề"
            className="rounded-lg p-2 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {questions.length === 0 && (
            <p className="text-sm text-[var(--admin-muted)]">
              Đề chưa có câu hỏi.
            </p>
          )}
          {questions.map((item) => {
            const question = fromSnapshot(item);
            return (
              <section
                className="rounded-xl border border-[var(--admin-border)] p-4"
                key={item.id}
              >
                <h3 className="mb-4 font-bold">
                  Part {item.part} · Câu {item.sequenceNumber}
                </h3>
                {question ? (
                  <AdminWritingPrompt question={question} />
                ) : (
                  <p className="text-sm text-red-700">
                    Không thể hiển thị nội dung câu hỏi này.
                  </p>
                )}
              </section>
            );
          })}
        </div>
        <footer className="flex justify-end border-t border-[var(--admin-border)] p-5">
          <button
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 font-bold"
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>
        </footer>
      </dialog>
    </div>
  );
}

export function AdminWritingTestsLive() {
  const [tests, setTests] = useState<WritingTestDto[]>([]);
  const [builder, setBuilder] = useState<WritingTestDto | "new" | null>(null);
  const [preview, setPreview] = useState<WritingTestDto | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const result = await listWritingTests(
          { query, status, pageNumber: page, pageSize: 20 },
          signal,
        );
        setTests(result.items);
        setTotalPages(result.totalPages);
        setError("");
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error ? cause.message : "Không thể tải đề.",
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [query, status, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load]);
  const openTest = async (test: WritingTestDto, mode: "preview" | "edit") => {
    try {
      const detail = await getWritingTest(test.id);
      const questions = await Promise.all(
        detail.questions.map(async (question) => {
          if (
            !question.exerciseId ||
            question.snapshotJson ||
            detail.status !== "DRAFT"
          )
            return question;
          const exercise = await getWritingExercise(question.exerciseId);
          const snapshot = Object.fromEntries(
            Object.entries(exercise).map(([key, value]) => [
              key.charAt(0).toUpperCase() + key.slice(1),
              value,
            ]),
          );
          return { ...question, snapshotJson: JSON.stringify(snapshot) };
        }),
      );
      setError("");
      if (mode === "edit") setBuilder({ ...detail, questions });
      else setPreview({ ...detail, questions });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải đề.");
    }
  };
  const changeStatus = async (test: WritingTestDto) => {
    const action =
      test.status === "DRAFT"
        ? "delete"
        : test.status === "PUBLISHED"
          ? "archive"
          : "restore";
    const confirmation =
      action === "delete"
        ? `Xóa vĩnh viễn đề nháp ${test.code}? Thao tác này không thể hoàn tác.`
        : action === "archive"
          ? `Lưu trữ đề ${test.code}? Học viên sẽ không thể bắt đầu lượt làm mới; lịch sử và các lượt đang làm vẫn được giữ.`
          : `Khôi phục đề ${test.code}? Đề sẽ hiển thị lại cho học viên.`;
    if (!window.confirm(confirmation)) return;
    setPendingId(test.id);
    setError("");
    setNotice("");
    try {
      if (action === "delete")
        await deleteWritingTestDraft(test.id, test.version);
      else if (action === "archive")
        await archiveWritingTest(test.id, test.version);
      else await restoreWritingTest(test.id, test.version);
      setNotice(
        action === "delete"
          ? "Đã xóa đề nháp."
          : action === "archive"
            ? "Đã lưu trữ đề Writing."
            : "Đã khôi phục đề Writing.",
      );
      if (page > 1 && tests.length === 1 && (action === "delete" || !!status))
        setPage(page - 1);
      else await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể cập nhật đề.",
      );
    } finally {
      setPendingId(null);
    }
  };
  return (
    <div>
      <AdminPageHeader
        title="Đề Writing"
        description="Tạo đề độc lập gồm 5 câu Part 1, 2 câu Part 2 và 1 câu Part 3."
        actions={
          <>
            <button
              className="rounded-lg border border-[var(--admin-border)] px-4 py-2 font-bold"
              onClick={() => setImportOpen(true)}
              type="button"
            >
              Import Excel
            </button>{" "}
            <button
              className="rounded-lg bg-orange-600 px-4 py-2 font-bold text-white"
              onClick={() => setBuilder("new")}
              type="button"
            >
              + Tạo đề Writing
            </button>
          </>
        }
      />
      <ContentTabs section="tests" skill="writing" />
      {notice && <AdminNotice>{notice}</AdminNotice>}
      {error && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          aria-label="Tìm đề Writing"
          className="rounded-lg border border-[var(--admin-border)] bg-white p-2"
          placeholder="Tìm mã hoặc tên đề"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Lọc trạng thái đề"
          className="rounded-lg border border-[var(--admin-border)] bg-white p-2"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="PUBLISHED">Đã công bố</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-[var(--admin-surface-muted)] text-xs text-[var(--admin-muted)]">
            <tr>
              <th className="p-4">Mã đề</th>
              <th>Tên đề</th>
              <th>Câu hỏi</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr
                className="border-t border-[var(--admin-border)]"
                key={test.id}
              >
                <td className="p-4">{test.code}</td>
                <td>{test.title}</td>
                <td>{test.questions.length}/8</td>
                <td>{testStatusLabel[test.status]}</td>
                <td>
                  <button
                    className="mr-4 font-semibold text-[var(--admin-ink-soft)]"
                    onClick={() => void openTest(test, "preview")}
                    type="button"
                  >
                    Xem
                  </button>
                  {test.status === "DRAFT" && (
                    <button
                      className="mr-4 text-orange-700"
                      onClick={() => void openTest(test, "edit")}
                      type="button"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                  <button
                    className="font-semibold text-red-700 disabled:opacity-40"
                    disabled={pendingId !== null}
                    onClick={() => void changeStatus(test)}
                    type="button"
                  >
                    {test.status === "DRAFT"
                      ? "Xóa"
                      : test.status === "PUBLISHED"
                        ? "Lưu trữ"
                        : "Khôi phục"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-sm">Đang tải đề Writing…</p>}
        {!loading && tests.length === 0 && !error && (
          <p className="p-6 text-sm">Chưa có đề Writing.</p>
        )}
        <div className="flex items-center gap-3 border-t border-[var(--admin-border)] p-4 text-sm">
          <button
            className="rounded border border-[var(--admin-border)] px-3 py-1 disabled:opacity-40"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
            type="button"
          >
            Trang trước
          </button>
          <span>Trang {page}</span>
          <button
            className="rounded border border-[var(--admin-border)] px-3 py-1 disabled:opacity-40"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(page + 1)}
            type="button"
          >
            Trang sau
          </button>
        </div>
      </div>
      {builder && (
        <TestBuilder
          initial={builder === "new" ? null : builder}
          onClose={() => setBuilder(null)}
          onSaved={(message) => {
            setBuilder(null);
            setNotice(message);
            void load();
          }}
        />
      )}
      {preview && (
        <TestPreview test={preview} onClose={() => setPreview(null)} />
      )}
      {importOpen && (
        <ImportTest
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            setNotice("Đã import đề Writing ở trạng thái nháp.");
            void load();
          }}
        />
      )}
    </div>
  );
}
