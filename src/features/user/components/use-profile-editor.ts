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
import { ApiError, updateProfile, uploadAvatar } from "@/features/user/api";
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
  phone: string;
  targetScore: string;
}

function toFormState(profile: UserProfile): FormState {
  return {
    displayName: profile.displayName,
    email: profile.email,
    phone: profile.phone ?? "",
    targetScore:
      profile.targetScore === null ? "" : String(profile.targetScore),
  };
}

/** Editing state of the account card; the target score is saved by its own card. */
export function useProfileEditor({
  initialValues,
  onSaved,
}: {
  initialValues: UserProfile;
  onSaved?: (profile: UserProfile) => void;
}) {
  const normalizedInitial = useMemo(
    () => toFormState(initialValues),
    [initialValues],
  );

  const [formValues, setValues] = useState<FormState>(normalizedInitial);
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatarError, setAvatarError] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);
  const router = useRouter();

  const values = {
    ...formValues,
    targetScore: normalizedInitial.targetScore,
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isChanged =
    values.displayName !== normalizedInitial.displayName ||
    values.phone !== normalizedInitial.phone;

  function updateValue(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ProfileFieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setNotice(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const nextErrors = validateProfile({
      displayName: values.displayName,
      email: values.email,
      phone: values.phone,
      targetScore: values.targetScore,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    submitLock.current = true;
    setNotice(undefined);
    try {
      const profile = await updateProfile(toUpdateRequest(values));
      setValues(toFormState(profile));
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

  return {
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
  };
}
