import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/shared/components/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOEICMaster",
  description: "Phần mềm hỗ trợ học và luyện thi TOEIC",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
