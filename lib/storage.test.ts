import { describe, expect, test } from "bun:test";
import { bookKey, canonicalBookId } from "./storage";

describe("bookKey", () => {
  test("builds URL-safe ids (no reserved characters)", () => {
    const id = bookKey("My Book: A Tale! (Vol. 2)");
    expect(id).toBe("epub-reader-my-book-a-tale-vol-2");
    expect(id).not.toMatch(/[^a-z0-9-]/);
    // Safe to embed in a route segment without encoding.
    expect(encodeURIComponent(id)).toBe(id);
  });

  test("stable for identical inputs (re-upload restores state)", () => {
    expect(bookKey("Title-123-456")).toBe(bookKey("Title-123-456"));
  });

  test("falls back to untitled on empty input", () => {
    expect(bookKey("   ")).toBe("epub-reader-untitled");
  });
});

describe("canonicalBookId", () => {
  test("migrates legacy colon ids", () => {
    expect(canonicalBookId("epub-reader:my-book")).toBe("epub-reader-my-book");
  });

  test("passes canonical ids through", () => {
    expect(canonicalBookId("epub-reader-my-book")).toBe("epub-reader-my-book");
  });
});
