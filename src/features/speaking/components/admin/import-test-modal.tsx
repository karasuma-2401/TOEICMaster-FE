"use client";

import { useState } from "react";
import {
  ExcelFileSlot,
  ExcelImportDialog,
  ImportSpec,
} from "@/features/admin/components/content/admin-excel-import";
import { importSpeakingTest } from "@/features/speaking/admin-api";
import { SpeakingApiError } from "@/features/speaking/http";

/** Turns `rows[5].Passage` into a label the admin can find in the workbook. */
function fieldLabel(key: string) {
  const row = /^rows\[(\d+)\]\.(.+)$/i.exec(key);
  if (row) return `Dòng ${row[1]} · ${row[2]}`;
  return /^(exercises|content)$/i.test(key) ? "" : key;
}

function importFailure(cause: unknown) {
  if (!(cause instanceof SpeakingApiError))
    return {
      message: cause instanceof Error ? cause.message : "Không thể import đề.",
      details: [],
    };
  const details = Object.entries(cause.fieldErrors).map(([key, message]) => {
    const label = fieldLabel(key);
    return label ? `${label}: ${message}` : message;
  });
  if (details.length > 0)
    return {
      message: "File Excel chưa hợp lệ. Chưa có dữ liệu nào được tạo.",
      details,
    };
  return {
    message: cause.status === 409 ? "Mã đề đã tồn tại." : cause.message,
    details: [],
  };
}

/** Uploads a workbook; the backend creates the whole draft test or nothing. */
export function ImportTestModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (testId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const reset = (next: File | null, message: string | null) => {
    setFile(next);
    setError(message);
    setDetails([]);
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDetails([]);
    try {
      const { test } = await importSpeakingTest(file);
      onImported(test.id);
    } catch (cause) {
      const failure = importFailure(cause);
      setError(failure.message);
      setDetails(failure.details);
      setBusy(false);
    }
  };

  return (
    <ExcelImportDialog
      ariaLabel="Import đề Speaking từ Excel"
      busy={busy}
      canSubmit={Boolean(file)}
      error={error}
      errorDetails={details}
      onClose={onClose}
      onSubmit={() => void submit()}
      submitLabel={busy ? "Đang import…" : "Import bản nháp"}
      summary="Tạo 7 bài tập và 1 đề nháp từ một file."
      title="Import đề Speaking"
    >
      <ExcelFileSlot
        busy={busy}
        busyLabel="Đang import…"
        file={file}
        maxMb={16}
        onReject={(message) => reset(null, message)}
        onSelect={(selected) => reset(selected, null)}
      />
      <ImportSpec
        rows={[
          ["Sheet", "Test, Exercises"],
          ["Số bài", "7 dòng · Part 1–5: 2/2/1/1/1"],
          ["Ảnh Part 2", "Place over Cells · JPEG, PNG · ≤ 5 MB"],
        ]}
      />
    </ExcelImportDialog>
  );
}
