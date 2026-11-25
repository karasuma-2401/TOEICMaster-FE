"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthError, login, resolveLoginDestination } from "@/features/auth/api";
import { validateLogin } from "@/features/auth/login";
import { authUrl } from "@/features/auth/protected-routes";
import { AuthTabs } from "./auth-layout";
import { GoogleSignIn } from "./google-sign-in";

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
      aria-label={isVisible ? "Hide password" : "Show password"}
      className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-[var(--tm-ink-subtle)] transition hover:text-[var(--tm-brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
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

export function LoginPanel({
  googleClientId,
  returnTo = "/",
}: {
  googleClientId?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateLogin({ email, password });
    setEmailError(errors.email);
    setPasswordError(errors.password);
    setNotice(undefined);
    if (Object.keys(errors).length > 0) return;
    setPending(true);
    try {
      const user = await login(email, password, rememberMe);
      router.replace(resolveLoginDestination(user, returnTo));
      router.refresh();
    } catch (reason) {
      if (reason instanceof AuthError) {
        setEmailError(reason.fieldErrors.email);
        setPasswordError(reason.fieldErrors.password);
      }
      setNotice(
        reason instanceof Error ? reason.message : "Unable to sign in.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="login-title">
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[var(--tm-brand)] before:h-px before:w-6 before:bg-[var(--tm-brand)]">
        WELCOME TO TOEICMASTER
      </p>
      <h1
        className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[var(--tm-ink)]"
        id="login-title"
      >
        Continue your journey
      </h1>
      <p className="mt-3 text-center text-[13px] text-[var(--tm-ink-muted)]">
        Sign in to keep learning and track your daily progress.
      </p>
      <AuthTabs current="login" returnTo={returnTo} />
      <form className="mt-6" noValidate onSubmit={submitLogin}>
        <div>
          <label
            className="mb-1.5 block text-[11px] font-bold text-[var(--tm-ink-soft)]"
            htmlFor="email"
          >
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[var(--tm-ink-subtle)]">
              <EmailIcon />
            </span>
            <input
              aria-describedby={emailError ? "email-error" : undefined}
              aria-invalid={Boolean(emailError)}
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] px-11 pr-4 text-sm text-[var(--tm-ink)] outline-none transition placeholder:text-[var(--tm-ink-subtle)] focus:border-[var(--tm-brand)] focus:ring-2 focus:ring-[var(--tm-brand-soft)] aria-[invalid=true]:border-[var(--tm-danger)]"
              id="email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(undefined);
                setNotice(undefined);
              }}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </div>
          {emailError && (
            <p
              className="mt-1.5 text-xs text-[var(--tm-danger)]"
              id="email-error"
              role="alert"
            >
              {emailError}
            </p>
          )}
        </div>
        <div className="mt-3.5">
          <label
            className="mb-1.5 block text-[11px] font-bold text-[var(--tm-ink-soft)]"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[var(--tm-ink-subtle)]">
              <PasswordIcon />
            </span>
            <input
              aria-describedby={passwordError ? "password-error" : undefined}
              aria-invalid={Boolean(passwordError)}
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] px-11 pr-12 text-sm text-[var(--tm-ink)] outline-none transition placeholder:text-[var(--tm-ink-subtle)] focus:border-[var(--tm-brand)] focus:ring-2 focus:ring-[var(--tm-brand-soft)] aria-[invalid=true]:border-[var(--tm-danger)]"
              id="password"
              name="password"
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(undefined);
                setNotice(undefined);
              }}
              placeholder="Enter your password"
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
              className="mt-1.5 text-xs text-[var(--tm-danger)]"
              id="password-error"
              role="alert"
            >
              {passwordError}
            </p>
          )}
        </div>
        <div className="mt-3.5 flex items-center justify-between gap-4 text-[11px]">
          <label className="flex cursor-pointer items-center gap-2 text-[var(--tm-ink-muted)]">
            <input
              checked={rememberMe}
              className="h-3.5 w-3.5 rounded border-[var(--tm-border-strong)] accent-[var(--tm-brand)] focus:ring-[var(--tm-ring)]"
              name="rememberMe"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
            />
            Remember me
          </label>
          <Link
            className="shrink-0 cursor-pointer font-bold text-[var(--tm-brand)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <button
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--tm-brand)] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,59,11,0.18)] transition hover:bg-[var(--tm-brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
          disabled={pending}
          type="submit"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {notice && (
        <output className="mt-4 block rounded-xl bg-[var(--tm-warning-soft)] px-4 py-3 text-sm leading-5 text-[var(--tm-warning)]">
          {notice}
        </output>
      )}
      <div className="mt-5 flex items-center gap-3 text-[10px] text-[var(--tm-ink-subtle)] before:h-px before:flex-1 before:bg-[var(--tm-border)] after:h-px after:flex-1 after:bg-[var(--tm-border)]">
        or continue with
      </div>
      <GoogleSignIn
        clientId={googleClientId}
        rememberMe={rememberMe}
        returnTo={returnTo}
      />
      <p className="mt-5 text-center text-[11px] text-[var(--tm-ink-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          className="cursor-pointer font-bold text-[var(--tm-brand)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
          href={authUrl("/register", returnTo)}
        >
          Sign up for free
        </Link>
      </p>
      <p className="mt-7 text-center text-[9px] text-[var(--tm-ink-subtle)]">
        © 2025 TOEICMaster. Learn languages, open up the world.
      </p>
    </section>
  );
}
