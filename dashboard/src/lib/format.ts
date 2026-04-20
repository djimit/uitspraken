/**
 * Format a number with Dutch thousands separators (dots).
 * Deterministic — same output on server and client, no locale dependency.
 */
export function formatNL(n: number): string {
  const s = Math.round(n).toString();
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) {
    parts.unshift(s.slice(Math.max(0, i - 3), i));
  }
  // Handle negative numbers
  if (s.startsWith("-")) {
    return "-" + parts.join(".").replace(/^-\.?/, "");
  }
  return parts.join(".");
}
