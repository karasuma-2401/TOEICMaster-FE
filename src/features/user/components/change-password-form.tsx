"use client";

import { type ChangeEvent, type FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, changePassword } from "@/features/user/api";
import {
  type PasswordChangeField,
  type PasswordChangeFieldErrors,
  type PasswordChangeInput,
  validatePasswordChange,
} from "@/features/user/profile";
import { toast } from "@/shared/ui/toast";
import {
  profileInput,
  profileLabel,
  profileOutlineButton,
} from "./profile-styles";

const initialValues: PasswordChangeInput = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

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
      className="absolute bottom-0 right-0 top-2 flex w-11 cursor-pointer items-center justify-center text-[#b6b0ad] transition hover:text-[#ed361c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
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

const passwordFields: Array<{
  name: PasswordChangeField;
  label: string;
  autoComplete: string;
  placeholder: string;
}> = [
  {
    name: "currentPassword",
    label: "Mật khẩu hiện tại",
    autoComplete: "current-password",
    placeholder: "Nhập mật khẩu hiện tại",
  },
  {
    name: "newPassword",
    label: "Mật khẩu mới",
    autoComplete: "new-password",
    placeholder: "Tối thiểu 8 ký tự",
  },
  {
    name: "confirmPassword",
    label: "Xác nhận mật khẩu mới",
    autoComplete: "new-password",
    placeholder: "Nhập lại mật khẩu mới",
  },
];

export function ChangePasswordForm({
  hasPassword = true,
}: {
  hasPassword?: boolean;
}) {
  // The popup can be open on top of the profile page.
  const id = useId();
  const [values, setValues] = useState<PasswordChangeInput>(initialValues);
  const [errors, setErrors] = useState<PasswordChangeFieldErrors>({});
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<PasswordChangeField, boolean>
  >({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);
  const router = useRouter();

  function updateValue(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    const fieldName = name as PasswordChangeField;
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
    setNotice(undefined);
  }

  function toggleVisibility(field: PasswordChangeField) {
    setVisiblePasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validatePasswordChange(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    setNotice(undefined);
    try {
      await changePassword(values);
      setValues(initialValues);
      setErrors({});
      toast.success("Đổi mật khẩu thành công.");
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 400) {
        // Backend reports a wrong current password with a title only, no field errors.
        setErrors(
          Object.keys(reason.fieldErrors).length > 0
            ? (reason.fieldErrors as PasswordChangeFieldErrors)
            : { currentPassword: reason.message },
        );
      } else if (reason instanceof ApiError && reason.status === 429) {
        setNotice(
          `Thao tác quá nhanh, thử lại sau ${reason.retryAfter ?? 0} giây.`,
        );
      } else if (reason instanceof ApiError && reason.status === 401) {
        router.replace("/login?next=%2Fprofile");
      } else {
        toast.error("Không thể đổi mật khẩu. Vui lòng thử lại.");
      }
    } finally {
      setPending(false);
    }
  }

  if (!hasPassword) {
    return (
      <p className="text-sm text-[#736a66]">
        Tài khoản đăng nhập bằng Google, không có mật khẩu.
      </p>
    );
  }

  return (
    <form noValidate onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-3">
        {passwordFields.map((field) => {
          const error = errors[field.name];
          const isVisible = visiblePasswords[field.name];
          const fieldId = `${id}-${field.name}`;
          return (
            <div key={field.name}>
              <label className={profileLabel} htmlFor={fieldId}>
                {field.label}
              </label>
              <div className="relative">
                <input
                  aria-describedby={error ? `${fieldId}-error` : undefined}
                  aria-invalid={Boolean(error)}
                  autoComplete={field.autoComplete}
                  className={`${profileInput} pr-12`}
                  id={fieldId}
                  name={field.name}
                  onChange={updateValue}
                  placeholder={field.placeholder}
                  type={isVisible ? "text" : "password"}
                  value={values[field.name]}
                />
                <PasswordToggle
                  isVisible={isVisible}
                  onClick={() => toggleVisibility(field.name)}
                />
              </div>
              {error && (
                <p
                  className="mt-1.5 text-xs text-red-600"
                  id={`${fieldId}-error`}
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[13px] text-[#6b655f]">
        Mật khẩu cần từ 8 đến 128 ký tự.
      </p>

      <button
        className={`mt-4 ${profileOutlineButton}`}
        disabled={pending}
        type="submit"
      >
        {pending ? "Đang đổi mật khẩu..." : "Cập nhật mật khẩu"}
      </button>

      {notice && (
        <output className="mt-4 block rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
          {notice}
        </output>
      )}
    </form>
  );
}
