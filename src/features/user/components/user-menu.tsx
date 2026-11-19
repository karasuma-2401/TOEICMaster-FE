"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AuthError,
  getSession,
  logout,
  refreshSession,
  type SessionState,
} from "@/features/auth/api";
import { ApiError, avatarUrl, getProfile } from "@/features/user/api";
import { type UserProfile, getInitials } from "@/features/user/profile";
import { focusRing } from "@/shared/components/practice/styles";

export interface UserMenuProps {
  initialUser?: UserProfile | null;
  initialOpen?: boolean;
}

const menuLink = `flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-[#3d3935] transition hover:bg-[#fdf3ea] ${focusRing}`;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
      .then(async (state) => {
        if (!active) return;
        if (state.status !== "authenticated") {
          setUser(null);
          return;
        }
        setUser(await getProfile());
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

  useEffect(() => {
    if (initialUser !== undefined) return;
    let active = true;
    const reload = () => {
      void getProfile()
        .then((profile) => {
          if (active) setUser(profile);
        })
        .catch((reason: unknown) => {
          if (!active) return;
          if (reason instanceof ApiError && reason.status === 401) {
            setUser(null);
            return;
          }
          setError("Không thể tải hồ sơ cá nhân.");
        });
    };
    window.addEventListener("profile:updated", reload);
    return () => {
      active = false;
      window.removeEventListener("profile:updated", reload);
    };
  }, [initialUser]);

  // Escape and outside clicks close the menu, matching dialog expectations.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [isOpen]);

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

  // Khách chưa có hồ sơ nên chỉ thấy lựa chọn đăng nhập/đăng ký.
  if (!user) {
    return (
      <div className="flex flex-col gap-1 md:items-end">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2.5">
          <Link
            className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#ece9e5] text-sm font-semibold md:h-auto md:rounded-none md:border-0 text-[#4e4542] transition hover:text-[#ed361c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
            href="/login"
          >
            Đăng nhập
          </Link>
          <Link
            className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#ec251b] to-[#ff6c0d] px-3.5 text-sm font-bold md:h-9 md:text-xs text-white shadow-[0_6px_14px_rgba(239,63,27,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3f1b]"
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
  const imageUrl = avatarUrl(user);

  return (
    <div className="flex flex-col items-end gap-1" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Mở menu tài khoản"
        className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#ffd49e] bg-gradient-to-br from-[#ffd361] to-[#f17939] text-sm font-bold text-[#841013] shadow-sm transition hover:scale-105 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c]"
        data-testid="user-menu-trigger"
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        {imageUrl ? (
          <Image
            alt={`Ảnh đại diện của ${user.displayName}`}
            className="absolute inset-0 h-full w-full rounded-full object-cover"
            fill
            sizes="40px"
            src={imageUrl}
            unoptimized
          />
        ) : (
          initials
        )}
      </button>

      {isOpen ? (
        <div className="relative">
          <div
            aria-label="Menu tài khoản"
            className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-[#ece9e5] bg-white p-2 shadow-[0_12px_32px_-12px_rgb(62_44_30/35%)]"
            role="menu"
          >
            <div className="border-b border-[#f1ede9] px-3 pt-1 pb-3">
              <p className="truncate text-sm font-semibold text-[#2f2b28]">
                {user.displayName}
              </p>
              <p className="truncate text-xs text-[#6b655f]">{user.email}</p>
            </div>
            <div className="mt-1 flex flex-col">
              <Link
                className={menuLink}
                href="/profile"
                onClick={handleClose}
                role="menuitem"
              >
                Hồ sơ cá nhân
              </Link>
              <Link
                className={menuLink}
                href="/history"
                onClick={handleClose}
                role="menuitem"
              >
                Lịch sử làm bài
              </Link>
              <button
                className={`${menuLink} text-left disabled:cursor-not-allowed disabled:opacity-60`}
                disabled={pending}
                onClick={() => void handleLogout()}
                role="menuitem"
                type="button"
              >
                {pending ? "Đang đăng xuất…" : "Đăng xuất"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pending && <span className="sr-only">Đang đăng xuất...</span>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
