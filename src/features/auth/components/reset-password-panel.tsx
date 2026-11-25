"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthError, resetPassword } from "@/features/auth/api";
import { toast } from "@/shared/ui/toast";

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

export function ResetPasswordPanel({
  resetToken,
  expiresAtUtc,
  onRestart,
}: {
  resetToken: string;
  expiresAtUtc: string;
  onRestart: () => void;
}) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const [requestError, setRequestError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError("New password must be between 8 and 128 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Confirmation password does not match.");
      return;
    }
    if (Date.parse(expiresAtUtc) <= Date.now()) {
      setPasswordError(
        "The password reset code has expired. Please request a new code.",
      );
      return;
    }

    setPending(true);
    setPasswordError(undefined);
    setRequestError(undefined);
    try {
      await resetPassword(resetToken, newPassword);
      toast.success(
        "Your password has been reset. Please sign in with your new password.",
      );
      router.replace("/login");
    } catch (reason) {
      if (reason instanceof AuthError)
        setPasswordError(reason.fieldErrors.newPassword);
      setRequestError(
        reason instanceof Error
          ? reason.message
          : "Unable to reset password. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="reset-password-title">
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[var(--tm-brand)] before:h-px before:w-6 before:bg-[var(--tm-brand)]">
        ACCOUNT RECOVERY
      </p>
      <h1
        className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[var(--tm-ink)]"
        id="reset-password-title"
      >
        Set a new password
      </h1>
      <p className="mx-auto mt-3 max-w-[23rem] text-center text-[13px] leading-5 text-[var(--tm-ink-muted)]">
        Choose a new password with at least 8 characters to protect your
        account.
      </p>
      <form className="mt-8" noValidate onSubmit={submit}>
        <label
          className="mb-1.5 block text-[11px] font-bold text-[var(--tm-ink-soft)]"
          htmlFor="newPassword"
        >
          New password
        </label>
        <div className="relative">
          <input
            aria-describedby={passwordError ? "newPassword-error" : undefined}
            aria-invalid={Boolean(passwordError)}
            autoComplete="new-password"
            className="h-12 w-full rounded-xl border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] px-4 pr-12 text-sm text-[var(--tm-ink)] outline-none transition placeholder:text-[var(--tm-ink-subtle)] focus:border-[var(--tm-brand)] focus:ring-2 focus:ring-[var(--tm-brand-soft)] aria-[invalid=true]:border-[var(--tm-danger)]"
            id="newPassword"
            onChange={(event) => {
              setNewPassword(event.target.value);
              setPasswordError(undefined);
            }}
            placeholder="At least 8 characters"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
          />
          <PasswordToggle
            isVisible={showNewPassword}
            onClick={() => setShowNewPassword((visible) => !visible)}
          />
        </div>
        <label
          className="mb-1.5 mt-3.5 block text-[11px] font-bold text-[var(--tm-ink-soft)]"
          htmlFor="confirmNewPassword"
        >
          Confirm new password
        </label>
        <div className="relative">
          <input
            aria-describedby={passwordError ? "newPassword-error" : undefined}
            aria-invalid={Boolean(passwordError)}
            autoComplete="new-password"
            className="h-12 w-full rounded-xl border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] px-4 pr-12 text-sm text-[var(--tm-ink)] outline-none transition placeholder:text-[var(--tm-ink-subtle)] focus:border-[var(--tm-brand)] focus:ring-2 focus:ring-[var(--tm-brand-soft)] aria-[invalid=true]:border-[var(--tm-danger)]"
            id="confirmNewPassword"
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setPasswordError(undefined);
            }}
            placeholder="Re-enter new password"
            type={showConfirmation ? "text" : "password"}
            value={confirmPassword}
          />
          <PasswordToggle
            isVisible={showConfirmation}
            onClick={() => setShowConfirmation((visible) => !visible)}
          />
        </div>
        {passwordError && (
          <p
            className="mt-1.5 text-xs text-[var(--tm-danger)]"
            id="newPassword-error"
            role="alert"
          >
            {passwordError}
          </p>
        )}
        {requestError && (
          <output className="mt-4 block rounded-xl bg-[var(--tm-warning-soft)] px-4 py-3 text-sm leading-5 text-[var(--tm-warning)]">
            {requestError}
          </output>
        )}
        <button
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--tm-brand)] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,59,11,0.18)] transition hover:bg-[var(--tm-brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
          disabled={pending}
          type="submit"
        >
          {pending ? "Resetting..." : "Reset password"}
        </button>
      </form>
      <button
        className="mt-5 block w-full cursor-pointer text-center text-[11px] font-bold text-[var(--tm-brand)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]"
        onClick={onRestart}
        type="button"
      >
        Request a new code
      </button>
    </section>
  );
}
