/**
 * Tiny className joiner. Filters out falsy values so conditional classes can be
 * written inline without a runtime dependency. Last writer wins is the caller's
 * responsibility (Tailwind merge is intentionally out of scope here).
 */
export type ClassValue = string | false | null | undefined

export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ')
}
