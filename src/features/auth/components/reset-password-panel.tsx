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
      toast.success(
        "Mật khẩu của bạn đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.",
      );
      router.replace("/login");
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
      <form className="mt-8" noValidate onSubmit={submit}>
        <label
          className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
          htmlFor="newPassword"
        >
          Mật khẩu mới
        </label>
        <div className="relative">
          <input
            aria-describedby={passwordError ? "newPassword-error" : undefined}
            aria-invalid={Boolean(passwordError)}
            autoComplete="new-password"
            className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-4 pr-12 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
            id="newPassword"
            onChange={(event) => {
              setNewPassword(event.target.value);
              setPasswordError(undefined);
            }}
            placeholder="Tối thiểu 8 ký tự"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
          />
          <PasswordToggle
            isVisible={showNewPassword}
            onClick={() => setShowNewPassword((visible) => !visible)}
          />
        </div>
        <label
          className="mb-1.5 mt-3.5 block text-[11px] font-bold text-[#4e4542]"
          htmlFor="confirmNewPassword"
        >
          Xác nhận mật khẩu mới
        </label>
        <div className="relative">
          <input
            aria-describedby={passwordError ? "newPassword-error" : undefined}
            aria-invalid={Boolean(passwordError)}
            autoComplete="new-password"
            className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-4 pr-12 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
            id="confirmNewPassword"
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setPasswordError(undefined);
            }}
            placeholder="Nhập lại mật khẩu mới"
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
      <button
        className="mt-5 block w-full cursor-pointer text-center text-[11px] font-bold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
        onClick={onRestart}
        type="button"
      >
        Yêu cầu mã mới
      </button>
    </section>
  );
}
