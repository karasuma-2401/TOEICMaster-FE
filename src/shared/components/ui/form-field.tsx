"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/utils";

export interface FormFieldControlProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  required?: boolean;
}

const FormFieldContext = createContext<FormFieldControlProps | null>(null);

/** Reads accessibility attributes from the nearest enclosing FormField, if any. */
export function useFormFieldControlProps(): FormFieldControlProps | null {
  return useContext(FormFieldContext);
}

export interface FormFieldProps {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: ReactNode | ((controlProps: FormFieldControlProps) => ReactNode);
}

/** Accessible form field wrapper linking label, optional hint, and alert error messages. */
export function FormField({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(error && error.trim().length > 0);
  const describedBy =
    [hint ? hintId : null, hasError ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const controlProps: FormFieldControlProps = {
    id: fieldId,
    ...(hasError ? { "aria-invalid": true as const } : {}),
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(required ? { required: true } : {}),
  };

  let renderedControl: ReactNode;
  if (typeof children === "function") {
    renderedControl = children(controlProps);
  } else if (isValidElement<Record<string, unknown>>(children)) {
    const childProps = children.props;
    const mergedDescribedBy =
      [
        typeof childProps["aria-describedby"] === "string"
          ? childProps["aria-describedby"]
          : null,
        describedBy ?? null,
      ]
        .filter(Boolean)
        .join(" ") || undefined;

    renderedControl = cloneElement(
      children as ReactElement<Record<string, unknown>>,
      {
        id:
          typeof childProps.id === "string" && childProps.id
            ? childProps.id
            : fieldId,
        ...(hasError || childProps["aria-invalid"]
          ? { "aria-invalid": true }
          : {}),
        ...(mergedDescribedBy ? { "aria-describedby": mergedDescribedBy } : {}),
        ...(required && childProps.required === undefined
          ? { required: true }
          : {}),
      },
    );
  } else {
    renderedControl = children;
  }

  return (
    <FormFieldContext.Provider value={controlProps}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label
          className="text-sm font-semibold text-[var(--tm-ink,#302b29)]"
          htmlFor={fieldId}
        >
          {label}
          {required ? (
            <span
              aria-hidden="true"
              className="ml-0.5 text-[var(--tm-danger,#dc2626)]"
            >
              *
            </span>
          ) : null}
        </label>
        {renderedControl}
        {hint ? (
          <p
            className="text-xs leading-5 text-[var(--tm-ink-muted,#5f5953)]"
            id={hintId}
          >
            {hint}
          </p>
        ) : null}
        {hasError ? (
          <p
            className="text-xs font-medium leading-5 text-[var(--tm-danger,#dc2626)]"
            id={errorId}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    </FormFieldContext.Provider>
  );
}

const baseControlClassName =
  "w-full rounded-xl border border-[var(--tm-border-strong,#d9d2ce)] bg-[var(--tm-surface,#ffffff)] px-3.5 text-sm text-[var(--tm-ink,#302b29)] placeholder:text-[var(--tm-ink-muted,#5f5953)] transition focus-visible:border-[var(--tm-ring,#ff5a1f)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring,#ff5a1f)] disabled:cursor-not-allowed disabled:bg-[var(--tm-surface-muted,#f5f2f0)] disabled:opacity-70 aria-[invalid=true]:border-[var(--tm-danger,#dc2626)]";

/** Styled text input wired automatically to an enclosing FormField when present. */
export function FormInput({ className, ...props }: ComponentProps<"input">) {
  const fieldProps = useFormFieldControlProps();
  return (
    <input
      {...fieldProps}
      {...props}
      className={cn(baseControlClassName, "min-h-11", className)}
    />
  );
}

/** Styled textarea wired automatically to an enclosing FormField when present. */
export function FormTextarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  const fieldProps = useFormFieldControlProps();
  return (
    <textarea
      {...fieldProps}
      {...props}
      className={cn(baseControlClassName, "min-h-24 py-2.5", className)}
    />
  );
}

/** Styled native select wired automatically to an enclosing FormField when present. */
export function FormSelect({ className, ...props }: ComponentProps<"select">) {
  const fieldProps = useFormFieldControlProps();
  return (
    <select
      {...fieldProps}
      {...props}
      className={cn(baseControlClassName, "min-h-11", className)}
    />
  );
}
