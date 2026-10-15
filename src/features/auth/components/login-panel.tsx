"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthError, login } from "@/features/auth/api";
import { authUrl } from "@/features/auth/protected-routes";
import { validateLogin, validateRecoveryEmail } from "@/features/auth/login";
import { AuthTabs } from "./auth-layout";
import { GoogleSignIn } from "./google-sign-in";
import { VerificationPanel } from "./verification-panel";

function EmailIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="17"
        x="3.5"
        y="5.5"
      />
      <path
        d="m4.5 7 7.5 5.7L19.5 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PasswordIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect
        height="9.5"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.8"
        width="13"
        x="5.5"
        y="10"
      />
      <path
        d="M8.5 10V7.8a3.5 3.5 0 0 1 7 0V10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PasswordToggle({
  isVisible,
  onClick,
}: {
  isVisible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-[#b6b0ad] transition hover:text-[#ed361c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
      onClick={onClick}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
      >
        {isVisible ? (
          <path
            d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Zm9 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        ) : (
          <>
            <path
              d="M10.6 6.1A10.2 10.2 0 0 1 12 6c5.8 0 9 6 9 6a16.4 16.4 0 0 1-3.2 3.7M6.2 6.2C4.1 7.5 3 9.7 3 12c0 0 3.2 6 9 6 1.2 0 2.3-.2 3.3-.6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
            <path
              d="m3 3 18 18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </>
        )}
      </svg>
    </button>
  );
}

function Footer() {
  return (
    <p className="mt-7 text-center text-[9px] text-[#c8c0bc]">
      © 2025 TOEICMaster. Học ngoại ngữ, mở ra thế giới.
    </p>
  );
}

