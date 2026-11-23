"use client";

import type { UserProfile } from "@/features/user/profile";
import { AttemptHistorySection } from "@/features/history/components/attempt-history-section";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileDetailsCard } from "./profile-details-card";
import { ProfileGoalCard } from "./profile-goal-card";
import { ProfileSettingsCard } from "./profile-settings-card";
import { profileCard } from "./profile-styles";
import { SavedLessons } from "@/features/knowledge/components/saved-lessons";

function SectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#2f2b28]" id={id}>
        {title}
      </h2>
      <p className="mt-1 text-sm text-[#6b655f]">{description}</p>
    </div>
  );
}

/**
 * One scrollable page with all four profile sections: personal details and
 * goal, attempt history, security and real persisted settings. No tabs.
 */
export function ProfileWorkspace({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved?: (profile: UserProfile) => void;
}) {
  return (
    <div className="flex flex-col gap-10">
      <SavedLessons />
      <section
        aria-labelledby="profile-section-title"
        data-testid="profile-section-details"
        id="profile-section"
      >
        <SectionHeading
          description="Update your personal information and TOEIC score goal."
          id="profile-section-title"
          title="Personal Information & Goal"
        />
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <ProfileDetailsCard
            key={`${profile.displayName}|${profile.phone}|${profile.dateOfBirth ?? ""}`}
            onSaved={onSaved}
            profile={profile}
          />
          <ProfileGoalCard
            key={profile.targetScore ?? "none"}
            onSaved={onSaved}
            profile={profile}
          />
        </div>
      </section>

      <section
        aria-label="Exam attempt history"
        data-testid="profile-section-history"
        id="history-section"
      >
        <AttemptHistorySection
          description="All L&R, Speaking, and Writing attempts are saved here."
          limit={3}
          showFilter
          showSummary
          title="Exam attempt history"
        />
      </section>

      <section
        aria-labelledby="security-section-title"
        data-testid="profile-section-security"
        id="security-section"
      >
        <SectionHeading
          description="Manage your password and how you sign in to TOEICMaster."
          id="security-section-title"
          title="Security"
        />
        <div className={`mt-4 ${profileCard}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-[#3d3935]">
              Change password
            </h3>
            <span className="rounded-lg bg-[#f7f6f4] px-2.5 py-1 text-xs font-semibold text-[#6b655f]">
              {profile.hasPassword ? "Email" : "Google"}
            </span>
          </div>
          <div className="mt-5">
            <ChangePasswordForm hasPassword={profile.hasPassword} />
          </div>
          <p className="mt-5 border-t border-[#ece9e5] pt-4 text-xs leading-5 text-[#6b655f]">
            When you change your password, other active sessions remain valid
            until they expire. Sign out on devices you no longer use to revoke
            access.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="settings-section-title"
        data-testid="profile-section-settings"
        id="settings-section"
      >
        <SectionHeading
          description="Only preferences actually used by the application."
          id="settings-section-title"
          title="Settings"
        />
        <div className="mt-4">
          <ProfileSettingsCard />
        </div>
      </section>
    </div>
  );
}
