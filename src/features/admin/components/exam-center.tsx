"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminExamApiError,
  createReadingExam,
  createWritingTest,
  getReadingExams,
  getScoreProfiles,
  getWritingTests,
  importReadingExam,
} from "@/features/admin/exam-api";
import {
  formatAdminDate,
  parseExamListQuery,
  type ExamKind,
  type ReadingExamPage,
  type ScoreProfile,
  type WritingTestPage,
} from "@/features/admin/exam-management";
import { ExamIcon } from "./exam-icon";

type ListResult = ReadingExamPage | WritingTestPage;

function statusLabel(status: string) {
  return status.toUpperCase() === "PUBLISHED" || status === "Published"
    ? "Đã xuất bản"
    : "Bản nháp";
}

function StatusBadge({ status }: { status: string }) {
  const published =
    status.toUpperCase() === "PUBLISHED" || status === "Published";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        published
          ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]"
          : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"
      }`}
    >
      <i
        className={`size-1.5 rounded-full ${published ? "bg-current" : "bg-current"}`}
      />
      {statusLabel(status)}
    </span>
  );
}

export function ExamCenter() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const query = useMemo(
    () => parseExamListQuery(new URLSearchParams(paramsString)),
    [paramsString],
  );
  const [result, setResult] = useState<ListResult | null>(null);
  const [error, setError] = useState<AdminExamApiError | null>(null);
  const [retry, setRetry] = useState(0);
  const [completedRequestKey, setCompletedRequestKey] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [profiles, setProfiles] = useState<ScoreProfile[] | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(paramsString);
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [paramsString, pathname, router],
  );

  const requestKey = `${paramsString}:${retry}`;
  const loading = completedRequestKey !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    const request =
      query.kind === "reading"
        ? getReadingExams(
            {
              status: query.status,
              page: query.page,
              pageSize: query.pageSize,
            },
            controller.signal,
          )
        : getWritingTests(
            {
              q: query.q,
              status: query.status,
              page: query.page,
              pageSize: query.pageSize,
            },
            controller.signal,
          );
    request
      .then((value) => {
        if (controller.signal.aborted) return;
        setResult(value);
        setError(null);
        setCompletedRequestKey(requestKey);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          reason instanceof AdminExamApiError
            ? reason
            : new AdminExamApiError(502, "Không thể tải danh sách đề thi."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCompletedRequestKey(requestKey);
      });
    return () => controller.abort();
  }, [query, requestKey]);

  async function openCreate() {
    setFormError(null);
    setCreateOpen(true);
    if (query.kind !== "reading" || profiles) return;
    setProfileError(null);
    try {
      setProfiles(await getScoreProfiles());
    } catch (reason) {
      setProfileError(
        reason instanceof Error ? reason.message : "Không thể tải barem điểm.",
      );
    }
  }

  async function createExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setFormError(null);
    try {
      if (query.kind === "reading") {
        const created = await createReadingExam({
          code: String(data.get("code") ?? "").trim(),
          title: String(data.get("title") ?? "").trim(),
          scoreProfileId: String(data.get("scoreProfileId") ?? ""),
        });
        router.push(
          `/admin/exams/reading/${created.examId}/${created.revisionId}`,
        );
      } else {
        const created = await createWritingTest({
          code: String(data.get("code") ?? "").trim(),
          title: String(data.get("title") ?? "").trim(),
          description: String(data.get("description") ?? "").trim() || null,
          questions: [],
        });
        router.push(`/admin/exams/writing/${created.id}`);
      }
    } catch (reason) {
      setFormError(
        reason instanceof Error ? reason.message : "Không thể khởi tạo đề thi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function importExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const workbook = data.get("workbook");
    const masterAudio = data.get("masterAudio");
    if (!(workbook instanceof File) || !(masterAudio instanceof File)) {
      setFormError(
        "Chọn cả workbook XLSX và file master audio trước khi import.",
      );
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await importReadingExam(workbook, masterAudio);
      router.push(
        `/admin/exams/reading/${created.examId}/${created.revisionId}`,
      );
    } catch (reason) {
      setFormError(
        reason instanceof Error ? reason.message : "Không thể import đề.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const items = result?.items ?? [];
  const totalCount = result?.totalCount ?? 0;
  const totalPages = result?.totalPages ?? 0;
  const first = totalCount === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const last = Math.min(query.page * query.pageSize, totalCount);

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
            QUẢN TRỊ / KHO ĐỀ
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">
            Quản lý đề thi
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
            Lắp ráp, kiểm duyệt và công bố đề Reading cùng đề Writing từ dữ liệu
            đã được quản trị.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {query.kind === "reading" && (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-bold text-[var(--admin-ink-soft)] transition hover:border-[var(--admin-brand-orange)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
              onClick={() => {
                setFormError(null);
                setImportOpen(true);
              }}
              type="button"
            >
              <ExamIcon className="size-4" name="import" />
              Import đề
            </button>
          )}
          <button
            className="admin-primary-action inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
            onClick={openCreate}
            type="button"
          >
            <ExamIcon className="size-4" name="plus" />
            Tạo đề mới
          </button>
        </div>
      </div>

      <div
        aria-label="Loại đề thi"
        className="mb-5 grid max-w-xl grid-cols-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1"
        role="tablist"
      >
        {(
          [
            ["reading", "Reading", "Part 5–7"],
            ["writing", "Writing", "Part 1–3"],
          ] as const
        ).map(([kind, label, subtitle]) => (
          <button
            aria-selected={query.kind === kind}
            className={`rounded-lg px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)] ${
              query.kind === kind
                ? "admin-brand-gradient-fill text-white shadow-[var(--admin-action-shadow)]"
                : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)]"
            }`}
            key={kind}
            onClick={() =>
              updateQuery({ kind, status: null, q: null, page: null })
            }
            role="tab"
            type="button"
          >
            <span className="block text-sm font-bold">{label}</span>
            <span className="mt-0.5 block text-[11px] opacity-75">
              {subtitle}
            </span>
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_16px_42px_rgb(73_43_31/4%)]">
        <div className="flex flex-wrap gap-3 border-b border-[var(--admin-border)] bg-[linear-gradient(100deg,#fffdfc,#fff8f3)] p-4">
          <label className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-white px-3 text-[var(--admin-muted)] focus-within:border-[var(--admin-brand-orange)] focus-within:ring-2 focus-within:ring-orange-100">
            <ExamIcon className="size-4" name="search" />
            <input
              aria-label="Tìm kiếm đề thi"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--admin-ink)] outline-none placeholder:text-[var(--admin-muted)]"
              defaultValue={query.q}
              key={`${query.kind}-${query.q}`}
              onChange={(event) =>
                updateQuery({ q: event.target.value, page: null })
              }
              placeholder="Tìm theo mã đề hoặc tên đề..."
            />
          </label>
          <select
            aria-label="Lọc trạng thái đề thi"
            className="h-10 rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm font-medium text-[var(--admin-ink-soft)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
            onChange={(event) =>
              updateQuery({ status: event.target.value || null, page: null })
            }
            value={query.status === "ALL" ? "" : query.status}
          >
            <option value="">Trạng thái: Tất cả</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
          </select>
        </div>

        {loading ? (
          <div aria-busy="true" className="space-y-3 p-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                className="h-14 animate-pulse rounded-lg bg-[var(--admin-skeleton)]"
                key={index}
              />
            ))}
          </div>
        ) : error ? (
          <div
            className="m-5 rounded-xl border border-[var(--admin-danger)]/20 bg-[var(--admin-danger-soft)] p-5 text-[var(--admin-danger)]"
            role="alert"
          >
            <p className="font-bold">Không thể tải danh sách đề thi</p>
            <p className="mt-1 text-sm">{error.message}</p>
            <button
              className="mt-3 rounded-lg border border-current px-3 py-2 text-sm font-bold"
              onClick={() => setRetry((value) => value + 1)}
              type="button"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]">
              <ExamIcon className="size-6" name="book" />
            </span>
            <h2 className="mt-4 text-base font-bold text-[var(--admin-ink)]">
              Chưa có đề {query.kind === "reading" ? "Reading" : "Writing"} nào
              phù hợp
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[var(--admin-muted)]">
              Bắt đầu bằng cách tạo bản nháp mới, sau đó lắp ráp nội dung trước
              khi xuất bản.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left">
              <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[10px] font-bold tracking-[0.11em] text-[var(--admin-muted)]">
                <tr>
                  <th className="px-5 py-3">MÃ ĐỀ</th>
                  <th className="px-5 py-3">TÊN ĐỀ</th>
                  <th className="px-5 py-3">PHẠM VI</th>
                  <th className="px-5 py-3">NỘI DUNG</th>
                  <th className="px-5 py-3">CẬP NHẬT</th>
                  <th className="px-5 py-3">TRẠNG THÁI</th>
                  <th aria-label="Thao tác" className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {items.map((item) => {
                  const reading = "examId" in item;
                  const href = reading
                    ? `/admin/exams/reading/${item.examId}/${item.revisionId}`
                    : `/admin/exams/writing/${item.id}`;
                  const count = reading
                    ? `Revision ${item.versionNumber} · 200 slots`
                    : `${item.questions.length}/8 bài tập`;
                  const date = reading ? item.createdAtUtc : item.updatedAtUtc;
                  return (
                    <tr
                      className="group hover:bg-[var(--admin-row-hover)]"
                      key={reading ? item.revisionId : item.id}
                    >
                      <td className="px-5 py-4 text-sm font-bold text-[var(--admin-brand-red)]">
                        {item.code}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[var(--admin-ink)]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                          {query.kind === "reading"
                            ? "TOEIC Listening & Reading"
                            : "TOEIC Writing"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[var(--admin-nav-active)] px-2.5 py-1 text-xs font-bold text-[var(--admin-brand-red)]">
                          {query.kind === "reading" ? "Part 5–7" : "Part 1–3"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--admin-ink-soft)]">
                        {count}
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--admin-muted)]">
                        {formatAdminDate(date)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          aria-label={`Mở ${item.code}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-ink-soft)] transition hover:border-[var(--admin-brand-orange)] hover:text-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
                          href={href}
                        >
                          <ExamIcon className="size-4" name="edit" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalCount > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] px-5 py-3 text-xs text-[var(--admin-muted)]">
            <span>
              Hiển thị {first}–{last} / {totalCount.toLocaleString("vi-VN")}
            </span>
            <nav aria-label="Phân trang" className="flex items-center gap-1">
              <button
                aria-label="Trang trước"
                className="grid size-8 place-items-center rounded-md border border-[var(--admin-border)] disabled:opacity-40"
                disabled={query.page <= 1}
                onClick={() => updateQuery({ page: String(query.page - 1) })}
                type="button"
              >
                <ExamIcon className="size-4" name="chevron-left" />
              </button>
              <span className="grid size-8 place-items-center rounded-md bg-[var(--admin-nav-active)] font-bold text-[var(--admin-brand-red)]">
                {query.page}
              </span>
              <span className="px-1">/ {Math.max(1, totalPages)}</span>
              <button
                aria-label="Trang sau"
                className="grid size-8 place-items-center rounded-md border border-[var(--admin-border)] disabled:opacity-40"
                disabled={query.page >= totalPages}
                onClick={() => updateQuery({ page: String(query.page + 1) })}
                type="button"
              >
                <ExamIcon className="size-4" name="chevron-right" />
              </button>
            </nav>
          </footer>
        )}
      </section>

      {createOpen && (
        <CreateModal
          kind={query.kind}
          profiles={profiles}
          profileError={profileError}
          error={formError}
          submitting={submitting}
          onClose={() => setCreateOpen(false)}
          onSubmit={createExam}
        />
      )}
      {importOpen && (
        <ImportModal
          error={formError}
          submitting={submitting}
          onClose={() => setImportOpen(false)}
          onSubmit={importExam}
        />
      )}
    </div>
  );
}

