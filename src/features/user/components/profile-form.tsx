"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ApiError,
  avatarUrl,
  updateProfile,
  uploadAvatar,
} from "@/features/user/api";
import {
  type ProfileFieldErrors,
  type UserProfile,
  toUpdateRequest,
  validateAvatarFile,
  validateProfile,
} from "@/features/user/profile";
import { toast } from "@/shared/ui/toast";

interface FormState {
  displayName: string;
  email: string;
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

export function ProfileForm({
  initialValues,
  onSaved,
}: {
  initialValues: UserProfile;
  onSaved?: (profile: UserProfile) => void;
}) {
  const normalizedInitial = useMemo<FormState>(
    () => ({
      displayName: initialValues.displayName,
      email: initialValues.email,
    }),
    [initialValues],
  );

  const [values, setValues] = useState<FormState>(normalizedInitial);
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatarError, setAvatarError] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isChanged = values.displayName !== normalizedInitial.displayName;

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const nextErrors = validateProfile({
      displayName: values.displayName,
      email: values.email,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    submitLock.current = true;
    setNotice(undefined);
    try {
      const profile = await updateProfile(toUpdateRequest(values));
      setValues({
        displayName: profile.displayName,
        email: profile.email,
      });
      setErrors({});
      onSaved?.(profile);
      toast.success("Đã lưu thông tin.");
      window.dispatchEvent(
        new CustomEvent("profile:updated", { detail: profile }),
      );
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 400) {
        setErrors(reason.fieldErrors as ProfileFieldErrors);
      } else if (reason instanceof ApiError && reason.status === 429) {
        setNotice(
          `Thao tác quá nhanh, thử lại sau ${reason.retryAfter ?? 0} giây.`,
        );
      } else if (reason instanceof ApiError && reason.status === 401) {
        router.replace("/login?next=%2Fprofile");
      } else {
        toast.error("Không thể cập nhật hồ sơ. Vui lòng thử lại.");
      }
    } finally {
      submitLock.current = false;
      setPending(false);
    }
  }

  async function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    setAvatarError(undefined);
    if (!file) return;
    const validation = validateAvatarFile(file);
    if (validation) {
      setAvatarError(validation);
      return;
    }

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setAvatarPending(true);
    try {
      const profile = await uploadAvatar(file);
      setPreviewUrl(undefined);
      onSaved?.(profile);
      window.dispatchEvent(
        new CustomEvent("profile:updated", { detail: profile }),
      );
    } catch (reason) {
      setPreviewUrl(undefined);
      setAvatarError(
        reason instanceof ApiError
          ? (reason.fieldErrors.avatar ?? reason.message)
          : "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.",
      );
      if (reason instanceof ApiError && reason.status === 401)
        router.replace("/login?next=%2Fprofile");
    } finally {
      setAvatarPending(false);
    }
  }

  return (
    <form noValidate onSubmit={submit}>
      <div className="mb-5 flex items-center gap-3">
        <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#ffd49e] bg-gradient-to-br from-[#ffd361] to-[#f17939] text-base font-bold text-[#841013]">
          {previewUrl || avatarUrl(initialValues) ? (
            <Image
              alt={`Ảnh đại diện của ${initialValues.displayName}`}
              className="h-full w-full object-cover"
              fill
              sizes="48px"
              src={previewUrl ?? avatarUrl(initialValues)!}
              unoptimized
            />
          ) : (
            initialValues.displayName.slice(0, 1).toUpperCase()
          )}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <input
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="sr-only"
            onChange={selectAvatar}
            ref={fileInputRef}
            type="file"
          />
          <button
            className="cursor-pointer text-xs font-semibold text-[#ed361c] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            disabled={avatarPending}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {avatarPending ? "Đang cập nhật ảnh..." : "Đổi ảnh đại diện"}
          </button>
        </div>
      </div>
      {avatarError && (
        <p className="mb-4 text-xs text-red-600" role="alert">
          {avatarError}
        </p>
      )}
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
      </div>

      {/* Nút hành động */}
      <div className="mt-6 flex items-center gap-3">
        <button
          className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(239,63,27,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
          disabled={!isChanged || pending}
          type="submit"
        >
          Lưu thay đổi
        </button>
        <button
          className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-[#e4dcda] bg-white px-5 text-sm font-semibold text-[#615957] transition hover:bg-[#fff8f5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          disabled={!isChanged || pending}
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
