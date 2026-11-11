import { UserMenu } from "@/features/user/components/user-menu";
import {
  ExamLibrary,
  type ExamLibrarySkill,
} from "@/shared/components/practice/exam-library";
import { SkillHeader } from "@/shared/components/practice/skill-header";

const skills = {
  listening: {
    id: "listening",
    name: "Listening",
    tagline: "Luyện nghe theo 4 Part với audio phát liên tục như phòng thi.",
    format: "100 câu · 45 phút · 5–495 điểm · 4 Parts",
    maxScore: 495,
    examHref: "/listening",
    exerciseHref: "/listening/practice/1",
  },
  reading: {
    id: "reading",
    name: "Reading",
    tagline: "Luyện đọc theo 3 Part và quản lý thời gian cho 100 câu hỏi.",
    format: "100 câu · 75 phút · 5–495 điểm · 3 Parts",
    maxScore: 495,
    examHref: "/reading",
    exerciseHref: "/reading/practice/5",
  },
} as const satisfies Record<string, ExamLibrarySkill>;

type Skill = keyof typeof skills;

const practiceParts = {
  listening: {
    1: { title: "Mô tả tranh", questions: 6 },
    2: { title: "Hỏi – đáp", questions: 25 },
    3: { title: "Đoạn hội thoại", questions: 39 },
    4: { title: "Bài nói ngắn", questions: 30 },
  },
  reading: {
    5: { title: "Hoàn thành câu", questions: 30 },
    6: { title: "Hoàn thành đoạn văn", questions: 16 },
    7: { title: "Đọc hiểu", questions: 54 },
  },
} as const;

type PartInfo = { title: string; questions: number };

const partsOf = (skill: Skill) =>
  Object.entries(practiceParts[skill]) as [string, PartInfo][];

export function isListeningReadingPart(skill: Skill, part: string) {
  return part in practiceParts[skill];
}

/** The backend has no learner endpoints for these skills yet, so the list stays empty. */
export function ListeningReadingLibrary({ skill }: { skill: Skill }) {
  const { name } = skills[skill];
  return (
    <ExamLibrary
      emptyDescription={`Phần làm bài ${name} đang được hoàn thiện. Trong lúc chờ, bạn có thể luyện Speaking và Writing.`}
      emptyTitle={`Đề thi ${name} sắp ra mắt`}
      header={<SkillHeader account={<UserMenu />} active={skill} wide />}
      items={[]}
      skill={skills[skill]}
    />
  );
}

/** Per-Part practice list; empty for the same reason as the test list. */
export function ListeningReadingPractice({
  skill,
  part,
}: {
  skill: Skill;
  part: string;
}) {
  const { name } = skills[skill];
  const parts = partsOf(skill);
  const current = parts.find(([number]) => number === part)?.[1];
  return (
    <ExamLibrary
      emptyDescription={`Phần luyện ${name} đang được hoàn thiện. Trong lúc chờ, bạn có thể luyện Speaking và Writing.`}
      emptyTitle={`Bài tập ${name} sắp ra mắt`}
      header={<SkillHeader account={<UserMenu />} active={skill} wide />}
      items={[]}
      kind="exercise"
      partLinks={parts.map(([number, info]) => ({
        href: `/${skill}/practice/${number}`,
        label: `Part ${number} · ${info.title}`,
        active: number === part,
      }))}
      skill={{
        ...skills[skill],
        format: `Part ${part} · ${current?.title} · ${current?.questions} câu trong đề thi`,
      }}
    />
  );
}
