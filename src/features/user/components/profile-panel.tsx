"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getProfile } from "@/features/user/api";
import type { UserProfile } from "@/features/user/profile";
import { Breadcrumbs } from "@/shared/components/practice/breadcrumbs";
import { ProfileWorkspace } from "./profile-workspace";

export function ProfilePanel({
  initialProfile,
}: {
  initialProfile?: UserProfile;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(
    initialProfile ?? null,
  );
  const [loading, setLoading] = useState(!initialProfile);
  const [loadError, setLoadError] = useState<string>();
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(undefined);
    try {
      setProfile(await getProfile());
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        router.replace("/login?next=%2Fprofile");
      }
      setLoadError("Không thể tải hồ sơ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (initialProfile) return;
    let active = true;
    getProfile()
      .then((nextProfile) => {
        if (active) setProfile(nextProfile);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        if (reason instanceof ApiError && reason.status === 401) {
          router.replace("/login?next=%2Fprofile");
        }
        setLoadError("Không thể tải hồ sơ. Vui lòng thử lại.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialProfile, router]);

  // The popup in the header edits the same profile.
  useEffect(() => {
    const sync = (event: Event) =>
      setProfile((event as CustomEvent<UserProfile>).detail);
    window.addEventListener("profile:updated", sync);
    return () => window.removeEventListener("profile:updated", sync);
  }, []);

  if (!profile) {
    return (
      <section aria-labelledby="profile-heading" aria-live="polite">
        <h1 className="sr-only" id="profile-heading">
          Hồ sơ cá nhân
        </h1>
        {loading ? (
          <output aria-label="Đang tải hồ sơ">
            <div className="h-6 w-40 animate-pulse rounded bg-[#eee8e5]" />
            <div className="mt-4 h-12 animate-pulse rounded-xl bg-[#f5f1ef]" />
            <div className="mt-3 h-12 animate-pulse rounded-xl bg-[#f5f1ef]" />
            <div className="mt-3 h-12 animate-pulse rounded-xl bg-[#f5f1ef]" />
          </output>
        ) : (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            <p>{loadError}</p>
            <button
              className="mt-3 font-semibold underline"
              onClick={() => void load()}
              type="button"
            >
              Thử lại
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section aria-labelledby="profile-heading">
      <Breadcrumbs
        items={[{ label: "Trang chủ", href: "/" }, { label: "Hồ sơ cá nhân" }]}
      />
      <h1
        className="mt-2 text-[32px] font-bold leading-tight text-[#2f2b28]"
        id="profile-heading"
      >
        Hồ sơ &amp; mục tiêu học tập
      </h1>
      <p className="mt-2 text-[15px] text-[#6b655f]">
        Cá nhân hóa hành trình chinh phục TOEIC của bạn.
      </p>

      <div className="mt-6">
        <ProfileWorkspace onSaved={setProfile} profile={profile} />
      </div>
    </section>
  );
}
