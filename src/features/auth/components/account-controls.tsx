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
import { toast } from "@/shared/ui/toast";

async function currentSession(): Promise<SessionState> {
  let state = await getSession();
  if (state.status !== "refresh_required") return state;
  const rotate = async () => {
    const latest = await getSession();
    if (latest.status !== "refresh_required") return latest;
    try {
      return { status: "authenticated" as const, user: await refreshSession() };
    } catch (error) {
      const after = await getSession();
      if (after.status === "authenticated") return after;
      throw error;
    }
  };
  state = navigator.locks
    ? await navigator.locks.request("toeicmaster-refresh", rotate)
    : await rotate();
  return state;
}

export function AccountControls() {
  const [state, setState] = useState<SessionState>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    currentSession()
      .then((value) => {
        if (active) setState(value);
      })
      .catch((reason) => {
        if (!active) return;
        if (reason instanceof AuthError && reason.status === 401)
          setState({ status: "guest" });
        else
          setError(
            reason instanceof Error
              ? reason.message
              : "Không thể kiểm tra phiên đăng nhập.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    setPending(true);
    setError(undefined);
    try {
      await logout();
      setState({ status: "guest" });
      toast.success("Đã đăng xuất.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể đăng xuất.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 text-sm">
      {state?.status === "authenticated" ? (
        <div className="flex items-center gap-3">
          <span>Xin chào, {state.user.displayName}</span>
          <button
            className="rounded-md px-2 py-1 text-[var(--admin-brand-red)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
            disabled={pending}
            onClick={signOut}
            type="button"
          >
            {pending ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      ) : state?.status === "guest" || error ? (
        <div className="flex gap-3">
          <Link
            className="text-[var(--admin-brand-red)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
            href="/login"
          >
            Đăng nhập
          </Link>
          <Link
            className="text-[var(--admin-brand-red)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
            href="/register"
          >
            Đăng ký
          </Link>
        </div>
      ) : null}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
