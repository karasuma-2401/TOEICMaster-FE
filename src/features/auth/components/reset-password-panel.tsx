"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { AuthError, resetPassword } from "@/features/auth/api";

export function ResetPasswordPanel({
  resetToken,
  expiresAtUtc,
  onRestart,
}: {
  resetToken: string;
  expiresAtUtc: string;
  onRestart: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const [requestError, setRequestError] = useState<string>();
  const [completed, setCompleted] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError("Mật khẩu mới cần từ 8 đến 128 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    if (Date.parse(expiresAtUtc) <= Date.now()) {
      setPasswordError(
        "Mã đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.",
      );
      return;
    }

    setPending(true);
    setPasswordError(undefined);
    setRequestError(undefined);
    try {
      await resetPassword(resetToken, newPassword);
      setCompleted(true);
    } catch (reason) {
      if (reason instanceof AuthError)
        setPasswordError(reason.fieldErrors.newPassword);
      setRequestError(
        reason instanceof Error
          ? reason.message
          : "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="reset-password-title">
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[#ed361c] before:h-px before:w-6 before:bg-[#ed361c]">
        KHÔI PHỤC TÀI KHOẢN
      </p>
      <h1
        className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[#342d2a]"
        id="reset-password-title"
      >
        Đặt mật khẩu mới
      </h1>
      <p className="mx-auto mt-3 max-w-[23rem] text-center text-[13px] leading-5 text-[#a89f9b]">
        Chọn mật khẩu mới gồm ít nhất 8 ký tự để bảo vệ tài khoản của bạn.
      </p>
      {completed ? (
        <>
          <output className="mt-8 block rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800">
            Mật khẩu của bạn đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.
          </output>
          <Link
            className="mt-5 flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(239,63,27,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
            href="/login"
          >
            Đăng nhập
          </Link>
        </>
      ) : (
        <form className="mt-8" noValidate onSubmit={submit}>
          <label
            className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
            htmlFor="newPassword"
          >
            Mật khẩu mới
          </label>
          <input
            aria-describedby={passwordError ? "newPassword-error" : undefined}
            aria-invalid={Boolean(passwordError)}
            autoComplete="new-password"
            className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-4 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
            id="newPassword"
            onChange={(event) => {
              setNewPassword(event.target.value);
              setPasswordError(undefined);
            }}
            placeholder="Tối thiểu 8 ký tự"
            type="password"
            value={newPassword}
          />
          <label
            className="mb-1.5 mt-3.5 block text-[11px] font-bold text-[#4e4542]"
            htmlFor="confirmNewPassword"
          >
            Xác nhận mật khẩu mới
          </label>
          <input
            aria-describedby={passwordError ? "newPassword-error" : undefined}
            aria-invalid={Boolean(passwordError)}
            autoComplete="new-password"
            className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-4 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
            id="confirmNewPassword"
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setPasswordError(undefined);
            }}
            placeholder="Nhập lại mật khẩu mới"
            type="password"
            value={confirmPassword}
          />
          {passwordError && (
            <p
              className="mt-1.5 text-xs text-red-600"
              id="newPassword-error"
              role="alert"
            >
              {passwordError}
            </p>
          )}
          {requestError && (
            <output className="mt-4 block rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
              {requestError}
            </output>
          )}
          <button
            className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(239,63,27,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
            disabled={pending}
            type="submit"
          >
            {pending ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      )}
      {!completed && (
        <button
          className="mt-5 block w-full cursor-pointer text-center text-[11px] font-bold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          onClick={onRestart}
          type="button"
        >
          Yêu cầu mã mới
        </button>
      )}
    </section>
  );
}
