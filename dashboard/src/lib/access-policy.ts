import { notFound } from "next/navigation";

/**
 * Temporary local-only guard for internal audit/admin pages.
 * This is not production authentication; production must use a real auth provider.
 */
export function isLocalInternalAccessAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_INTERNAL_DASHBOARD === "true";
}

export function requireInternalAccess(): void {
  if (!isLocalInternalAccessAllowed()) {
    notFound();
  }
}
