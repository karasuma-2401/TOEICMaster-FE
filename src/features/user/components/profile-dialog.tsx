"use client";

import { useEffect, useRef } from "react";
import type { UserProfile } from "@/features/user/profile";
import { ProfileWorkspace } from "./profile-workspace";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

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
        className="relative m-0 max-h-[90vh] w-full max-w-[1120px] overflow-y-auto rounded-[20px] border border-[#ece9e5] bg-[#f7f6f4] p-5 text-inherit shadow-2xl outline-none sm:p-7"
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

        <h2
          className="pr-10 text-[28px] font-bold leading-tight text-[#2f2b28]"
          id="profile-dialog-title"
        >
          Hồ sơ &amp; mục tiêu học tập
        </h2>
        <p className="mt-1.5 pr-10 text-[15px] text-[#6b655f]">
          Cá nhân hóa hành trình chinh phục TOEIC của bạn.
        </p>

        <div className="mt-5">
          <ProfileWorkspace onSaved={onSaved} profile={user} />
        </div>

        {/* Phần chân popup với nút Đăng xuất */}
        <div className="mt-5 flex items-center justify-between border-t border-[#e4dfda] pt-4 text-xs">
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
