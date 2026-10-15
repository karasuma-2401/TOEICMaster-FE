"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useState } from "react";
import {
  type RegisterField,
  type RegisterFieldErrors,
  type RegisterInput,
  RegisterError,
  register,
  validateRegistration,
} from "@/features/auth/register";
import { GoogleSignIn } from "./google-sign-in";
import { authUrl } from "@/features/auth/protected-routes";

type FormValues = RegisterInput & {
  confirmPassword: string;
  termsAccepted: boolean;
};
type TextField = Exclude<RegisterField, "termsAccepted">;

const initialValues: FormValues = {
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
  termsAccepted: false,
};

const fields: Array<{
  name: TextField;
  label: string;
  autoComplete: string;
  type: "text" | "email" | "password";
  placeholder: string;
}> = [
  {
    name: "displayName",
    label: "Tên hiển thị",
    autoComplete: "name",
    type: "text",
    placeholder: "Tên của bạn",
  },
  {
    name: "email",
    label: "Email",
    autoComplete: "email",
    type: "email",
    placeholder: "ban@example.com",
  },
  {
    name: "password",
    label: "Mật khẩu",
    autoComplete: "new-password",
    type: "password",
    placeholder: "Tối thiểu 8 ký tự",
  },
  {
    name: "confirmPassword",
    label: "Xác nhận mật khẩu",
    autoComplete: "new-password",
    type: "password",
    placeholder: "Nhập lại mật khẩu",
  },
];

function FieldIcon({ name }: { name: TextField }) {
  if (name === "displayName") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="8"
          r="3.25"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M5.5 20c.55-3.35 2.7-5 6.5-5s5.95 1.65 6.5 5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }
  if (name === "email") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
      >
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

export function RegisterForm({
  googleClientId,
  onRegistrationAccepted,
  returnTo = "/",
}: {
  googleClientId?: string;
  onRegistrationAccepted: (email: string) => void;
  returnTo?: string;
}) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<
    Partial<Record<"password" | "confirmPassword", boolean>>
  >({});

  function updateValue(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name as TextField;
    const next = { ...values, [name]: event.target.value };
    setValues(next);
    if (errors[name])
      setErrors((current) => ({ ...current, [name]: undefined }));
    setNotice(undefined);
  }

  function updateTerms(event: ChangeEvent<HTMLInputElement>) {
    setValues((current) => ({
      ...current,
      termsAccepted: event.target.checked,
    }));
    if (errors.termsAccepted)
      setErrors((current) => ({ ...current, termsAccepted: undefined }));
    setNotice(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRegistration(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    setNotice(undefined);
    try {
      await register(values);
      onRegistrationAccepted(values.email.trim());
    } catch (reason) {
      if (reason instanceof RegisterError) setErrors(reason.fieldErrors);
      setNotice(
        reason instanceof Error ? reason.message : "Không thể tạo tài khoản.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={submit}>
      <div className="space-y-3.5">
        {fields.map((field) => {
          const error = errors[field.name];
          const isPassword = field.type === "password";
          const visible =
            isPassword &&
            visiblePasswords[field.name as "password" | "confirmPassword"];
          return (
            <div key={field.name}>
              <label
                className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
                htmlFor={field.name}
              >
                {field.label}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#beb7b3]">
                  <FieldIcon name={field.name} />
                </span>
                <input
                  aria-describedby={error ? `${field.name}-error` : undefined}
                  aria-invalid={Boolean(error)}
                  autoComplete={field.autoComplete}
                  className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-11 pr-12 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
                  id={field.name}
                  name={field.name}
                  onChange={updateValue}
                  placeholder={field.placeholder}
                  type={isPassword && visible ? "text" : field.type}
                  value={values[field.name]}
                />
                {isPassword && (
                  <PasswordToggle
                    isVisible={Boolean(visible)}
                    onClick={() =>
                      setVisiblePasswords((current) => ({
                        ...current,
                        [field.name]:
                          !current[
                            field.name as "password" | "confirmPassword"
                          ],
                      }))
                    }
                  />
                )}
              </div>
              {error && (
                <p
                  className="mt-1.5 text-xs text-red-600"
                  id={`${field.name}-error`}
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3.5">
        <label
          className="flex cursor-pointer items-center gap-2 text-[11px] text-[#938b87]"
          htmlFor="termsAccepted"
        >
          <input
            aria-describedby={
              errors.termsAccepted ? "termsAccepted-error" : undefined
            }
            aria-invalid={Boolean(errors.termsAccepted)}
            checked={values.termsAccepted}
            className="h-3.5 w-3.5 rounded border-[#bdb4af] text-[#ed361c] accent-[#ed361c] focus:ring-[#ed361c]"
            id="termsAccepted"
            name="termsAccepted"
            onChange={updateTerms}
            type="checkbox"
          />
          <span>Tôi đồng ý với Điều khoản sử dụng</span>
        </label>
        {errors.termsAccepted && (
          <p
            className="mt-1.5 text-xs text-red-600"
            id="termsAccepted-error"
            role="alert"
          >
            {errors.termsAccepted}
          </p>
        )}
      </div>
      <button
        className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(239,63,27,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
        disabled={pending}
        type="submit"
      >
        {pending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </button>
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
        enabled={values.termsAccepted}
        returnTo={returnTo}
      />
      <p className="mt-5 text-center text-[11px] text-[#a8a09c]">
        Bạn đã có tài khoản?{" "}
        <Link
          className="cursor-pointer font-bold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          href={authUrl("/login", returnTo)}
        >
          Đăng nhập
        </Link>
      </p>
      <p className="mt-7 text-center text-[9px] text-[#c8c0bc]">
        © 2025 TOEICMaster. Học ngoại ngữ, mở ra thế giới.
      </p>
    </form>
  );
}
