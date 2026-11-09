"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { adminFocus } from "./admin-styles";

const gap = 6;
const edge = 8;

function SearchGlyph() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m10.25 10.25 3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/** Pins an open panel to its anchor in the top layer so cards cannot clip it. */
function useFloatingPanel(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  revision = 0,
) {
  const dismissRef = useRef(onDismiss);
  useLayoutEffect(() => {
    dismissRef.current = onDismiss;
  });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!open || !panel || !anchor) return;
    if (typeof panel.showPopover === "function") {
      panel.popover = "manual";
      if (!panel.matches(":popover-open")) panel.showPopover();
    }
    const box = anchor.getBoundingClientRect();
    panel.style.minWidth = `${box.width}px`;
    const height = panel.offsetHeight;
    const width = Math.max(panel.offsetWidth, box.width);
    const fitsBelow = box.bottom + gap + height <= window.innerHeight - edge;
    Object.assign(panel.style, {
      inset: "auto",
      margin: "0",
      left: `${Math.max(edge, Math.min(box.left, window.innerWidth - width - edge))}px`,
      top: `${fitsBelow ? box.bottom + gap : Math.max(edge, box.top - gap - height)}px`,
    });
  }, [open, revision, anchorRef, panelRef]);

  useEffect(() => {
    if (!open) return;
    const dismiss = () => dismissRef.current();
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !anchorRef.current?.contains(target)
      )
        dismiss();
    };
    const scrolled = (event: Event) => {
      if (!panelRef.current?.contains(event.target as Node)) dismiss();
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", scrolled, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("scroll", scrolled, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open, anchorRef, panelRef]);
}

export interface SearchSuggestion {
  /** Text placed in the search box when picked, usually the unique code. */
  value: string;
  label: string;
  hint?: string;
}

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

const panelClass =
  "fixed z-[90] max-h-72 overflow-y-auto rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1 text-[var(--admin-ink)] shadow-[0_8px_24px_rgb(43_39_36/12%)]";

interface SearchInputProps {
  autoComplete: "off";
  "aria-autocomplete": "list";
  onFocus: () => void;
  onInput: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

/** Adds a suggestion panel below any search input. */
export function SearchSuggestions({
  suggestions = [],
  value,
  onChange,
  className,
  children,
}: {
  suggestions?: SearchSuggestion[];
  value: string;
  onChange: (value: string) => void;
  className: string;
  children: (input: SearchInputProps) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const query = fold(value.trim());
  const seen = new Set<string>();
  const matches = suggestions
    .filter((item) => {
      if (seen.has(item.value) || item.value === value.trim()) return false;
      seen.add(item.value);
      return fold(`${item.value} ${item.label} ${item.hint ?? ""}`).includes(
        query,
      );
    })
    .slice(0, 6);
  const visible = open && matches.length > 0;
  useFloatingPanel(
    visible,
    wrapRef,
    panelRef,
    () => setOpen(false),
    matches.length,
  );

  const focusInput = () => {
    wrapRef.current?.querySelector("input")?.focus();
  };
  const items = () =>
    Array.from(panelRef.current?.querySelectorAll("button") ?? []);
  const onItemKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const list = items();
    const index = list.indexOf(event.currentTarget);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      list[Math.min(list.length - 1, index + 1)]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index === 0) focusInput();
      else list[index - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      focusInput();
      setOpen(false);
    }
  };

