/**
 * Book use-cases — the ONLY place that orchestrates stores + repositories
 * for book lifecycle flows (import/open/restore/delete).
 *
 * Components stay thin: they call one service function, apply the result
 * to UI state (reader store / navigation), and render. When a backend
 * arrives, these flows keep their shape — only the repositories they
 * call change implementation.
 *
 * Layering: services may read/write stores; stores must never import
 * services (would be a cycle).
 */

import { bookBinaries, bookData } from "@/lib/data";
import { useLibraryStore } from "@/store/libraryStore";
import { bookKey, canonicalBookId } from "@/lib/storage";
import { scheduleIdle } from "@/lib/utils";

export interface BookSource {
  bookId: string;
  title: string;
  fileData: ArrayBuffer | null;
  fileUrl: string | null;
}

export type OpenBookResult =
  | ({ status: "ready" } & BookSource)
  | { status: "missing"; bookId: string; title: string }
  | { status: "unknown"; attemptedId: string };

/** Decode a route param defensively; null when absent or malformed. */
function safeDecode(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value);
    return decoded === value ? null : decoded;
  } catch {
    return null;
  }
}

/**
 * Resolve a route id into an openable source.
 * Handles exact ids, legacy encoded ids (via migration), URL books,
 * cached/persisted binaries, and quota-evicted books.
 */
export async function openBook(rawId: string): Promise<OpenBookResult> {
  const lib = useLibraryStore.getState();
  let entry = lib.books.find((b) => b.id === rawId);
  if (!entry) {
    // Legacy ids with reserved chars (e.g. `%3A`) survive Next.js
    // dynamic params undecoded — try the decoded form.
    const decoded = safeDecode(rawId);
    if (decoded) entry = lib.books.find((b) => b.id === decoded);
  }
  if (!entry) return { status: "unknown", attemptedId: rawId };

  if (canonicalBookId(entry.id) !== entry.id) {
    // One-time migration to the canonical id, then resolve the fresh entry.
    const migrated = await lib.migrateLegacyId(entry.id);
    const fresh = migrated
      ? useLibraryStore.getState().books.find((b) => b.id === migrated)
      : undefined;
    if (!fresh) return { status: "unknown", attemptedId: rawId };
    entry = fresh;
  }

  if (entry.sourceType === "url" && entry.url) {
    lib.touchOpened(entry.id);
    return { status: "ready", bookId: entry.id, title: entry.title, fileData: null, fileUrl: entry.url };
  }
  const buffer = await bookBinaries.load(entry.id);
  if (!buffer) return { status: "missing", bookId: entry.id, title: entry.title };
  lib.touchOpened(entry.id);
  return { status: "ready", bookId: entry.id, title: entry.title, fileData: buffer, fileUrl: null };
}

/**
 * Import an uploaded file: cache bytes, register metadata, and persist
 * the binary off the critical path. Throws on unreadable files.
 */
export async function importEpubFile(file: File): Promise<BookSource> {
  const buffer = await file.arrayBuffer();
  const title = file.name.replace(/\.epub$/i, "");
  // Stable id so re-uploading the same file restores its position,
  // bookmarks and highlights instead of duplicating the entry.
  const bookId = bookKey(`${title}-${file.size}-${file.lastModified || 0}`);
  const lib = useLibraryStore.getState();
  bookBinaries.cache(bookId, buffer);
  lib.upsertMeta({
    id: bookId,
    title,
    sourceType: "file",
    fileName: file.name,
    size: file.size,
    addedAt: Date.now(),
    lastOpenedAt: Date.now(),
    progress: 0,
    storage: "localStorage",
    binaryMissing: false,
  });
  scheduleIdle(() => {
    // LocalStorage quota (~5MB) may reject large books: the entry is
    // then flagged memory-only (readable this session, re-upload next).
    void bookBinaries.persist(bookId).then((ok) => {
      if (!ok) lib.markBinaryMissing(bookId, true);
    });
  });
  return { bookId, title, fileData: buffer, fileUrl: null };
}

/** Register a remote EPUB URL (no binary — always persistable). */
export async function importEpubUrl(url: string): Promise<{ bookId: string; title: string; fileUrl: string }> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("URL is empty");
  let title = "Remote book";
  try {
    const parsed = new URL(trimmed);
    const last = parsed.pathname.split("/").pop() || "remote-book";
    title = decodeURIComponent(last).replace(/\.epub$/i, "");
  } catch { /* keep default */ }
  const bookId = bookKey(`url-${trimmed}`);
  useLibraryStore.getState().upsertMeta({
    id: bookId,
    title: title || trimmed,
    sourceType: "url",
    url: trimmed,
    addedAt: Date.now(),
    lastOpenedAt: Date.now(),
    progress: 0,
    storage: "localStorage",
  });
  return { bookId, title, fileUrl: trimmed };
}

/**
 * Re-link a local file to an entry whose bytes were quota-evicted.
 * Throws on unreadable files.
 */
export async function restoreBookFile(
  bookId: string,
  file: File,
): Promise<{ title: string; buffer: ArrayBuffer }> {
  const buffer = await file.arrayBuffer();
  const lib = useLibraryStore.getState();
  const title = lib.books.find((b) => b.id === bookId)?.title ?? file.name.replace(/\.epub$/i, "");
  bookBinaries.cache(bookId, buffer);
  lib.markBinaryMissing(bookId, !(await bookBinaries.persist(bookId)));
  lib.touchOpened(bookId);
  return { title, buffer };
}

/** Delete a book everywhere: bytes, per-book documents, metadata. */
export async function deleteBookEverywhere(bookId: string): Promise<void> {
  await bookBinaries.remove(bookId);
  await bookData.removeBookData(bookId);
  useLibraryStore.getState().removeMeta(bookId);
}
