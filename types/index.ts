import type ePub from "epubjs";
import type { Rendition } from "epubjs";

/** A flattened chapter entry from the EPUB navigation (TOC). */
export interface TocItem {
  id: string;
  href: string;
  label: string;
  subitems?: TocItem[];
}

export type SpreadMode = "none" | "auto"; // single page | double-page spread
export type FlowMode = "paginated" | "scrolled"; // left-right | top-bottom
export type PageThemeId = "cream" | "sepia" | "gray" | "mint" | "navy" | "dark";

export interface PageTheme {
  id: PageThemeId;
  label: string;
  /** Page background applied inside the epub iframe. */
  background: string;
  /** Body text color chosen for contrast. */
  foreground: string;
  swatch: string;
}

export const PAGE_THEMES: PageTheme[] = [
  { id: "cream", label: "Cream", background: "#fdf6e3", foreground: "#433422", swatch: "#fdf6e3" },
  { id: "sepia", label: "Sepia", background: "#f4ecd8", foreground: "#5b4636", swatch: "#e8d9b5" },
  { id: "gray", label: "Soft gray", background: "#f1f2f4", foreground: "#2b2e34", swatch: "#e2e4e9" },
  { id: "mint", label: "Mint", background: "#eaf5ef", foreground: "#1f3d2b", swatch: "#cde8d8" },
  { id: "navy", label: "Dark navy", background: "#14213d", foreground: "#e8eaf0", swatch: "#14213d" },
  { id: "dark", label: "Pure dark", background: "#000000", foreground: "#e5e5e5", swatch: "#000000" },
];

export interface FontOption {
  id: string;
  label: string;
  family: string;
  lang: "en" | "bn";
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "georgia", label: "Georgia (EN)", family: "Georgia, serif", lang: "en" },
  { id: "merriweather", label: "Merriweather (EN)", family: "'Merriweather', Georgia, serif", lang: "en" },
  { id: "opensans", label: "Open Sans (EN)", family: "'Open Sans', system-ui, sans-serif", lang: "en" },
  { id: "notobengali", label: "Noto Sans Bengali (বাং)", family: "'Noto Sans Bengali', sans-serif", lang: "bn" },
  { id: "hindsiliguri", label: "Hind Siliguri (বাং)", family: "'Hind Siliguri', sans-serif", lang: "bn" },
  { id: "balooda", label: "Baloo Da 2 (বাং)", family: "'Baloo Da 2', cursive", lang: "bn" },
];

export interface Bookmark {
  /** EPUB CFI locator. */
  cfi: string;
  label: string;
  snippet: string;
  createdAt: number;
}

export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export interface Highlight {
  cfiRange: string;
  text: string;
  color: HighlightColor;
  /** TOC chapter title at save time (absent on legacy entries). */
  chapter?: string;
  createdAt: number;
}

export const HIGHLIGHT_COLORS: Record<HighlightColor, { label: string; hex: string }> = {
  yellow: { label: "Yellow", hex: "#ffe066" },
  green: { label: "Green", hex: "#b2f2bb" },
  blue: { label: "Blue", hex: "#a5d8ff" },
  pink: { label: "Pink", hex: "#ffc6e0" },
};

/* ------------------------------ Library ------------------------------ */

/** Where the binary lives: localStorage (persisted) or memory-only (quota exceeded). */
export type LibraryStorage = "localStorage" | "memory-only";

export interface LibraryBook {
  /** Stable id — same scheme as reader bookId (`epub-reader:<slug>` + hash). */
  id: string;
  title: string;
  author?: string;
  /** Uploaded file vs remote URL. URL books need no binary storage. */
  sourceType: "file" | "url";
  /** Original file name / remote URL. */
  fileName?: string;
  url?: string;
  /** Uncompressed byte size (for display). */
  size?: number;
  /** Small JPEG dataURL thumbnail of the cover (optional). */
  cover?: string;
  addedAt: number;
  lastOpenedAt: number;
  /** Last known 0..1 progress (mirrored from the reader). */
  progress: number;
  storage: LibraryStorage;
  /** True when the binary could not be kept (quota) — user must re-upload. */
  binaryMissing?: boolean;
}

/** Re-export epubjs types consumers need without importing epubjs directly. */
export type { ePub, Rendition };
