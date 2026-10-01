/**
 * Composition root for persistence.
 *
 * Every store/service imports repositories from HERE — never constructs
 * them, never touches `window.localStorage` directly.
 *
 * Adding a backend later means exactly one change: implement
 * `BookBinaryStore` / `BookDataStore` against your API and construct
 * those classes here instead. All call sites keep working because the
 * interfaces are already async.
 */

import { LocalBookBinaryStore, LocalBookDataStore } from "@/lib/data/local";
import type { BookBinaryStore, BookDataStore } from "@/lib/data/repositories";

export const bookBinaries: BookBinaryStore = new LocalBookBinaryStore();
export const bookData: BookDataStore = new LocalBookDataStore();
