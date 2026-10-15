import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterPanel } from "@/features/auth/components/register-panel";
import { safeReturnTo } from "@/features/auth/protected-routes";

export const metadata: Metadata = {
  title: "Đăng ký | TOEICMaster",
  description:
    "Tạo tài khoản TOEICMaster để bắt đầu hành trình chinh phục TOEIC.",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthLayout>
      <RegisterPanel
        googleClientId={process.env.GOOGLE_CLIENT_ID}
        returnTo={safeReturnTo(next)}
      />
    </AuthLayout>
  );
}
