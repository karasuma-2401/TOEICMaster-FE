import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ForgotPasswordPanel } from "@/features/auth/components/forgot-password-panel";

export const metadata: Metadata = {
  title: "Quên mật khẩu | TOEICMaster",
  description: "Khôi phục mật khẩu tài khoản TOEICMaster.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordPanel />
    </AuthLayout>
  );
}
