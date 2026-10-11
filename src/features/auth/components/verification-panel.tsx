"use client";

import { type FormEvent, useState } from "react";

type VerificationPurpose = "registration" | "recovery";

export function VerificationPanel({
  email,
  onChangeEmail,
  purpose,
}: {
  email: string;
  onChangeEmail: () => void;
  purpose: VerificationPurpose;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const eyebrow =
    purpose === "recovery" ? "KHÔI PHỤC TÀI KHOẢN" : "XÁC MINH TÀI KHOẢN";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Vui lòng nhập mã gồm 6 chữ số.");
      setNotice(undefined);
      return;
    }

    setError(undefined);
    setNotice(
      "Tính năng xác minh mã đang được hoàn thiện. Thông tin của bạn chưa được gửi đi.",
    );
  }

  return (
    <section aria-labelledby="verification-title">
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[#ed361c] before:h-px before:w-6 before:bg-[#ed361c]">
        {eyebrow}
      </p>
      <h1
        className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[#342d2a]"
        id="verification-title"
      >
        Xác minh email
      </h1>
      <p className="mx-auto mt-3 max-w-[25rem] text-center text-[13px] leading-5 text-[#a89f9b]">
        Nhập mã gồm 6 chữ số đã được gửi đến{" "}
        <strong className="font-bold text-[#665c58]">{email}</strong>.
      </p>
      <form className="mt-8" noValidate onSubmit={submit}>
        <label
          className="mb-1.5 block text-center text-[11px] font-bold text-[#4e4542]"
          htmlFor="verificationCode"
        >
          Mã xác minh
        </label>
        <input
          aria-describedby={error ? "verificationCode-error" : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="one-time-code"
          className="h-14 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-6 text-center text-xl font-bold tracking-[0.55em] text-[#3d3532] outline-none transition placeholder:tracking-[0.55em] placeholder:text-[#d6cfcc] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
          id="verificationCode"
          inputMode="numeric"
          maxLength={6}
          name="verificationCode"
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            setError(undefined);
            setNotice(undefined);
          }}
          placeholder="0 0 0 0 0 0"
          value={code}
        />
        {error ? (
          <p
            className="mt-1.5 text-center text-xs text-red-600"
            id="verificationCode-error"
            role="alert"
          >
            {error}
          </p>
        ) : (
          <p className="mt-2 text-center text-[10px] text-[#c0b8b4]">
            Mã xác minh có hiệu lực trong 10 phút.
          </p>
        )}
        <button
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(239,63,27,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
          type="submit"
        >
          Xác minh mã
        </button>
      </form>
      {notice && (
        <output className="mt-4 block rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
          {notice}
        </output>
      )}
      <p className="mt-5 text-center text-[11px] text-[#a8a09c]">
        Không nhận được mã?{" "}
        <button
          className="cursor-pointer font-bold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          onClick={() =>
            setNotice(
              "Tính năng gửi lại mã đang được hoàn thiện. Chúng tôi chưa gửi email nào.",
            )
          }
          type="button"
        >
          Gửi lại mã
        </button>
      </p>
      <p className="mt-4 text-center text-[11px] text-[#a8a09c]">
        Sai địa chỉ email?{" "}
        <button
          className="cursor-pointer font-bold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          onClick={onChangeEmail}
          type="button"
        >
          Nhập lại email
        </button>
      </p>
      <p className="mt-7 text-center text-[9px] text-[#c8c0bc]">
        © 2025 TOEICMaster. Học ngoại ngữ, mở ra thế giới.
      </p>
    </section>
  );
}
