export interface PracticeNavLink {
  key: string;
  label: string;
  short: string;
  href: string;
}

export interface PracticeNavGroup {
  key: string;
  label: string;
  short: string;
  links: readonly PracticeNavLink[];
}

export const practiceNavGroups: readonly PracticeNavGroup[] = [
  {
    key: "exam",
    label: "Đề thi",
    short: "Thi",
    links: [
      {
        key: "exam-lr",
        label: "Listening & Reading",
        short: "L&R",
        href: "/listening-reading",
      },
      {
        key: "exam-speaking",
        label: "Speaking",
        short: "S",
        href: "/speaking",
      },
      { key: "exam-writing", label: "Writing", short: "W", href: "/writing" },
    ],
  },
  {
    key: "exercise",
    label: "Bài tập",
    short: "Tập",
    links: [
      {
        key: "exercise-lr",
        label: "Listening & Reading",
        short: "L&R",
        href: "/listening/practice/1",
      },
      {
        key: "exercise-speaking",
        label: "Speaking",
        short: "S",
        href: "/speaking/parts/1",
      },
      {
        key: "exercise-writing",
        label: "Writing",
        short: "W",
        href: "/writing/practice/1",
      },
    ],
  },
];

export const practiceNavLinks: readonly PracticeNavLink[] = [
  {
    key: "pronunciation",
    label: "Phát âm",
    short: "IPA",
    href: "/pronunciation",
  },
  { key: "history", label: "Lịch sử", short: "Sử", href: "/history" },
];

const rules: readonly [RegExp, string][] = [
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

export function activeNavKey(pathname: string | null): string | null {
  if (!pathname) return null;
  return rules.find(([pattern]) => pattern.test(pathname))?.[1] ?? null;
}
