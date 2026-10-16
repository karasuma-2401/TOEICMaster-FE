/**
 * Add a path here when its page (and all of its descendants) requires a
 * signed-in user. Keep this list to browser page paths; API handlers must
 * validate their caller independently.
 */
export const protectedRoutePrefixes: readonly string[] = [];

export function isProtectedPath(
  pathname: string,
  paths: readonly string[] = protectedRoutePrefixes,
) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Returns a same-origin protected destination, or the public home page.
 * `paths` is injectable so route rules can be tested without changing the
 * application registry.
 */
export function safeReturnTo(
  value: string | string[] | undefined,
  paths: readonly string[] = protectedRoutePrefixes,
) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return "/";

  try {
    const base = "https://toeicmaster.local";
    const url = new URL(value, base);
    if (url.origin !== base || !isProtectedPath(url.pathname, paths))
      return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}

export function authUrl(pathname: "/login" | "/register", returnTo: string) {
  return returnTo === "/"
    ? pathname
    : `${pathname}?next=${encodeURIComponent(returnTo)}`;
}
