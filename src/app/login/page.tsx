import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginPanel } from "@/features/auth/components/login-panel";

export const metadata: Metadata = {
  title: "Đăng nhập | TOEICMaster",
  description: "Đăng nhập TOEICMaster để tiếp tục hành trình học TOEIC.",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginPanel googleClientId={process.env.GOOGLE_CLIENT_ID} />
    </AuthLayout>
  );
}
