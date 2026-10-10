import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterPanel } from "@/features/auth/components/register-panel";

export const metadata: Metadata = {
  title: "Đăng ký | TOEICMaster",
  description:
    "Tạo tài khoản TOEICMaster để bắt đầu hành trình chinh phục TOEIC.",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterPanel />
    </AuthLayout>
  );
}
