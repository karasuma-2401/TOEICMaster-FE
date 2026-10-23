import type { ReactNode } from "react";
import { pageContainer } from "./styles";

/** Page frame for practice screens: warm background, header slot and main column. */
export function PracticePage({
  header,
  className = "py-8 lg:py-10",
  children,
}: {
  header: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,rgb(255_237_213/0.55),transparent_60%)] bg-stone-50 text-slate-900">
      {header}
      <main className={`${pageContainer} ${className}`}>{children}</main>
    </div>
  );
}

/**
 * Main content plus a fixed-width side column. From `lg` the side column
 * sticks below the 64px header; below `lg` it stacks after the main column.
 */
export function PracticeColumns({
  main,
  aside,
}: {
  main: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{main}</div>
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">{aside}</div>
    </div>
  );
}
