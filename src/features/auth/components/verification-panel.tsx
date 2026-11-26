"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  AuthError,
  type PasswordResetVerification,
  requestPasswordReset,
  resendVerification,
  verifyEmail,
  verifyPasswordReset,
} from "@/features/auth/api";
import { authUrl } from "@/features/auth/protected-routes";

type VerificationPurpose = "registration" | "recovery";

export function VerificationPanel({
  email,
  onChangeEmail,
  purpose,
  returnTo = "/",
  onPasswordResetVerified,
}: {
  email: string;
  onChangeEmail: () => void;
  purpose: VerificationPurpose;
  returnTo?: string;
  onPasswordResetVerified?: (verification: PasswordResetVerification) => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const eyebrow =
    purpose === "recovery" ? "ACCOUNT RECOVERY" : "VERIFY ACCOUNT";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a 6-digit code.");
      setNotice(undefined);
      return;
    }

    setPending(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (purpose === "recovery") {
        onPasswordResetVerified?.(await verifyPasswordReset(email, code));
        return;
      }
      await verifyEmail(email, code);
      router.replace(authUrl("/login", returnTo));
      router.refresh();
    } catch (reason) {
      if (reason instanceof AuthError) setError(reason.fieldErrors.code);
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Unable to verify email. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setResending(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (purpose === "recovery") {
        await requestPasswordReset(email);
      } else {
        await resendVerification(email);
      }
      setNotice(
        purpose === "recovery"
          ? "If this email is eligible for a password reset, a new code will be sent once the cooldown ends."
          : "If this account is pending verification, a new code will be sent once the cooldown ends.",
      );
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Unable to resend code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <section aria-labelledby="verification-title">
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[var(--tm-brand)] before:h-px before:w-6 before:bg-[var(--tm-brand)]">
        {eyebrow}
      </p>
      <h1
        className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[var(--tm-ink)]"
        id="verification-title"
      >
        Verify email
      </h1>
      <p className="mx-auto mt-3 max-w-[25rem] text-center text-[13px] leading-5 text-[var(--tm-ink-muted)]">
        Enter the 6-digit code sent to{" "}
        <strong className="font-bold text-[var(--tm-ink)]">{email}</strong>.
      </p>
      <form className="mt-8" noValidate onSubmit={submit}>
        <label
          className="mb-1.5 block text-center text-[11px] font-bold text-[var(--tm-ink-soft)]"
          htmlFor="verificationCode"
        >
          Verification code
        </label>
        <input
          aria-describedby={error ? "verificationCode-error" : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="one-time-code"
          className="h-14 w-full rounded-xl border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] px-6 text-center text-xl font-bold tracking-[0.55em] text-[var(--tm-ink)] outline-none transition placeholder:text-[var(--tm-ink-subtle)] focus:border-[var(--tm-brand)] focus:ring-2 focus:ring-[var(--tm-brand-soft)] aria-[invalid=true]:border-[var(--tm-danger)]"
          id="verificationCode"
          inputMode="numeric"
          maxLength={6}
          name="verificationCode"
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            setError(undefined);
            setNotice(undefined);
          }}
          placeholder="000000"
          value={code}
        />
        {error ? (
          <p
            className="mt-1.5 text-center text-xs text-[var(--tm-danger)]"
            id="verificationCode-error"
            role="alert"
          >
            {error}
          </p>
        ) : (
          <p className="mt-2 text-center text-[10px] text-[var(--tm-ink-subtle)]">
            The verification code is valid for 10 minutes.
          </p>
        )}
        <button
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--tm-brand)] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,59,11,0.18)] transition hover:bg-[var(--tm-brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
          disabled={pending}
          type="submit"
        >
          {pending ? "Verifying..." : "Verify code"}
        </button>
      </form>
      {notice && (
        <output className="mt-4 block rounded-xl bg-[var(--tm-warning-soft)] px-4 py-3 text-sm leading-5 text-[var(--tm-warning)]">
          {notice}
        </output>
      )}
      <p className="mt-5 text-center text-[11px] text-[var(--tm-ink-muted)]">
        Didn&apos;t receive the code?{" "}
        <button
          className="cursor-pointer font-bold text-[var(--tm-brand)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
          disabled={resending}
          onClick={resend}
          type="button"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </p>
      <p className="mt-4 text-center text-[11px] text-[var(--tm-ink-muted)]">
        Wrong email address?{" "}
        <button
          className="cursor-pointer font-bold text-[var(--tm-brand)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
          onClick={onChangeEmail}
          type="button"
        >
          Re-enter email
        </button>
      </p>
      <p className="mt-7 text-center text-[9px] text-[var(--tm-ink-subtle)]">
        © 2025 TOEICMaster. Learn languages, open up the world.
      </p>
    </section>
  );
}
