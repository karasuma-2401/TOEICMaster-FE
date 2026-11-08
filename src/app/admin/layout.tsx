import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { speakingFontClasses } from "@/features/speaking/fonts";
import "@/features/speaking/speaking-theme.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`sp-theme ${speakingFontClasses}`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
