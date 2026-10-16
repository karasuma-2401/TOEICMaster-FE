"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import {
  AuthError,
  requestPasswordReset,
  type PasswordResetVerification,
} from "@/features/auth/api";
import { validateRecoveryEmail } from "@/features/auth/login";
import { ResetPasswordPanel } from "./reset-password-panel";
import { VerificationPanel } from "./verification-panel";

export function ForgotPasswordPanel() {
  const [view, setView] = useState<
    "request" | "verification" | "reset-password"
  >("request");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);
  const [resetVerification, setResetVerification] =
    useState<PasswordResetVerification>();

  function showRequest() {
    setView("request");
    setNotice(undefined);
    setResetVerification(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateRecoveryEmail(email);
    setEmailError(errors.email);
    setNotice(undefined);
    if (Object.keys(errors).length > 0) return;
    setPending(true);
    try {
      await requestPasswordReset(email);
      setView("verification");
    } catch (reason) {
      if (reason instanceof AuthError) setEmailError(reason.fieldErrors.email);
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Không thể gửi mã xác minh. Vui lòng thử lại.",
      );
    } finally {
      setPending(false);
    }
  }

  if (view === "verification") {
    return (
      <VerificationPanel
        email={email.trim()}
        onChangeEmail={showRequest}
        onPasswordResetVerified={(verification) => {
          setResetVerification(verification);
          setView("reset-password");
        }}
        purpose="recovery"
      />
    );
  }
  if (view === "reset-password" && resetVerification) {
    return (
      <ResetPasswordPanel
        expiresAtUtc={resetVerification.expiresAtUtc}
        onRestart={showRequest}
        resetToken={resetVerification.resetToken}
      />
    );
  }

  return (
    <section aria-labelledby="recovery-title">
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[#ed361c] before:h-px before:w-6 before:bg-[#ed361c]">
        KHÔI PHỤC TÀI KHOẢN
      </p>
      <h1
        className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[#342d2a]"
        id="recovery-title"
      >
        Quên mật khẩu?
      </h1>
      <p className="mx-auto mt-3 max-w-[23rem] text-center text-[13px] leading-5 text-[#a89f9b]">
        Nhập email đã đăng ký, chúng tôi sẽ gửi cho bạn mã xác minh để đặt lại
        mật khẩu.
      </p>
      <form className="mt-8" noValidate onSubmit={submit}>
        <label
          className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
          htmlFor="recoveryEmail"
        >
          Email
        </label>
        <input
          aria-describedby={emailError ? "recoveryEmail-error" : undefined}
          aria-invalid={Boolean(emailError)}
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-4 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
          id="recoveryEmail"
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(undefined);
            setNotice(undefined);
          }}
          placeholder="ban@example.com"
          type="email"
          value={email}
        />
        {emailError && (
          <p
            className="mt-1.5 text-xs text-red-600"
            id="recoveryEmail-error"
            role="alert"
          >
            {emailError}
          </p>
        )}
        <button
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(239,63,27,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
          disabled={pending}
          type="submit"
        >
          {pending ? "Đang gửi..." : "Gửi mã xác minh"}
        </button>
      </form>
      {notice && (
        <output className="mt-4 block rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
          {notice}
        </output>
      )}
      <p className="mt-6 text-center text-[11px] text-[#a8a09c]">
        Bạn đã nhớ mật khẩu?{" "}
        <Link
          className="font-bold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          href="/login"
        >
          Quay lại đăng nhập
        </Link>
      </p>
    </section>
  );
}
