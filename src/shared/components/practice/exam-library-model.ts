export type ExamDifficulty = "EASY" | "MEDIUM" | "HARD";

export const difficultyLabels: Record<ExamDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

/** A card either links to its page or starts an attempt in place. */
export type ExamAction =
  | { href: string }
  | { onStart: () => void; starting: boolean; disabled: boolean };

/** One published test or exercise as shown in a skill's list. */
export interface ExamLibraryItem {
  id: string;
  code: string;
  title: string;
  /** Short label on the card's chip, e.g. `5 Parts` or `Part 1 · Easy`. */
  badge: string;
  /** Size line, e.g. `11 questions · ~20 min · 0-200 pts`. */
  meta: string;
  action: ExamAction;
  /** Value the list is ordered by. */
  sortKey: string;
  /** Null where the backend has no difficulty for this kind of item. */
  difficulty: ExamDifficulty | null;
  /** Finished attempts by the current learner. */
  attemptCount: number;
  bestScore: number | null;
}

export type ExamStatusFilter = "ALL" | "DONE" | "TODO";
export type ExamDifficultyFilter = "ALL" | ExamDifficulty;
export type ExamSort = "ASC" | "DESC";

export interface ExamResult {
  attemptCount: number;
  bestScore: number | null;
}

/** Groups finished attempts by the test or exercise they belong to. */
export function summarizeExamAttempts(
  attempts: { id: string; score: number | null }[],
) {
  const results = new Map<string, ExamResult>();
  for (const { id, score } of attempts) {
    const current = results.get(id);
    const best = current?.bestScore ?? null;
    results.set(id, {
      attemptCount: (current?.attemptCount ?? 0) + 1,
      bestScore:
        score !== null && (best === null || score > best) ? score : best,
    });
  }
  return results;
}

export function bestExamScore(items: ExamLibraryItem[]) {
  return items.reduce<number | null>(
    (best, item) =>
      item.bestScore !== null && (best === null || item.bestScore > best)
        ? item.bestScore
        : best,
    null,
  );
}

export function selectExams(
  items: ExamLibraryItem[],
  {
    query,
    status,
    difficulty,
    sort,
  }: {
    query: string;
    status: ExamStatusFilter;
    difficulty: ExamDifficultyFilter;
    sort: ExamSort;
  },
) {
  const needle = query.trim().toLocaleLowerCase("en-US");
  return items
    .filter((item) =>
      `${item.title} ${item.code}`.toLocaleLowerCase("en-US").includes(needle),
    )
    .filter(
      (item) =>
        status === "ALL" || (status === "DONE") === item.attemptCount > 0,
    )
    .filter((item) => difficulty === "ALL" || item.difficulty === difficulty)
    .toSorted((a, b) => {
      const order = a.sortKey.localeCompare(b.sortKey, "en-US", {
        numeric: true,
      });
      return sort === "DESC" ? -order : order;
    });
}
