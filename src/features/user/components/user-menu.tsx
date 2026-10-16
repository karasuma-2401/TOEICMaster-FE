"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AuthError,
  getSession,
  logout,
  refreshSession,
  type SessionState,
} from "@/features/auth/api";
import { type UserProfile, getInitials } from "@/features/user/profile";
import { ProfileDialog } from "./profile-dialog";

export interface UserMenuProps {
  initialUser?: UserProfile | null;
  initialOpen?: boolean;
}

export function UserMenu({ initialUser, initialOpen = false }: UserMenuProps) {
  const [user, setUser] = useState<UserProfile | null | undefined>(initialUser);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    if (initialOpen) return true;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("profile") === "1" && Boolean(initialUser);
    }
    return false;
  });

  useEffect(() => {
    if (initialUser !== undefined) return;

    let active = true;

    async function currentSession(): Promise<SessionState> {
      let state = await getSession();
      if (state.status !== "refresh_required") return state;

      const rotate = async () => {
        const latest = await getSession();
        if (latest.status !== "refresh_required") return latest;
        try {
          return {
            status: "authenticated" as const,
            user: await refreshSession(),
          };
        } catch (reason) {
          const after = await getSession();
          if (after.status === "authenticated") return after;
          throw reason;
        }
      };

      return navigator.locks
        ? navigator.locks.request("toeicmaster-refresh", rotate)
        : rotate();
    }

    currentSession()
      .then((state) => {
        if (!active) return;
        setUser(state.status === "authenticated" ? state.user : null);
      })
      .catch((reason) => {
        if (!active) return;
        setUser(null);
        if (!(reason instanceof AuthError && reason.status === 401)) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Không thể kiểm tra phiên đăng nhập.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [initialUser]);

  function handleClose() {
    setIsOpen(false);
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("profile=1")
    ) {
      const url = new URL(window.location.href);
      url.searchParams.delete("profile");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }

  async function handleLogout() {
    setPending(true);
    setError(undefined);
    try {
      if (initialUser === undefined) await logout();
      setUser(null);
      setIsOpen(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể đăng xuất.",
      );
    } finally {
      setPending(false);
    }
  }

  if (user === undefined) return null;

  // Nếu chưa đăng nhập: hiện nút Đăng nhập và Đăng ký
  if (!user) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2.5">
          <Link
            className="cursor-pointer text-sm font-semibold text-[#4e4542] transition hover:text-[#ed361c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
            href="/login"
          >
            Đăng nhập
          </Link>
          <Link
            className="flex h-9 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-3.5 text-xs font-bold text-white shadow-[0_6px_14px_rgba(239,63,27,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
            href="/register"
          >
            Đăng ký
          </Link>
        </div>
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  const initials = getInitials(user.displayName);

  return (
    <>
      <button
        aria-label="Mở hồ sơ cá nhân"
        className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#ffd49e] bg-gradient-to-br from-[#ffd361] to-[#f17939] text-sm font-bold text-[#841013] shadow-sm transition hover:scale-105 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {initials}
      </button>

      <ProfileDialog
        isOpen={isOpen}
        onClose={handleClose}
        onLogout={handleLogout}
        user={user}
      />
      {pending && <span className="sr-only">Đang đăng xuất...</span>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
