import type { Metadata } from "next";
import { AuthLayout, AuthTabs } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Đăng ký | TOEICMaster",
  description:
    "Tạo tài khoản TOEICMaster để bắt đầu hành trình chinh phục TOEIC.",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[#ed361c] before:h-px before:w-6 before:bg-[#ed361c]">
        CHÀO MỪNG ĐẾN VỚI TOEICMASTER
      </p>
      <h1 className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[#342d2a]">
        Bắt đầu hành trình mới
      </h1>
      <p className="mt-3 text-center text-[13px] text-[#a89f9b]">
        Tạo tài khoản miễn phí và bắt đầu chinh phục TOEIC ngay hôm nay.
      </p>
      <AuthTabs current="register" />
      <div className="mt-6">
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}
