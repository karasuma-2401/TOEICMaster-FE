"use client";

import { useState, type FormEvent } from "react";
import { DropdownMenu } from "radix-ui";
import {
  AdminUsersApiError,
  adminUserErrorMessage,
  createAdminUser,
  deleteAdminUser,
  lockAdminUser,
  sendAdminPasswordReset,
  unlockAdminUser,
  updateAdminUser,
} from "@/features/admin/api";
import {
  ADMIN_USER_ROLES,
  type AdminUser,
  type AdminUserRole,
} from "@/features/admin/users";
import {
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { FormField } from "@/shared/components/ui/form-field";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]";
const input = `h-11 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm text-[var(--admin-ink)] aria-[invalid=true]:border-[var(--admin-danger)] ${focusRing}`;
const secondaryButton = `inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-white px-4 text-sm font-bold text-[var(--admin-ink)] hover:bg-[var(--admin-surface-muted)] ${focusRing}`;
const primaryButton = `inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold text-white shadow-[var(--admin-action-shadow)] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

const roleLabel: Record<AdminUserRole, string> = {
  USER: "Learner",
  ADMIN: "Admin",
};

/** Alert box for a failed request, including the ProblemDetails trace id for support. */
export function AdminUserErrorAlert({
  error,
  fallback,
}: {
  error: unknown;
  fallback: string;
}) {
  if (!error) return null;
  const traceId = error instanceof AdminUsersApiError ? error.traceId : null;
  return (
    <div
      className="rounded-lg bg-[var(--admin-danger-soft)] p-3 text-sm font-semibold text-[var(--admin-danger)]"
      role="alert"
    >
      <p>{adminUserErrorMessage(error, fallback)}</p>
      {traceId && (
        <p className="mt-1 text-xs font-normal">Reference: {traceId}</p>
      )}
    </div>
  );
}

function fieldError(error: unknown, field: string) {
  return error instanceof AdminUsersApiError
    ? (error.fieldErrors[field]?.[0] ?? null)
    : null;
}

/** Accessible "Add user" modal wired to `POST /api/admin/users`. */
export function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (user: AdminUser) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminUserRole>("USER");
  const [sendActivationEmail, setSendActivationEmail] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFullName("");
    setEmail("");
    setRole("USER");
    setSendActivationEmail(true);
    setError(null);
    setBusy(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await createAdminUser({
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        sendActivationEmail,
      });
      reset();
      onCreated(user);
    } catch (cause) {
      setError(cause);
      setBusy(false);
    }
  };

  const hasFieldErrors =
    error instanceof AdminUsersApiError &&
    Object.keys(error.fieldErrors).length > 0;

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next && !busy) {
          reset();
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a learner or administrator account. The user sets their own
            password from the activation email.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-5 space-y-4" noValidate onSubmit={submit}>
          <FormField
            error={fieldError(error, "fullName")}
            label="Full name"
            required
          >
            <input
              autoComplete="off"
              className={input}
              maxLength={100}
              onChange={(event) => setFullName(event.target.value)}
              value={fullName}
            />
          </FormField>
          <FormField error={fieldError(error, "email")} label="Email" required>
            <input
              autoComplete="off"
              className={input}
              inputMode="email"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </FormField>
          <FormField error={fieldError(error, "role")} label="Role">
            <select
              className={input}
              onChange={(event) => setRole(event.target.value as AdminUserRole)}
              value={role}
            >
              {ADMIN_USER_ROLES.map((value) => (
                <option key={value} value={value}>
                  {roleLabel[value]}
                </option>
              ))}
            </select>
          </FormField>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[var(--admin-ink)]">
            <input
              checked={sendActivationEmail}
              className={`size-5 accent-[var(--admin-brand-red)] ${focusRing}`}
              onChange={(event) => setSendActivationEmail(event.target.checked)}
              type="checkbox"
            />
            Send activation email
          </label>
          {error && !hasFieldErrors ? (
            <AdminUserErrorAlert
              error={error}
              fallback="Unable to create user."
            />
          ) : null}
          <DialogFooter>
            <button
              className={secondaryButton}
              disabled={busy}
              onClick={() => {
                reset();
                onClose();
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className={primaryButton}
              disabled={busy}
              style={{ background: "var(--admin-brand-gradient)" }}
              type="submit"
            >
              {busy ? "Creating..." : "Create user"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Modal to change a user's role via `PATCH /api/admin/users/{id}`. */
export function ChangeRoleDialog({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [role, setRole] = useState<AdminUserRole>(user.role);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateAdminUser(user.id, { role });
      onDone(`${user.fullName} is now ${roleLabel[role]}.`);
    } catch (cause) {
      setError(cause);
      setBusy(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
      open
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            {user.fullName} · {user.email}
          </DialogDescription>
        </DialogHeader>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <FormField label="Role">
            <select
              className={input}
              onChange={(event) => setRole(event.target.value as AdminUserRole)}
              value={role}
            >
              {ADMIN_USER_ROLES.map((value) => (
                <option key={value} value={value}>
                  {roleLabel[value]}
                </option>
              ))}
            </select>
          </FormField>
          <AdminUserErrorAlert
            error={error}
            fallback="Unable to update role."
          />
          <DialogFooter>
            <button
              className={secondaryButton}
              disabled={busy}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={primaryButton}
              disabled={busy || role === user.role}
              style={{ background: "var(--admin-brand-gradient)" }}
              type="submit"
            >
              {busy ? "Saving..." : "Save role"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type ConfirmableUserAction = "lock" | "unlock" | "reset" | "delete";

const confirmCopy: Record<
  ConfirmableUserAction,
  {
    title: string;
    confirm: string;
    body: (user: AdminUser) => string;
    done: (user: AdminUser) => string;
    fallback: string;
    destructive: boolean;
    run: (id: string) => Promise<void>;
  }
> = {
  lock: {
    title: "Lock account?",
    confirm: "Lock account",
    body: (user) =>
      `${user.fullName} will be signed out and cannot sign in until unlocked.`,
    done: (user) => `Locked ${user.fullName}.`,
    fallback: "Unable to lock user.",
    destructive: true,
    run: lockAdminUser,
  },
  unlock: {
    title: "Unlock account?",
    confirm: "Unlock account",
    body: (user) => `${user.fullName} will be able to sign in again.`,
    done: (user) => `Unlocked ${user.fullName}.`,
    fallback: "Unable to unlock user.",
    destructive: false,
    run: unlockAdminUser,
  },
  reset: {
    title: "Send password reset?",
    confirm: "Send reset email",
    body: (user) => `A password reset link will be emailed to ${user.email}.`,
    done: (user) => `Password reset email sent to ${user.email}.`,
    fallback: "Unable to send password reset.",
    destructive: false,
    run: sendAdminPasswordReset,
  },
  delete: {
    title: "Delete user?",
    confirm: "Delete user",
    body: (user) =>
      `${user.fullName} (${user.email}) will be permanently removed. This cannot be undone.`,
    done: (user) => `Deleted ${user.fullName}.`,
    fallback: "Unable to delete user.",
    destructive: true,
    run: deleteAdminUser,
  },
};

/** Confirmation modal for lock / unlock / password reset / delete. */
export function ConfirmUserActionDialog({
  action,
  user,
  onClose,
  onDone,
}: {
  action: ConfirmableUserAction;
  user: AdminUser;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const copy = confirmCopy[action];
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  return (
    <ConfirmDialog
      cancelLabel="Cancel"
      confirmDisabled={busy}
      confirmLabel={busy ? "Working..." : copy.confirm}
      destructive={copy.destructive}
      onCancel={() => {
        if (!busy) onClose();
      }}
      onConfirm={() => {
        setBusy(true);
        setError(null);
        copy
          .run(user.id)
          .then(() => onDone(copy.done(user)))
          .catch((cause: unknown) => {
            setError(cause);
            setBusy(false);
          });
      }}
      title={copy.title}
    >
      <p>{copy.body(user)}</p>
      {error ? (
        <div className="mt-3">
          <AdminUserErrorAlert error={error} fallback={copy.fallback} />
        </div>
      ) : null}
    </ConfirmDialog>
  );
}

export type UserMenuAction = "role" | ConfirmableUserAction;

const menuItem =
  "flex min-h-11 cursor-pointer select-none items-center rounded-md px-3 text-sm text-[var(--admin-ink)] outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-[var(--admin-surface-muted)]";

/** Keyboard-accessible row action menu (Radix DropdownMenu). */
export function UserActionsMenu({
  user,
  onSelect,
}: {
  user: AdminUser;
  onSelect: (action: UserMenuAction) => void;
}) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={`Actions for ${user.fullName}`}
          className={`size-11 rounded-lg text-lg text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-ink)] ${focusRing}`}
          type="button"
        >
          •••
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-52 rounded-xl border border-[var(--admin-border)] bg-white p-1 shadow-xl"
          sideOffset={4}
        >
          <DropdownMenu.Item
            className={menuItem}
            onSelect={() => onSelect("role")}
          >
            Change role
          </DropdownMenu.Item>
          {user.status === "LOCKED" ? (
            <DropdownMenu.Item
              className={menuItem}
              onSelect={() => onSelect("unlock")}
            >
              Unlock account
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              className={menuItem}
              onSelect={() => onSelect("lock")}
            >
              Lock account
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            className={menuItem}
            disabled={user.authProvider === "GOOGLE"}
            onSelect={() => onSelect("reset")}
          >
            Send password reset
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-[var(--admin-border)]" />
          <DropdownMenu.Item
            className={`${menuItem} text-[var(--admin-danger)]`}
            onSelect={() => onSelect("delete")}
          >
            Delete user
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
