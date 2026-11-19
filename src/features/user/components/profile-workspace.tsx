"use client";

import type { UserProfile } from "@/features/user/profile";
import { AttemptHistorySection } from "@/features/history/components/attempt-history-section";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileDetailsCard } from "./profile-details-card";
import { ProfileGoalCard } from "./profile-goal-card";
import { ProfileSettingsCard } from "./profile-settings-card";
import { profileCard } from "./profile-styles";

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
      <section
        aria-labelledby="profile-section-title"
        data-testid="profile-section-details"
        id="profile-section"
      >
        <SectionHeading
          description="Cập nhật thông tin cá nhân và mục tiêu điểm TOEIC của bạn."
          id="profile-section-title"
          title="Hồ sơ cá nhân & Mục tiêu học tập"
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
        aria-label="Lịch sử các đề thi đã làm"
        data-testid="profile-section-history"
        id="history-section"
      >
        <AttemptHistorySection
          description="Mọi lượt thi L&R, Speaking và Writing được lưu tại đây."
          limit={3}
          showFilter
          showSummary
          title="Lịch sử các đề thi đã làm"
        />
      </section>

      <section
        aria-labelledby="security-section-title"
        data-testid="profile-section-security"
        id="security-section"
      >
        <SectionHeading
          description="Quản lý mật khẩu và cách bạn đăng nhập TOEICMaster."
          id="security-section-title"
          title="Bảo mật"
        />
        <div className={`mt-4 ${profileCard}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-[#3d3935]">
              Đổi mật khẩu
            </h3>
            <span className="rounded-lg bg-[#f7f6f4] px-2.5 py-1 text-xs font-semibold text-[#6b655f]">
              {profile.hasPassword ? "Email" : "Google"}
            </span>
          </div>
          <div className="mt-5">
            <ChangePasswordForm hasPassword={profile.hasPassword} />
          </div>
          <p className="mt-5 border-t border-[#ece9e5] pt-4 text-xs leading-5 text-[#6b655f]">
            Khi bạn đổi mật khẩu, các phiên đăng nhập khác vẫn giữ hiệu lực cho
            đến khi hết hạn. Hãy đăng xuất trên thiết bị không dùng nữa để thu
            hồi quyền truy cập.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="settings-section-title"
        data-testid="profile-section-settings"
        id="settings-section"
      >
        <SectionHeading
          description="Chỉ những tuỳ chọn thực sự được ứng dụng sử dụng."
          id="settings-section-title"
          title="Cài đặt"
        />
        <div className="mt-4">
          <ProfileSettingsCard />
        </div>
      </section>
    </div>
  );
}
