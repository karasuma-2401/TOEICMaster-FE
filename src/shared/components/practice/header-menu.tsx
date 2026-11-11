"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { focusRing } from "./styles";

const desktopQuery = "(min-width: 48rem)";
const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Below the `md` breakpoint the children move into a sidebar opened by a menu
 * button. From `md` up the wrappers use `display: contents`, so the children
 * lay out directly inside the header as before.
 */
export function HeaderMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const panelId = useId();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const toggle = toggleRef.current;

    const desktop = window.matchMedia(desktopQuery);
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);

    function handleKeyDown(event: KeyboardEvent) {
      const panel = panelRef.current;
      // A dialog opened from the sidebar (e.g. the profile) handles its own keys.
      if (!panel || panel.querySelector("dialog[open]")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    // Following a link closes the sidebar, even when it targets the current page.
    const panel = panelRef.current;
    function closeOnLink(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest("a")) {
        setOpen(false);
      }
    }
    panel?.addEventListener("click", closeOnLink);

    return () => {
      document.body.style.overflow = originalOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("keydown", handleKeyDown);
      panel?.removeEventListener("click", closeOnLink);
      if (!window.matchMedia(desktopQuery).matches) toggle?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label="Mở menu"
        className={`flex h-10 w-10 cursor-pointer items-center justify-center justify-self-end rounded-xl border border-[#ece9e5] text-[#3d3935] transition hover:bg-[#f7f6f4] md:hidden ${focusRing}`}
        onClick={() => setOpen(true)}
        ref={toggleRef}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      <div
        className={
          open ? "fixed inset-0 z-50 md:contents" : "hidden md:contents"
        }
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
        <div
          aria-labelledby={open ? titleId : undefined}
          aria-modal={open ? true : undefined}
          className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col gap-6 overflow-y-auto bg-white p-5 shadow-2xl md:contents"
          id={panelId}
          ref={panelRef}
          role={open ? "dialog" : undefined}
        >
          <div className="flex items-center justify-between md:hidden">
            <p className="text-lg font-bold text-[#2f2b28]" id={titleId}>
              Menu
            </p>
            <button
              aria-label="Đóng menu"
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#6b655f] transition hover:bg-[#f7f6f4] hover:text-[#2f2b28] ${focusRing}`}
              onClick={() => setOpen(false)}
              ref={closeRef}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18 18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