export function LoginPanel({
  googleClientId,
  returnTo = "/",
}: {
  googleClientId?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<"login" | "recovery" | "verification">(
    "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [recoveryError, setRecoveryError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);

  function resetNotice() {
    setNotice(undefined);
  }

  function showRecovery() {
    setView("recovery");
    setNotice(undefined);
    setEmailError(undefined);
    setPasswordError(undefined);
  }

  function showLogin() {
    setView("login");
    setNotice(undefined);
    setRecoveryError(undefined);
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateLogin({ email, password });
    setEmailError(errors.email);
    setPasswordError(errors.password);
    setNotice(undefined);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      await login(email, password, rememberMe);
      router.replace(returnTo);
      router.refresh();
    } catch (reason) {
      if (reason instanceof AuthError) {
        setEmailError(reason.fieldErrors.email);
        setPasswordError(reason.fieldErrors.password);
      }
      setNotice(
        reason instanceof Error ? reason.message : "Không thể đăng nhập.",
      );
    } finally {
      setPending(false);
    }
  }

  function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateRecoveryEmail(recoveryEmail);
    setRecoveryError(errors.email);
    setNotice(undefined);
    if (Object.keys(errors).length > 0) return;

    setView("verification");
  }

  if (view === "verification") {
    return (
      <VerificationPanel
        email={recoveryEmail.trim()}
        onChangeEmail={showRecovery}
        purpose="recovery"
      />
    );
  }

  if (view === "recovery") {
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
        <form className="mt-8" noValidate onSubmit={submitRecovery}>
          <label
            className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
            htmlFor="recoveryEmail"
          >
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#beb7b3]">
              <EmailIcon />
            </span>
            <input
              aria-describedby={
                recoveryError ? "recoveryEmail-error" : undefined
              }
              aria-invalid={Boolean(recoveryError)}
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-11 pr-4 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
              id="recoveryEmail"
              name="recoveryEmail"
              onChange={(event) => {
                setRecoveryEmail(event.target.value);
                setRecoveryError(undefined);
                resetNotice();
              }}
              placeholder="ban@example.com"
              type="email"
              value={recoveryEmail}
            />
          </div>
          {recoveryError && (
            <p
              className="mt-1.5 text-xs text-red-600"
              id="recoveryEmail-error"
              role="alert"
            >
              {recoveryError}
            </p>
          )}
          <button
            className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(239,63,27,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
            type="submit"
          >
            Gửi mã xác minh
          </button>
        </form>
        {notice && (
          <output className="mt-4 block rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
            {notice}
          </output>
        )}
        <p className="mt-6 text-center text-[11px] text-[#a8a09c]">
          Bạn đã nhớ mật khẩu?{" "}
          <button
            className="cursor-pointer font-bold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
            onClick={showLogin}
            type="button"
          >
            Quay lại đăng nhập
          </button>
        </p>
        <Footer />
      </section>
    );
  }

  return (
    <section aria-labelledby="login-title">
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[#ed361c] before:h-px before:w-6 before:bg-[#ed361c]">
        CHÀO MỪNG ĐẾN VỚI TOEICMASTER
      </p>
      <h1
        className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[#342d2a]"
        id="login-title"
      >
        Tiếp tục hành trình của bạn
      </h1>
      <p className="mt-3 text-center text-[13px] text-[#a89f9b]">
        Đăng nhập để tiếp tục học và theo dõi tiến độ mỗi ngày.
      </p>
      <AuthTabs current="login" returnTo={returnTo} />
      <form className="mt-6" noValidate onSubmit={submitLogin}>
        <div>
          <label
            className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
            htmlFor="email"
          >
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#beb7b3]">
              <EmailIcon />
            </span>
            <input
              aria-describedby={emailError ? "email-error" : undefined}
              aria-invalid={Boolean(emailError)}
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-11 pr-4 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
              id="email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(undefined);
                resetNotice();
              }}
              placeholder="ban@example.com"
              type="email"
              value={email}
            />
          </div>
          {emailError && (
            <p
              className="mt-1.5 text-xs text-red-600"
              id="email-error"
              role="alert"
            >
              {emailError}
            </p>
          )}
        </div>
        <div className="mt-3.5">
          <label
            className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
            htmlFor="password"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#beb7b3]">
              <PasswordIcon />
            </span>
            <input
              aria-describedby={passwordError ? "password-error" : undefined}
              aria-invalid={Boolean(passwordError)}
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-11 pr-12 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
              id="password"
              name="password"
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(undefined);
                resetNotice();
              }}
              placeholder="Nhập mật khẩu"
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <PasswordToggle
              isVisible={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            />
          </div>
          {passwordError && (
            <p
              className="mt-1.5 text-xs text-red-600"
              id="password-error"
              role="alert"
            >
              {passwordError}
            </p>
          )}
        </div>
        <div className="mt-3.5 flex items-center justify-between gap-4 text-[11px]">
          <label className="flex cursor-pointer items-center gap-2 text-[#938b87]">
            <input
              checked={rememberMe}
              className="h-3.5 w-3.5 rounded border-[#bdb4af] accent-[#ed361c] focus:ring-[#ed361c]"
              name="rememberMe"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
            />
            Ghi nhớ đăng nhập
          </label>
          <button
            className="shrink-0 cursor-pointer font-bold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
            onClick={showRecovery}
            type="button"
          >
            Quên mật khẩu?
          </button>
        </div>
        <button
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(239,63,27,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
          disabled={pending}
          type="submit"
        >
          {pending ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
      {notice && (
        <output className="mt-4 block rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
          {notice}
        </output>
      )}
      <div className="mt-5 flex items-center gap-3 text-[10px] text-[#c0b8b4] before:h-px before:flex-1 before:bg-[#eee8e5] after:h-px after:flex-1 after:bg-[#eee8e5]">
        hoặc tiếp tục với
      </div>
      <GoogleSignIn
        clientId={googleClientId}
        rememberMe={rememberMe}
        returnTo={returnTo}
      />
      <p className="mt-5 text-center text-[11px] text-[#a8a09c]">
        Chưa có tài khoản?{" "}
        <Link
          className="cursor-pointer font-bold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          href={authUrl("/register", returnTo)}
        >
          Đăng ký miễn phí
        </Link>
      </p>
      <Footer />
    </section>
  );
}
