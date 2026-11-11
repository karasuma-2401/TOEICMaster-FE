import type { ReactNode } from "react";
import { UserMenu } from "@/features/user/components/user-menu";
import {
  SkillHeader,
  type PracticeNavId,
} from "@/shared/components/practice/skill-header";

export function WritingHeader({
  active = "writing",
  wide,
  center,
}: {
  active?: Extract<PracticeNavId, "writing" | "history">;
  wide?: boolean;
  center?: ReactNode;
}) {
  return (
    <SkillHeader
      account={<UserMenu />}
      active={active}
      center={center}
      wide={wide}
    />
  );
}
