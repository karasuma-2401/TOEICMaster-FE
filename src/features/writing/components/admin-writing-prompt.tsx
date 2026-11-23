"use client";

import { useState } from "react";

type Prompt = {
  part: 1 | 2 | 3;
  imageAssetId?: string | null;
  imageAlt?: string | null;
  keywordOne?: string | null;
  keywordTwo?: string | null;
  sender?: string | null;
  recipient?: string | null;
  subject?: string | null;
  emailBody?: string | null;
  directions?: string | null;
  prompt?: string | null;
  minimumWordCount?: number | null;
  outline?: string | null;
};

function PromptImage({ id, alt }: { id: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <p
        className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
        role="alert"
      >
        Could not load the prompt image. Please check the image and storage
        connection.
      </p>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Admin media is served through the authenticated proxy.
    <img
      alt={alt || "Writing prompt image"}
      className="max-h-80 w-full rounded-xl bg-white object-contain"
      onError={() => setFailed(true)}
      src={`/api/admin/writing/media/${encodeURIComponent(id)}`}
    />
  );
}

export function AdminWritingPrompt({ question }: { question: Prompt }) {
  if (question.part === 1)
    return (
      <div>
        {question.imageAssetId ? (
          <PromptImage
            key={question.imageAssetId}
            id={question.imageAssetId}
            alt={question.imageAlt ?? ""}
          />
        ) : (
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            No prompt image yet.
          </p>
        )}
        <p className="mt-4 text-sm text-[var(--admin-ink-soft)]">
          Write one sentence describing the picture using both of the following
          words:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[question.keywordOne, question.keywordTwo].map((word, index) => (
            <span
              className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-900"
              key={index}
            >
              {word || "No keyword yet"}
            </span>
          ))}
        </div>
      </div>
    );
  if (question.part === 2)
    return (
      <article className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-white text-sm leading-6">
        <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 bg-[var(--admin-surface-muted)] p-4">
          <dt className="font-bold">From:</dt>
          <dd>{question.sender || "-"}</dd>
          <dt className="font-bold">To:</dt>
          <dd>{question.recipient || "-"}</dd>
          <dt className="font-bold">Subject:</dt>
          <dd>{question.subject || "-"}</dd>
        </dl>
        <p className="whitespace-pre-line p-4">
          {question.emailBody || "No email content yet."}
        </p>
        <p className="mx-4 mb-4 rounded-lg bg-orange-50 p-3 text-orange-900">
          <strong>Directions: </strong>
          {question.directions || "No response directions yet."}
        </p>
      </article>
    );
  return (
    <div>
      <p className="whitespace-pre-line font-semibold">
        {question.prompt || "No prompt yet."}
      </p>
      {question.outline && (
        <p className="mt-3 whitespace-pre-line text-sm">{question.outline}</p>
      )}
      {question.minimumWordCount != null && (
        <p className="mt-3 text-sm text-[var(--admin-muted)]">
          Minimum {question.minimumWordCount} words
        </p>
      )}
    </div>
  );
}
