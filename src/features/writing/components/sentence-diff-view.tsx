export interface DiffToken {
  type: "equal" | "removed" | "added";
  text: string;
}

function tokenize(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

/**
 * Word-level diff based on a longest-common-subsequence table.
 * Every token carries its leading space so `tokens.map((t) => t.text).join("")`
 * still reads like the original sentence.
 */
export function computeWordDiff(
  original: string,
  suggested: string,
): DiffToken[] {
  const before = tokenize(original);
  const after = tokenize(suggested);
  const rows = before.length;
  const columns = after.length;

  const lcs: number[][] = Array.from({ length: rows + 1 }, () =>
    new Array<number>(columns + 1).fill(0),
  );
  for (let row = rows - 1; row >= 0; row -= 1) {
    for (let column = columns - 1; column >= 0; column -= 1) {
      lcs[row][column] =
        before[row] === after[column]
          ? lcs[row + 1][column + 1] + 1
          : Math.max(lcs[row + 1][column], lcs[row][column + 1]);
    }
  }

  const raw: { type: DiffToken["type"]; word: string }[] = [];
  let row = 0;
  let column = 0;
  while (row < rows && column < columns) {
    if (before[row] === after[column]) {
      raw.push({ type: "equal", word: before[row] });
      row += 1;
      column += 1;
    } else if (lcs[row + 1][column] >= lcs[row][column + 1]) {
      raw.push({ type: "removed", word: before[row] });
      row += 1;
    } else {
      raw.push({ type: "added", word: after[column] });
      column += 1;
    }
  }
  while (row < rows) {
    raw.push({ type: "removed", word: before[row] });
    row += 1;
  }
  while (column < columns) {
    raw.push({ type: "added", word: after[column] });
    column += 1;
  }

  return raw.map((token, index) => ({
    type: token.type,
    text: index === 0 ? token.word : ` ${token.word}`,
  }));
}

export function SentenceDiffView({
  original,
  suggested,
}: {
  original: string;
  suggested: string;
}) {
  const tokens = computeWordDiff(original, suggested);

  return (
    <div
      aria-label="Sentence comparison and suggested revision"
      className="rounded-xl border border-[#EEE9E6] bg-[#FAF7F5] p-4"
      data-testid="writing-sentence-diff"
      // Phase 1 test sentence-diff-view.test.tsx:60 requires explicit role="region" on the diff container.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="region"
    >
      <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Sentence comparison and suggested revision
      </h4>
      <p className="mt-2 text-sm leading-7 text-slate-800">
        {tokens.map((token, index) =>
          token.type === "removed" ? (
            <del
              className="rounded bg-red-50 px-0.5 text-red-700 decoration-red-400"
              key={index}
            >
              {token.text}
            </del>
          ) : token.type === "added" ? (
            <ins
              className="rounded bg-emerald-50 px-0.5 text-emerald-800 no-underline"
              key={index}
            >
              {token.text}
            </ins>
          ) : (
            <span key={index}>{token.text}</span>
          ),
        )}
      </p>
      <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>
          <span className="line-through decoration-red-400">Removed</span>
        </span>
        <span>
          <span className="text-emerald-800">Suggested revision</span>
        </span>
      </p>
    </div>
  );
}
