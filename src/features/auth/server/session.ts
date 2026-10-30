import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export interface AuthenticatedUser {
  id: string;
  displayName: string;
  email: string;
}

export type AuthenticatedRole = "ADMIN" | "USER";

export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  user: AuthenticatedUser;
  rememberMe: boolean;
  role: AuthenticatedRole;
}

const cookieName = "toeicmaster_session";

function key(): Buffer {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || !/^[A-Za-z0-9_-]{43}$/.test(secret))
    throw new Error("AUTH_SESSION_SECRET must be a 32-byte base64url value");
  const decoded = Buffer.from(secret, "base64url");
  if (decoded.length !== 32) throw new Error("Invalid AUTH_SESSION_SECRET");
  return decoded;
}

function seal(session: AuthSession): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  return `v1.${iv.toString("base64url")}.${encrypted.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
}

function isSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  const user = session.user as Record<string, unknown> | undefined;
  return (
    typeof session.accessToken === "string" &&
    !!session.accessToken &&
    typeof session.refreshToken === "string" &&
    !!session.refreshToken &&
    typeof session.accessTokenExpiresAtUtc === "string" &&
    Number.isFinite(Date.parse(session.accessTokenExpiresAtUtc)) &&
    typeof session.refreshTokenExpiresAtUtc === "string" &&
    Number.isFinite(Date.parse(session.refreshTokenExpiresAtUtc)) &&
    typeof session.rememberMe === "boolean" &&
    (session.role === "USER" || session.role === "ADMIN") &&
    !!user &&
    typeof user.id === "string" &&
    typeof user.displayName === "string" &&
    typeof user.email === "string"
  );
}

export function readSession(cookie: string | undefined): AuthSession | null {
  if (!cookie) return null;
  const encryptionKey = key();
  try {
    const [version, iv, encrypted, tag, extra] = cookie.split(".");
    if (version !== "v1" || !iv || !encrypted || !tag || extra) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey,
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const value: unknown = JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(encrypted, "base64url")),
        decipher.final(),
      ]).toString("utf8"),
    );
    return isSession(value) ? value : null;
  } catch {
    return null;
  }
}

type SessionCookieStore = {
  get(name: string): { value: string } | undefined;
};

export function sessionFromCookieStore(cookies: SessionCookieStore) {
  return readSession(cookies.get(cookieName)?.value);
}

export function sessionCookie(request: { cookies: SessionCookieStore }) {
  return sessionFromCookieStore(request.cookies);
}

export function setSessionCookie(response: NextResponse, session: AuthSession) {
  const seconds = Math.max(
    0,
    Math.floor(
      (Date.parse(session.refreshTokenExpiresAtUtc) - Date.now()) / 1000,
    ),
  );
  response.cookies.set(cookieName, seal(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(session.rememberMe ? { maxAge: seconds } : {}),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
