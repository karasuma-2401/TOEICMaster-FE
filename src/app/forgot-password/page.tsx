import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ForgotPasswordPanel } from "@/features/auth/components/forgot-password-panel";

export const metadata: Metadata = {
  title: "Forgot Password | TOEICMaster",
  description: "Reset your TOEICMaster account password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordPanel />
    </AuthLayout>
  );
}
