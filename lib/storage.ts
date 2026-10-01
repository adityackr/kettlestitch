/**
 * Tiny typed wrapper around localStorage with JSON serialization.
 * All persistence in this app (settings, bookmarks, highlights,
 * reading positions) goes through these helpers so failures
 * (private mode, quota) never crash the reader.
 */

export function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

/**
 * Slugify a book title into a stable per-book id.
 *
 * Ids are URL-safe by construction (`[a-z0-9-]`, dash separator) because
 * they double as `/reader/[bookId]` route params — Next.js does not
 * decode sequences like `%3A` in dynamic segments, so reserved
 * characters (notably the old `epub-reader:` colon prefix) broke book
 * opening. See `canonicalBookId` for the legacy migration path.
 */
export function bookKey(titleOrId: string): string {
  const slug = titleOrId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return `epub-reader-${slug || "untitled"}`;
}

/**
 * Map a legacy id (`epub-reader:<slug>`) to its canonical URL-safe form
 * (`epub-reader-<slug>`). New ids pass through unchanged.
 */
export function canonicalBookId(id: string): string {
  return id.replace(/^epub-reader:/, "epub-reader-");
}
