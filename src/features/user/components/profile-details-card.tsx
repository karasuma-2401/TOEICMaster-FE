"use client";

import { useId } from "react";
import Image from "next/image";
import { avatarUrl } from "@/features/user/api";
import { type UserProfile, getInitials } from "@/features/user/profile";
import {
  profileCard,
  profileInput,
  profileLabel,
  profilePrimaryButton,
} from "./profile-styles";
import { useProfileEditor } from "./use-profile-editor";

function CameraIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24">
      <path
        d="M7 10V7.5a5 5 0 0 1 10 0V10h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V7.5a3 3 0 0 0-6 0V10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600" id={id} role="alert">
      {message}
    </p>
  );
}

export function ProfileDetailsCard({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved?: (profile: UserProfile) => void;
}) {
  // The popup can be open on top of the profile page.
  const id = useId();
  const {
    values,
    errors,
    notice,
    pending,
    avatarPending,
    avatarError,
    previewUrl,
    fileInputRef,
    isChanged,
    updateValue,
    submit,
    selectAvatar,
  } = useProfileEditor({ initialValues: profile, onSaved });
  const imageUrl = previewUrl ?? avatarUrl(profile);

  return (
    <form className={profileCard} noValidate onSubmit={submit}>
      <div className="flex flex-wrap items-center gap-5">
        <input
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="sr-only"
          onChange={selectAvatar}
          ref={fileInputRef}
          type="file"
        />
        <button
          aria-label="Đổi ảnh đại diện"
          className="relative grid h-[88px] w-[88px] shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-[#fdf3ea] text-[#df5a28] transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#df5a28] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={avatarPending}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {imageUrl ? (
            <Image
              alt={`Ảnh đại diện của ${profile.displayName}`}
              className="h-full w-full object-cover"
              fill
              sizes="88px"
              src={imageUrl}
              unoptimized
            />
          ) : (
            <span className="flex flex-col items-center leading-none">
              <span className="text-2xl font-bold">
                {getInitials(profile.displayName)}
              </span>
              <span className="mt-1">
                <CameraIcon />
              </span>
            </span>
          )}
        </button>
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold text-[#3d3935]">
            {profile.displayName}
          </h3>
          <p className="mt-1 text-sm text-[#6b655f]">
            {avatarPending
              ? "Đang cập nhật ảnh..."
              : "Đổi ảnh đại diện · JPG, PNG tối đa 2 MB"}
          </p>
          <p className="mt-2 w-fit rounded-lg bg-[#e9f3ec] px-2.5 py-1 text-xs font-semibold text-[#3f7a52]">
            {profile.hasPassword ? "Tài khoản Email" : "Tài khoản Google"} · Đã
            xác minh
          </p>
        </div>
      </div>
      {avatarError && (
        <p className="mt-3 text-xs text-red-600" role="alert">
          {avatarError}
        </p>
      )}

      <div className="mt-6 grid gap-x-6 gap-y-4 md:grid-cols-2">
        <div>
          <label className={profileLabel} htmlFor={`${id}-displayName`}>
            Tên hiển thị
          </label>
          <input
            aria-describedby={
              errors.displayName ? `${id}-displayName-error` : undefined
            }
            aria-invalid={Boolean(errors.displayName)}
            autoComplete="name"
            className={profileInput}
            id={`${id}-displayName`}
            name="displayName"
            onChange={updateValue}
            placeholder="Tên của bạn"
            type="text"
            value={values.displayName}
          />
          <FieldError
            id={`${id}-displayName-error`}
            message={errors.displayName}
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <label className={profileLabel} htmlFor={`${id}-email`}>
              Email
            </label>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#3d3935]">
              · <LockIcon /> Chỉ đọc
            </span>
          </div>
          <input
            aria-readonly="true"
            autoComplete="email"
            className={`${profileInput} cursor-not-allowed bg-[#f7f6f4]! text-[#6b655f]!`}
            id={`${id}-email`}
            name="email"
            readOnly
            type="email"
            value={values.email}
          />
        </div>

        <div>
          <label className={profileLabel} htmlFor={`${id}-phone`}>
            Số điện thoại
          </label>
          <input
            aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
            aria-invalid={Boolean(errors.phone)}
            autoComplete="tel"
            className={profileInput}
            id={`${id}-phone`}
            name="phone"
            onChange={updateValue}
            placeholder="VD: 0912345678 hoặc +84912345678"
            type="tel"
            value={values.phone}
          />
          <FieldError id={`${id}-phone-error`} message={errors.phone} />
        </div>
      </div>

      <button
        className={`mt-6 ${profilePrimaryButton}`}
        disabled={!isChanged || pending}
        type="submit"
      >
        {pending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>

      {notice && (
        <output className="mt-4 block rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
          {notice}
        </output>
      )}
    </form>
  );
}
