import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NavigationTracker } from "@/shared/components/practice/navigation-tracker";
import { ToastProvider } from "@/shared/components/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOEICMaster",
  description: "TOEIC learning and exam preparation platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a
          className="tm-skip-link"
          data-testid="skip-to-main-link"
          href="#main-content"
        >
          Skip to main content
        </a>
        <NavigationTracker />
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
