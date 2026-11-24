export interface StorageScope {
  namespace: string;
  userId: string | null;
}

export function createScopedStorageKey(
  scope: StorageScope,
  key: string,
): string {
  if (!scope.namespace.trim() || !key.trim() || scope.userId === "") {
    throw new Error(
      "Storage requires a namespace, key, and non-empty user ID or null guest scope.",
    );
  }
  const owner =
    scope.userId === null
      ? "guest"
      : `user:${encodeURIComponent(scope.userId)}`;
  return `toeicmaster.scoped.v1:${encodeURIComponent(scope.namespace)}:${owner}:${encodeURIComponent(key)}`;
}

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readScopedStorage(
  scope: StorageScope,
  key: string,
): string | null {
  try {
    return (
      browserStorage()?.getItem(createScopedStorageKey(scope, key)) ?? null
    );
  } catch {
    return null;
  }
}

export function writeScopedStorage(
  scope: StorageScope,
  key: string,
  value: string,
): boolean {
  try {
    const storage = browserStorage();
    if (!storage) return false;
    storage.setItem(createScopedStorageKey(scope, key), value);
    return true;
  } catch {
    return false;
  }
}