function CreateModal({
  kind,
  profiles,
  profileError,
  error,
  submitting,
  onClose,
  onSubmit,
}: {
  kind: ExamKind;
  profiles: ScoreProfile[] | null;
  profileError: string | null;
  error: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const availableProfiles =
    profiles?.filter((profile) => profile.isComplete) ?? [];
  return (
    <Modal
      title={kind === "reading" ? "Khởi tạo đề Reading" : "Khởi tạo đề Writing"}
      subtitle={
        kind === "reading"
          ? "Tạo revision L&R rồi biên tập riêng các Part Reading 5–7."
          : "Tạo bản nháp, sau đó chọn đủ 5–2–1 bài tập đã xuất bản."
      }
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <label className="block text-sm font-bold text-[var(--admin-ink)]">
            Mã đề
            <input
              className="mt-1.5 h-11 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 font-medium outline-none focus:border-[var(--admin-brand-orange)]"
              maxLength={64}
              name="code"
              placeholder={kind === "reading" ? "LR-2026-001" : "WR-2026-001"}
              required
            />
          </label>
          <label className="block text-sm font-bold text-[var(--admin-ink)]">
            Tên đề
            <input
              className="mt-1.5 h-11 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 font-medium outline-none focus:border-[var(--admin-brand-orange)]"
              maxLength={200}
              name="title"
              placeholder="Placement test tháng 10"
              required
            />
          </label>
          {kind === "reading" ? (
            <label className="block text-sm font-bold text-[var(--admin-ink)]">
              Barem quy đổi điểm
              <select
                className="mt-1.5 h-11 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 font-medium outline-none focus:border-[var(--admin-brand-orange)]"
                disabled={availableProfiles.length === 0}
                name="scoreProfileId"
                required
              >
                <option value="">
                  {profiles === null
                    ? "Đang tải barem..."
                    : availableProfiles.length === 0
                      ? "Chưa có barem đầy đủ"
                      : "Chọn barem"}
                </option>
                {availableProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} · {profile.mappingCount}/202 mốc
                  </option>
                ))}
              </select>
              {profileError && (
                <span className="mt-1 block text-xs text-[var(--admin-danger)]">
                  {profileError}
                </span>
              )}
              {profiles && availableProfiles.length === 0 && (
                <span className="mt-1 block text-xs text-[var(--admin-warning)]">
                  Backend chưa có barem hoàn chỉnh nên chưa thể tạo đề Reading.
                </span>
              )}
            </label>
          ) : (
            <label className="block text-sm font-bold text-[var(--admin-ink)]">
              Mô tả ngắn
              <textarea
                className="mt-1.5 w-full rounded-lg border border-[var(--admin-border)] bg-white p-3 font-medium outline-none focus:border-[var(--admin-brand-orange)]"
                maxLength={2000}
                name="description"
                placeholder="Mục tiêu và phạm vi của đề..."
                rows={3}
              />
            </label>
          )}
          {error && (
            <p
              className="rounded-lg bg-[var(--admin-danger-soft)] p-3 text-sm text-[var(--admin-danger)]"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <ModalFooter
          busy={submitting}
          disabled={kind === "reading" && availableProfiles.length === 0}
          label="Tạo và tiếp tục"
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

function ImportModal({
  error,
  submitting,
  onClose,
  onSubmit,
}: {
  error: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal
      title="Import đề Reading"
      subtitle="Backend kiểm tra workbook và master audio trước khi tạo revision Draft."
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <label className="block rounded-xl border border-dashed border-[var(--admin-brand-orange)]/50 bg-[var(--admin-nav-active)]/45 p-4 text-sm font-bold text-[var(--admin-ink)]">
            Workbook XLSX
            <input
              accept=".xlsx"
              className="mt-2 block w-full text-xs font-medium text-[var(--admin-muted)]"
              name="workbook"
              required
              type="file"
            />
          </label>
          <label className="block rounded-xl border border-dashed border-[var(--admin-brand-orange)]/50 bg-[var(--admin-nav-active)]/45 p-4 text-sm font-bold text-[var(--admin-ink)]">
            Master audio MP3/WAV
            <input
              accept="audio/mpeg,audio/wav,.mp3,.wav"
              className="mt-2 block w-full text-xs font-medium text-[var(--admin-muted)]"
              name="masterAudio"
              required
              type="file"
            />
          </label>
          <p className="text-xs leading-5 text-[var(--admin-muted)]">
            Workbook tối đa 10 MiB; master audio tối đa 100 MiB. Import tạo
            Draft, không xuất bản trực tiếp.
          </p>
          {error && (
            <p
              className="rounded-lg bg-[var(--admin-danger-soft)] p-3 text-sm text-[var(--admin-danger)]"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <ModalFooter
          busy={submitting}
          label="Import và mở bản nháp"
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <button
        aria-label="Đóng hộp thoại"
        className="absolute inset-0 bg-stone-950/35 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <dialog
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl"
        open
      >
        <button
          aria-label="Đóng"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)]"
          onClick={onClose}
          type="button"
        >
          <ExamIcon className="size-5" name="close" />
        </button>
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]">
          <ExamIcon className="size-5" name="file" />
        </span>
        <h2 className="mt-4 pr-10 text-xl font-bold text-[var(--admin-ink)]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
          {subtitle}
        </p>
        <div className="mt-5">{children}</div>
      </dialog>
    </div>
  );
}

function ModalFooter({
  busy,
  disabled,
  label,
  onClose,
}: {
  busy: boolean;
  disabled?: boolean;
  label: string;
  onClose: () => void;
}) {
  return (
    <div className="mt-6 flex justify-end gap-2 border-t border-[var(--admin-border)] pt-4">
      <button
        className="h-10 rounded-lg px-4 text-sm font-bold text-[var(--admin-ink-soft)] hover:bg-[var(--admin-surface-muted)]"
        onClick={onClose}
        type="button"
      >
        Hủy
      </button>
      <button
        className="admin-primary-action h-10 rounded-lg px-4 text-sm font-bold"
        disabled={busy || disabled}
        type="submit"
      >
        {busy ? "Đang xử lý..." : label}
      </button>
    </div>
  );
}
