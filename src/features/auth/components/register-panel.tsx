"use client";

import { useState } from "react";
import { AuthTabs } from "./auth-layout";
import { RegisterForm } from "./register-form";
import { VerificationPanel } from "./verification-panel";

export function RegisterPanel() {
  const [verificationEmail, setVerificationEmail] = useState<string>();

  if (verificationEmail) {
    return (
      <VerificationPanel
        email={verificationEmail}
        onChangeEmail={() => setVerificationEmail(undefined)}
        purpose="registration"
      />
    );
  }

  return (
    <>
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
        <RegisterForm onRegistrationAccepted={setVerificationEmail} />
      </div>
    </>
  );
}