  return (
    <div
      className={className}
      data-search-suggestions=""
      onBlur={(event) => {
        if (!wrapRef.current?.contains(event.relatedTarget as Node | null))
          setOpen(false);
      }}
      ref={wrapRef}
    >
      {children({
        autoComplete: "off",
        "aria-autocomplete": "list",
        onFocus: () => setOpen(true),
        onInput: () => setOpen(true),
        onKeyDown: (event) => {
          if (event.key === "ArrowDown" && visible) {
            event.preventDefault();
            event.currentTarget
              .closest("[data-search-suggestions]")
              ?.querySelector<HTMLButtonElement>("ul button")
              ?.focus();
          } else if (event.key === "Escape" && visible) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
        },
      })}
      {visible && (
        <ul aria-label="Gợi ý tìm kiếm" className={panelClass} ref={panelRef}>
          {matches.map((item) => (
            <li key={item.value}>
              <button
                className="flex min-h-9 w-full cursor-pointer items-center justify-between gap-6 rounded-md px-2.5 py-1 text-left text-[13px] outline-none hover:bg-[var(--admin-surface-muted)] focus:bg-[var(--admin-surface-muted)]"
                onClick={() => {
                  onChange(item.value);
                  focusInput();
                  setOpen(false);
                }}
                onKeyDown={onItemKey}
                onPointerDown={(event) => event.preventDefault()}
                type="button"
              >
                <span className="line-clamp-1">{item.label}</span>
                {item.hint && (
                  <span className="shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                    {item.hint}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Lays out one search field and its filters above a table. */
export function AdminFilterBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}

export function AdminSearchField({
  label,
  placeholder,
  value,
  onChange,
  suggestions,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: SearchSuggestion[];
}) {
  return (
    <SearchSuggestions
      className="relative min-w-[220px] max-w-md flex-1"
      onChange={onChange}
      suggestions={suggestions}
      value={value}
    >
      {(input) => (
        <>
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]">
            <SearchGlyph />
          </span>
          <input
            {...input}
            aria-label={label}
            className="h-9 w-full appearance-none rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] pl-8 pr-8 text-[13px] text-[var(--admin-ink)] outline-none transition placeholder:text-[var(--admin-muted)] hover:border-[#c9bdb1] focus:border-[var(--admin-ink-soft)] [&::-webkit-search-cancel-button]:appearance-none"
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            type="search"
            value={value}
          />
          {value && (
            <button
              aria-label="Xóa nội dung tìm kiếm"
              className={`absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-ink)] ${adminFocus}`}
              onClick={() => onChange("")}
              type="button"
            >
              <svg aria-hidden="true" className="size-3" viewBox="0 0 12 12">
                <path
                  d="m3 3 6 6M9 3l-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.4"
                />
              </svg>
            </button>
          )}
        </>
      )}
    </SearchSuggestions>
  );
}

export interface AdminFilterOption<T extends string> {
  value: T;
  label: string;
}

/** Dropdown filter. Opens in the top layer so table cards cannot clip it. */
export function AdminFilterSelect<T extends string>({
  label,
  ariaLabel,
  value,
  allValue,
  allLabel = "Tất cả",
  options,
  onChange,
  disabled = false,
  variant = "filter",
}: {
  label?: string;
  ariaLabel: string;
  value: T;
  /** Omit for a required choice with no "all" entry. */
  allValue?: T;
  allLabel?: string;
  options: AdminFilterOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /** `field` fills a form column at input height. */
  variant?: "filter" | "field";
}) {
  const choices =
    allValue === undefined
      ? options
      : [{ value: allValue, label: allLabel }, ...options];
  const selectedIndex = Math.max(
    0,
    choices.findIndex((choice) => choice.value === value),
  );
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const filtered = allValue !== undefined && value !== allValue;
  const field = variant === "field";
  const current = choices[selectedIndex]?.label ?? "";

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const pick = (index: number) => {
    if (choices[index].value !== value) onChange(choices[index].value);
    close(true);
  };

  useFloatingPanel(open, triggerRef, listRef, () => setOpen(false));
  useLayoutEffect(() => {
    if (open)
      listRef.current
        ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
        ?.focus({ preventScroll: true });
  }, [open]);

  const onListKey = (event: KeyboardEvent) => {
    const buttons = Array.from(
      listRef.current?.querySelectorAll("button") ?? [],
    );
    const current = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const last = buttons.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, current + 1),
      ArrowUp: Math.max(0, current - 1),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      buttons[moves[event.key]]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  return (
    <div className={field ? "mt-1.5 w-full" : "shrink-0"}>
      <button
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${ariaLabel}: ${current}`}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[13px] transition disabled:cursor-not-allowed disabled:opacity-60 ${field ? "h-11 w-full justify-between font-normal" : "h-9"} ${adminFocus} ${filtered ? "border-[var(--admin-ink-soft)] bg-[var(--admin-surface-muted)]" : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[#c9bdb1]"}`}
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        {label && <span className="text-[var(--admin-muted)]">{label}</span>}
        <span
          className={`truncate text-[var(--admin-ink)] ${field ? "" : "font-medium"}`}
        >
          {current}
        </span>
        <svg
          aria-hidden="true"
          className={`size-3 text-[var(--admin-muted)] transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
        >
          <path
            d="m3 4.5 3 3 3-3"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      </button>
      {open && (
        <ul
          aria-label={ariaLabel}
          className={panelClass}
          id={listId}
          ref={listRef}
        >
          {choices.map((choice, index) => (
            <li key={choice.value}>
              <button
                aria-pressed={index === selectedIndex}
                className="flex h-8 w-full cursor-pointer items-center justify-between gap-6 whitespace-nowrap rounded-md px-2.5 text-left text-[13px] outline-none hover:bg-[var(--admin-surface-muted)] focus:bg-[var(--admin-surface-muted)]"
                onClick={() => pick(index)}
                onKeyDown={onListKey}
                type="button"
              >
                {choice.label}
                {index === selectedIndex && (
                  <svg
                    aria-hidden="true"
                    className="size-3.5 text-[var(--admin-brand-red)]"
                    viewBox="0 0 14 14"
                  >
                    <path
                      d="m3 7.5 2.5 2.5L11 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
