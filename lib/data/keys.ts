/**
 * Central storage-key builders — the ONLY place key formats live.
 *
 * Every persisted artifact (book binaries, positions, bookmarks,
 * highlights, indexes) derives its localStorage key here, so a future
 * backend migration (or a key-format change) touches one file instead
 * of six. Repository implementations must use these builders and never
 * inline key strings.
 */

export const libraryIndexKey = "epub-reader:library";
export const settingsKey = "epub-reader:settings";

/** Base64 EPUB bytes for one book (kept separate from the metadata index). */
export const bookDataKey = (id: string) => `epub-reader:book-data:${id}`;

/** Last-read CFI locator for one book. */
export const positionKey = (id: string) => `epub-reader:position:${id}`;

/** Bookmark list for one book. */
export const bookmarksKey = (id: string) => `epub-reader:bookmarks:${id}`;

/** Highlight list for one book. */
export const highlightsKey = (id: string) => `epub-reader:highlights:${id}`;
