export type PracticeNavKey =
  | "exam-lr"
  | "exam-speaking"
  | "exam-writing"
  | "exercise-lr"
  | "exercise-speaking"
  | "exercise-writing"
  | "pronunciation"
  | "history";

export interface PracticeNavLink {
  key: PracticeNavKey;
  label: string;
  href: string;
}

export interface PracticeNavGroup {
  key: string;
  label: string;
  links: readonly PracticeNavLink[];
}

export const practiceNavGroups: readonly PracticeNavGroup[] = [
  {
    key: "exam",
    label: "Đề thi",
    links: [
      {
        key: "exam-lr",
        label: "Listening & Reading",
        href: "/listening-reading",
      },
      {
        key: "exam-speaking",
        label: "Speaking",
        href: "/speaking",
      },
      { key: "exam-writing", label: "Writing", href: "/writing" },
    ],
  },
  {
    key: "exercise",
    label: "Bài tập",
    links: [
      {
        key: "exercise-lr",
        label: "Listening & Reading",
        href: "/listening/practice/1",
      },
      {
        key: "exercise-speaking",
        label: "Speaking",
        href: "/speaking/parts/1",
      },
      {
        key: "exercise-writing",
        label: "Writing",
        href: "/writing/practice/1",
      },
    ],
  },
];

export const practiceNavLinks: readonly PracticeNavLink[] = [
  {
    key: "pronunciation",
    label: "Phát âm",
    href: "/pronunciation",
  },
  { key: "history", label: "Lịch sử", href: "/history" },
];

const rules: readonly [RegExp, PracticeNavKey][] = [
  [/^\/(listening|reading)\/practice(\/|$)/, "exercise-lr"],
  [/^\/speaking\/(parts|exercises)(\/|$)/, "exercise-speaking"],
  [/^\/writing\/practice(\/|$)/, "exercise-writing"],
  [/^\/(listening-reading|listening|reading)(\/|$)/, "exam-lr"],
  [/^\/exams\/lr(\/|$)/, "exam-lr"],
  [/^\/speaking(\/|$)/, "exam-speaking"],
  [/^\/writing(\/|$)/, "exam-writing"],
  [/^\/pronunciation(\/|$)/, "pronunciation"],
  [/^\/history(\/|$)/, "history"],
];

export function activeNavKey(pathname: string | null): PracticeNavKey | null {
  if (!pathname) return null;
  return rules.find(([pattern]) => pattern.test(pathname))?.[1] ?? null;
}
