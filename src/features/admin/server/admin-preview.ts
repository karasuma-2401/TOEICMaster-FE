export function isAdminPreviewEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ADMIN_PREVIEW === "true"
  );
}
