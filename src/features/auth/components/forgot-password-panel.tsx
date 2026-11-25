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
          : "Unable to send verification code. Please try again.",
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
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[var(--tm-brand)] before:h-px before:w-6 before:bg-[var(--tm-brand)]">
        ACCOUNT RECOVERY
      </p>
      <h1
        className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[var(--tm-ink)]"
        id="recovery-title"
      >
        Forgot password?
      </h1>
      <p className="mx-auto mt-3 max-w-[23rem] text-center text-[13px] leading-5 text-[var(--tm-ink-muted)]">
        Enter your registered email and we will send you a verification code to
        reset your password.
      </p>
      <form className="mt-8" noValidate onSubmit={submit}>
        <label
          className="mb-1.5 block text-[11px] font-bold text-[var(--tm-ink-soft)]"
          htmlFor="recoveryEmail"
        >
          Email
        </label>
        <input
          aria-describedby={emailError ? "recoveryEmail-error" : undefined}
          aria-invalid={Boolean(emailError)}
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] px-4 text-sm text-[var(--tm-ink)] outline-none transition placeholder:text-[var(--tm-ink-subtle)] focus:border-[var(--tm-brand)] focus:ring-2 focus:ring-[var(--tm-brand-soft)] aria-[invalid=true]:border-[var(--tm-danger)]"
          id="recoveryEmail"
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(undefined);
            setNotice(undefined);
          }}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
        {emailError && (
          <p
            className="mt-1.5 text-xs text-[var(--tm-danger)]"
            id="recoveryEmail-error"
            role="alert"
          >
            {emailError}
          </p>
        )}
        <button
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--tm-brand)] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,59,11,0.18)] transition hover:bg-[var(--tm-brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
          disabled={pending}
          type="submit"
        >
          {pending ? "Sending..." : "Send verification code"}
        </button>
      </form>
      {notice && (
        <output className="mt-4 block rounded-xl bg-[var(--tm-warning-soft)] px-4 py-3 text-sm leading-5 text-[var(--tm-warning)]">
          {notice}
        </output>
      )}
      <p className="mt-6 text-center text-[11px] text-[var(--tm-ink-muted)]">
        Remember your password?{" "}
        <Link
          className="font-bold text-[var(--tm-brand)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
          href="/login"
        >
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
