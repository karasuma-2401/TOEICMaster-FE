"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import {
  type ProfileFieldErrors,
  type UserProfile,
  mockUserProfile,
  validateProfile,
} from "@/features/user/profile";

interface FormState {
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  targetScore: string;
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 20c.55-3.35 2.7-5 6.5-5s5.95 1.65 6.5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M3 5.5A2.5 2.5 0 0 1 5.5 3h2.25a2 2 0 0 1 1.95 1.56l.72 3.12a2 2 0 0 1-.57 1.92l-1.5 1.5a13.06 13.06 0 0 0 5.5 5.5l1.5-1.5a2 2 0 0 1 1.92-.57l3.12.72A2 2 0 0 1 21 16.25V18.5a2.5 2.5 0 0 1-2.5 2.5h-1C9.61 21 3 14.39 3 6.5v-1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="17"
        x="3.5"
        y="4.5"
      />
      <path
        d="M8 2.5v4M16 2.5v4M3.5 9.5h17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" fill="currentColor" r="1.5" />
    </svg>
  );
}

export function ProfileForm({
  initialValues = mockUserProfile,
}: {
  initialValues?: UserProfile;
}) {
  const normalizedInitial: FormState = {
    displayName: initialValues.displayName ?? "",
    email: initialValues.email ?? "",
    phone: initialValues.phone ?? "",
    dateOfBirth: initialValues.dateOfBirth ?? "",
    targetScore:
      initialValues.targetScore !== undefined
        ? String(initialValues.targetScore)
        : "",
  };

  const [values, setValues] = useState<FormState>(normalizedInitial);
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [notice, setNotice] = useState<string>();

  const isChanged =
    values.displayName !== normalizedInitial.displayName ||
    values.phone !== normalizedInitial.phone ||
    values.dateOfBirth !== normalizedInitial.dateOfBirth ||
    values.targetScore !== normalizedInitial.targetScore;

  function updateValue(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ProfileFieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setNotice(undefined);
  }

  function handleReset() {
    setValues(normalizedInitial);
    setErrors({});
    setNotice(undefined);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateProfile({
      displayName: values.displayName,
      email: values.email,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth,
      targetScore: values.targetScore ? Number(values.targetScore) : undefined,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setNotice(
      "Tính năng cập nhật hồ sơ đang được hoàn thiện. Thông tin của bạn chưa được gửi đi.",
    );
  }

  return (
    <form noValidate onSubmit={submit}>
      <div className="space-y-3.5">
        {/* Tên hiển thị */}
        <div>
          <label
            className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
            htmlFor="displayName"
          >
            Tên hiển thị
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#beb7b3]">
              <UserIcon />
            </span>
            <input
              aria-describedby={
                errors.displayName ? "displayName-error" : undefined
              }
              aria-invalid={Boolean(errors.displayName)}
              autoComplete="name"
              className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-11 pr-4 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
              id="displayName"
              name="displayName"
              onChange={updateValue}
              placeholder="Tên của bạn"
              type="text"
              value={values.displayName}
            />
          </div>
          {errors.displayName && (
            <p
              className="mt-1.5 text-xs text-red-600"
              id="displayName-error"
              role="alert"
            >
              {errors.displayName}
            </p>
          )}
        </div>

        {/* Email (chỉ đọc) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              className="block text-[11px] font-bold text-[#4e4542]"
              htmlFor="email"
            >
              Email
            </label>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              <svg
                aria-hidden="true"
                className="h-3 w-3"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  clipRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  fillRule="evenodd"
                />
              </svg>
              Đã xác minh
            </span>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#beb7b3]">
              <EmailIcon />
            </span>
            <input
              aria-readonly="true"
              autoComplete="email"
              className="h-12 w-full cursor-not-allowed rounded-xl border border-[#e7deda] bg-[#f8f6f5] px-11 pr-4 text-sm text-[#736a66] outline-none"
              id="email"
              name="email"
              readOnly
              type="email"
              value={values.email}
            />
          </div>
        </div>

        {/* Số điện thoại */}
        <div>
          <label
            className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
            htmlFor="phone"
          >
            Số điện thoại
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#beb7b3]">
              <PhoneIcon />
            </span>
            <input
              aria-describedby={errors.phone ? "phone-error" : undefined}
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-11 pr-4 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
              id="phone"
              name="phone"
              onChange={updateValue}
              placeholder="VD: 0912345678 hoặc +84912345678"
              type="tel"
              value={values.phone}
            />
          </div>
          {errors.phone && (
            <p
              className="mt-1.5 text-xs text-red-600"
              id="phone-error"
              role="alert"
            >
              {errors.phone}
            </p>
          )}
        </div>

        {/* Ngày sinh */}
        <div>
          <label
            className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
            htmlFor="dateOfBirth"
          >
            Ngày sinh
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#beb7b3]">
              <CalendarIcon />
            </span>
            <input
              aria-describedby={
                errors.dateOfBirth ? "dateOfBirth-error" : undefined
              }
              aria-invalid={Boolean(errors.dateOfBirth)}
              autoComplete="bday"
              className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-11 pr-4 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
              id="dateOfBirth"
              name="dateOfBirth"
              onChange={updateValue}
              type="date"
              value={values.dateOfBirth}
            />
          </div>
          {errors.dateOfBirth && (
            <p
              className="mt-1.5 text-xs text-red-600"
              id="dateOfBirth-error"
              role="alert"
            >
              {errors.dateOfBirth}
            </p>
          )}
        </div>

        {/* Điểm TOEIC mục tiêu */}
        <div>
          <label
            className="mb-1.5 block text-[11px] font-bold text-[#4e4542]"
            htmlFor="targetScore"
          >
            Điểm TOEIC mục tiêu
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#beb7b3]">
              <TargetIcon />
            </span>
            <input
              aria-describedby={
                errors.targetScore ? "targetScore-error" : undefined
              }
              aria-invalid={Boolean(errors.targetScore)}
              className="h-12 w-full rounded-xl border border-[#e7deda] bg-[#fffdfc] px-11 pr-4 text-sm text-[#3d3532] outline-none transition placeholder:text-[#c9c1bd] focus:border-[#ed361c] focus:ring-2 focus:ring-[#ffe2d8] aria-[invalid=true]:border-red-500"
              id="targetScore"
              max={990}
              min={10}
              name="targetScore"
              onChange={updateValue}
              placeholder="10 - 990 (bội số của 5)"
              step={5}
              type="number"
              value={values.targetScore}
            />
          </div>
          {errors.targetScore && (
            <p
              className="mt-1.5 text-xs text-red-600"
              id="targetScore-error"
              role="alert"
            >
              {errors.targetScore}
            </p>
          )}
        </div>
      </div>

      {/* Nút hành động */}
      <div className="mt-6 flex items-center gap-3">
        <button
          className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(239,63,27,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
          disabled={!isChanged}
          type="submit"
        >
          Lưu thay đổi
        </button>
        <button
          className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-[#e4dcda] bg-white px-5 text-sm font-semibold text-[#615957] transition hover:bg-[#fff8f5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          disabled={!isChanged}
          onClick={handleReset}
          type="button"
        >
          Hủy
        </button>
      </div>

      {notice && (
        <output className="mt-4 block rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
          {notice}
        </output>
      )}
    </form>
  );
}
