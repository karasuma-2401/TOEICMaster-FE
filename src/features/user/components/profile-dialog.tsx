"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { type UserProfile, getInitials } from "@/features/user/profile";
import { avatarUrl } from "@/features/user/api";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileForm } from "./profile-form";

type ProfileTab = "info" | "security";

export interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  onLogout?: () => void;
  onSaved?: (profile: UserProfile) => void;
}

export function ProfileDialog({
  isOpen,
  onClose,
  user,
  onLogout,
  onSaved,
}: ProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const initials = user ? getInitials(user.displayName) : "U";
  const imageUrl = user ? avatarUrl(user) : null;

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first focusable element inside the modal or the modal itself
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 10);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <dialog
        aria-labelledby="profile-dialog-title"
        aria-modal="true"
        className="relative m-0 max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[2rem] border border-[#eee8e5] bg-[#fffdfc] p-6 text-inherit shadow-2xl outline-none sm:p-8"
        open
        ref={dialogRef}
        tabIndex={-1}
      >
        {/* Nút đóng (X) */}
        <button
          aria-label="Đóng"
          className="absolute top-5 right-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#a89f9b] transition hover:bg-[#f5f1ef] hover:text-[#342d2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        {/* Thông tin học viên trên đầu popup */}
        <div className="flex items-center gap-3.5 pr-10">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#ffd49e] bg-gradient-to-br from-[#ffd361] to-[#f17939] text-base font-bold text-[#841013] shadow-sm">
            {imageUrl ? (
              <Image
                alt={`Ảnh đại diện của ${user.displayName}`}
                className="h-full w-full object-cover"
                fill
                sizes="48px"
                src={imageUrl}
                unoptimized
              />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-lg font-bold text-[#342d2a]"
              id="profile-dialog-title"
            >
              {user.displayName}
            </h2>
            <p className="truncate text-xs text-[#a89f9b]">{user.email}</p>
          </div>
        </div>

        {/* Eyebrow */}
        <p className="mt-5 flex items-center gap-3 text-[10px] font-bold tracking-[0.18em] text-[#ed361c] before:h-px before:w-6 before:bg-[#ed361c]">
          HỒ SƠ CỦA BẠN
        </p>

        {/* Tab điều hướng */}
        <nav
          aria-label="Quản lý hồ sơ"
          className="mt-4 grid grid-cols-2 rounded-xl bg-[#f5f1ef] p-1 text-sm font-bold"
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

        {/* Nội dung theo Tab */}
        <div className="mt-5">
          {activeTab === "info" ? (
            <ProfileForm
              initialValues={user}
              key={JSON.stringify(user)}
              onSaved={onSaved}
            />
          ) : (
            <ChangePasswordForm />
          )}
        </div>

        {/* Phần chân popup với nút Đăng xuất */}
        <div className="mt-6 flex items-center justify-between border-t border-[#eee8e5] pt-4 text-xs">
          <button
            className="inline-flex cursor-pointer items-center gap-2 font-semibold text-[#ed361c] transition hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
            onClick={onLogout}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            Đăng xuất
          </button>
          <span className="text-[10px] text-[#c8c0bc]">
            © 2025 TOEICMaster. Học ngoại ngữ, mở ra thế giới.
          </span>
        </div>
      </dialog>
    </div>
  );
}
