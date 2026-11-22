"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useFormFieldControlProps } from "./form-field";

export interface PasswordInputProps extends Omit<
  ComponentProps<"input">,
  "type"
> {
  showLabel?: string;
  hideLabel?: string;
  wrapperClassName?: string;
}

/** Accessible password field with a keyboard-focusable visibility toggle button. */
export function PasswordInput({
  className,
  wrapperClassName,
  showLabel = "Hiện mật khẩu",
  hideLabel = "Ẩn mật khẩu",
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const fieldProps = useFormFieldControlProps();

  return (
    <div className={cn("relative flex items-center", wrapperClassName)}>
      <input
        {...fieldProps}
        {...props}
        className={cn(
          "min-h-11 w-full rounded-xl border border-[var(--tm-border-strong,#d9d2ce)] bg-[var(--tm-surface,#ffffff)] pr-12 pl-3.5 text-sm text-[var(--tm-ink,#302b29)] placeholder:text-[var(--tm-ink-muted,#5f5953)] transition focus-visible:border-[var(--tm-ring,#ff5a1f)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring,#ff5a1f)] disabled:cursor-not-allowed disabled:bg-[var(--tm-surface-muted,#f5f2f0)] disabled:opacity-70 aria-[invalid=true]:border-[var(--tm-danger,#dc2626)]",
          className,
        )}
        disabled={disabled}
        type={visible ? "text" : "password"}
      />
      <button
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="absolute right-1.5 inline-flex size-9 items-center justify-center rounded-lg text-[var(--tm-ink-muted,#5f5953)] transition hover:bg-[var(--tm-surface-muted,#f5f2f0)] hover:text-[var(--tm-ink,#302b29)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring,#ff5a1f)] disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="password-visibility-toggle"
        disabled={disabled}
        onClick={() => setVisible((prev) => !prev)}
        type="button"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
}
