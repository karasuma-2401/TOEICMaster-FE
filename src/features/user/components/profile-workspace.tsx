"use client";

import type { UserProfile } from "@/features/user/profile";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileDetailsCard } from "./profile-details-card";
import { ProfileGoalCard } from "./profile-goal-card";
import { profileCard } from "./profile-styles";

/** Account, password and goal cards shown on the profile page and in the popup. */
export function ProfileWorkspace({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved?: (profile: UserProfile) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0 space-y-5">
        <ProfileDetailsCard
          key={`${profile.displayName}|${profile.phone}`}
          onSaved={onSaved}
          profile={profile}
        />
        <section className={profileCard}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-[#3d3935]">
              Đổi mật khẩu
            </h3>
            <span className="rounded-lg bg-[#f7f6f4] px-2.5 py-1 text-xs font-semibold text-[#6b655f]">
              {profile.hasPassword
                ? "Đăng ký bằng Email"
                : "Đăng nhập bằng Google"}
            </span>
          </div>
          <ChangePasswordForm hasPassword={profile.hasPassword} />
        </section>
      </div>
      <ProfileGoalCard
        key={profile.targetScore ?? "none"}
        onSaved={onSaved}
        profile={profile}
      />
    </div>
  );
}
