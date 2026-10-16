"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type UserProfile,
  getInitials,
  mockUserProfile,
} from "@/features/user/profile";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileForm } from "./profile-form";

type ProfileTab = "info" | "security";

export function ProfilePanel({
  initialProfile = mockUserProfile,
}: {
  initialProfile?: UserProfile;
}) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const initials = getInitials(initialProfile.displayName);

  return (
    <section aria-labelledby="profile-heading">
      {/* Mobile-only compact user card & home navigation */}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-[#eee8e5] bg-[#faf6f3] p-3.5 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#ffd49e] bg-gradient-to-br from-[#ffd361] to-[#f17939] text-sm font-bold text-[#841013]">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#342d2a]">
              {initialProfile.displayName}
            </p>
            <p className="truncate text-xs text-[#a89f9b]">
              {initialProfile.email}
            </p>
          </div>
        </div>
        <Link
          className="shrink-0 text-xs font-semibold text-[#ed361c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          href="/"
        >
          Trang chủ
        </Link>
      </div>

      <p className="flex items-center gap-3 text-[10px] font-bold tracking-[0.18em] text-[#ed361c] before:h-px before:w-6 before:bg-[#ed361c]">
        TÀI KHOẢN CỦA BẠN
      </p>
      <h1
        className="mt-4 text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[#342d2a]"
        id="profile-heading"
      >
        Hồ sơ cá nhân
      </h1>
      <p className="mt-2 text-[13px] leading-5 text-[#a89f9b]">
        Quản lý thông tin tài khoản và thiết lập bảo mật của bạn.
      </p>

      {/* Tabs */}
      <nav
        aria-label="Quản lý hồ sơ"
        className="mt-6 grid grid-cols-2 rounded-xl bg-[#f5f1ef] p-1 text-sm font-bold"
      >
        <button
          aria-current={activeTab === "info" ? "page" : undefined}
          className={`flex h-10 cursor-pointer items-center justify-center rounded-[0.6rem] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c] ${
            activeTab === "info"
              ? "bg-white text-[#ed361c] shadow-[0_3px_8px_rgba(67,47,38,0.12)]"
              : "text-[#b7aeaa] hover:text-[#736a66]"
          }`}
          onClick={() => setActiveTab("info")}
          type="button"
        >
          Thông tin
        </button>
        <button
          aria-current={activeTab === "security" ? "page" : undefined}
          className={`flex h-10 cursor-pointer items-center justify-center rounded-[0.6rem] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c] ${
            activeTab === "security"
              ? "bg-white text-[#ed361c] shadow-[0_3px_8px_rgba(67,47,38,0.12)]"
              : "text-[#b7aeaa] hover:text-[#736a66]"
          }`}
          onClick={() => setActiveTab("security")}
          type="button"
        >
          Bảo mật
        </button>
      </nav>

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === "info" ? (
          <ProfileForm initialValues={initialProfile} />
        ) : (
          <ChangePasswordForm />
        )}
      </div>

      <p className="mt-7 text-center text-[9px] text-[#c8c0bc]">
        © 2025 TOEICMaster. Học ngoại ngữ, mở ra thế giới.
      </p>
    </section>
  );
}
