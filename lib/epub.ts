/**
 * Pure epub.js helpers — no React, no stores.
 *
 * Kept separate from hooks so the orchestration in `useEpub` stays small
 * and these units remain independently testable.
 */

import { FONT_OPTIONS, PAGE_THEMES, type TocItem } from "@/types";
import type { Book, Contents, NavItem, Rendition } from "epubjs";

/**
 * epub.js ships its own declarations — alias the real types instead of
 * maintaining parallel hand-rolled ones. Only genuinely untyped runtime
 * shapes get minimal local structural types (marked as such below).
 */
export type EpubBook = Book;
export type EpubRendition = Rendition;
export type EpubContents = Contents;

/** Shape of `relocated` payloads and `currentLocation()` results. */
export interface EpubCfiLocation {
  start?: { cfi?: string | null; href?: string | null } | null;
  href?: string | null;
}

export interface EpubBookMetadata {
  creator?: string;
  creators?: string[] | string;
  title?: string;
}

/** `spine.items` exists at runtime but is missing from epubjs types. */
export function spineItems(book: EpubBook): Array<{ href: string }> {
  return (book.spine as unknown as { items?: Array<{ href: string }> }).items ?? [];
}

/** Characters per generated location (~page granularity for progress). */
export const LOCATION_CHARS_PER_BREAK = 800;

/* ------------------------------- TOC ---------------------------------- */

export interface FlatTocItem {
  id: string;
  href: string;
  label: string;
  depth: number;
}

/**
 * Flatten a nested TOC into render-ready rows.
 * Pure (no input mutation) and referentially stable per input —
 * safe to wrap in `useMemo`.
 */
export function flattenToc(items: TocItem[]): FlatTocItem[] {
  const out: FlatTocItem[] = [];
  const walk = (list: TocItem[], depth: number) => {
    for (const t of list) {
      out.push({ id: t.id, href: t.href, label: t.label, depth });
      if (t.subitems) walk(t.subitems, depth + 1);
    }
  };
  walk(items, 0);
  return out;
}

/** Normalize epub.js navigation nodes (`NavItem`) into `TocItem`s. */
export function normalizeToc(raw: NavItem[] | undefined): TocItem[] {
  return (raw ?? []).map((t) => ({
    id: t.id ?? t.href ?? "",
    href: t.href ?? "",
    label: (t.label ?? t.href ?? "Chapter").trim(),
    subitems: t.subitems?.map((s) => ({
      id: s.id ?? s.href ?? "",
      href: s.href ?? "",
      label: (s.label ?? s.href ?? "").trim(),
    })),
  }));
}

/* ------------------------------ theming ------------------------------- */

export interface EpubThemeSnapshot {
  fontFamily: string;
  fontSize: number;
  background: string;
  foreground: string;
}

/** Resolve the persisted settings into one snapshot for the rendition. */
export function themeSnapshot(settings: { fontId: string; fontSize: number; pageThemeId: string }): EpubThemeSnapshot {
  const font = FONT_OPTIONS.find((f) => f.id === settings.fontId) ?? FONT_OPTIONS[0];
  const theme = PAGE_THEMES.find((t) => t.id === settings.pageThemeId) ?? PAGE_THEMES[0];
  return {
    fontFamily: font.family,
    fontSize: settings.fontSize,
    background: theme.background,
    foreground: theme.foreground,
  };
}

/**
 * Webfont stylesheet for the reader's non-system fonts, injected into
 * EACH chapter document (iframes cannot see parent-document fonts).
 * URL lives in `lib/fonts.ts`, shared with the page-level `<link>`.
 */
import { READER_FONTS_URL } from "@/lib/fonts";

export { READER_FONTS_URL };

/** Ensure the webfont stylesheet exists in a chapter document (idempotent). */
function ensureReaderFonts(doc: Document | undefined | null): void {
  try {
    if (!doc || doc.getElementById("epub-reader-fonts")) return;
    const link = doc.createElement("link");
    link.id = "epub-reader-fonts";
    link.rel = "stylesheet";
    link.href = READER_FONTS_URL;
    doc.head.appendChild(link);
  } catch { /* offline/sandboxed iframes fall back to system fonts */ }
}

type ThemeRules = Record<string, Record<string, string>>;

/**
 * Full theme rule map. `!important` beats author stylesheets, and the
 * broad element selector (not just body inheritance) defeats author
 * rules set directly on headings, cells, etc. Sizes are forced only on
 * body/flow text so headings keep their relative scale.
 */
export function buildThemeRules(snap: EpubThemeSnapshot): ThemeRules {
  const imp = (v: string) => `${v} !important`;
  return {
    "html": {
      background: imp(snap.background),
    },
    "body": {
      "font-family": imp(snap.fontFamily),
      "font-size": imp(`${snap.fontSize}px`),
      "line-height": imp("1.75"),
      background: imp(snap.background),
      color: imp(snap.foreground),
    },
    "p, div, span, li, section, article, blockquote, figcaption, td, th": {
      "font-family": imp(snap.fontFamily),
      "font-size": imp(`${snap.fontSize}px`),
      "line-height": imp("1.75"),
      color: imp(snap.foreground),
    },
    "h1, h2, h3, h4, h5, h6": {
      "font-family": imp(snap.fontFamily),
      color: imp(snap.foreground),
      "line-height": imp("1.4"),
    },
    "a": {
      color: imp("inherit"),
    },
  };
}

/**
 * Live snapshot holder per rendition. The content hook below is
 * registered EXACTLY ONCE per rendition and always reads the current
 * snapshot, so theme changes never accumulate duplicate handlers and
 * newly turned chapters pick up the latest theme automatically.
 */
const liveSnapshots = new WeakMap<object, { current: EpubThemeSnapshot }>();
const hookedRenditions = new WeakSet<object>();

function ensureContentHook(rendition: EpubRendition): void {
  if (hookedRenditions.has(rendition)) return;
  hookedRenditions.add(rendition);
  rendition.hooks.content.register((contents: EpubContents) => {
    try {
      const holder = liveSnapshots.get(rendition);
      if (!holder) return;
      ensureReaderFonts(contents.document);
      contents.addStylesheetRules(buildThemeRules(holder.current), THEME_STYLESHEET_KEY);
    } catch { /* noop */ }
  });
}

/** Style-element id for directly injected theme rules. */
const THEME_STYLESHEET_KEY = "epub-reader-theme";

/**
 * Live content documents for a rendition. epubjs types `getContents()`
 * as a single `Contents`, but every manager implementation returns an
 * array — normalize defensively in this one place.
 */
export function liveContents(rendition: EpubRendition): EpubContents[] {
  try {
    const raw: unknown = rendition.getContents?.();
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/**
 * Apply font + colors to a live rendition: updates the snapshot holder
 * (for future chapters), pushes rules through `themes.default()` (which
 * re-injects into current views), writes straight into live views as
 * well so the theme never depends on a single epub.js code path, and
 * paints iframe gutters. Synchronous and cheap — safe on slider ticks.
 */
export function applyEpubTheme(rendition: EpubRendition, snap: EpubThemeSnapshot): void {
  try {
    let holder = liveSnapshots.get(rendition);
    if (!holder) {
      holder = { current: snap };
      liveSnapshots.set(rendition, holder);
    } else {
      holder.current = snap;
    }
    ensureContentHook(rendition);

    const rules = buildThemeRules(snap);
    try {
      rendition.themes.default(rules);
    } catch { /* fall through to direct injection */ }
    for (const contents of liveContents(rendition)) {
      try {
        ensureReaderFonts(contents.document);
        contents.addStylesheetRules(rules, THEME_STYLESHEET_KEY);
      } catch { /* noop */ }
    }

    // Paint already-mounted iframe gutters so they match instantly.
    // (`View` has no `iframe` in epubjs types; only iframe views do.)
    for (const view of rendition.views() ?? []) {
      try {
        const iframe = (view as unknown as { iframe?: HTMLIFrameElement }).iframe;
        iframe?.style.setProperty("background", snap.background);
        iframe?.parentElement?.style.setProperty("background", snap.background);
      } catch { /* noop */ }
    }
  } catch { /* noop */ }
}

/* ---------------------------- highlights ------------------------------ */

export function highlightFill(color: string): string {
  switch (color) {
    case "green": return "#b2f2bb";
    case "blue": return "#a5d8ff";
    case "pink": return "#ffc6e0";
    default: return "#ffe066";
  }
}

/** Re-apply persisted highlights onto a live rendition. Best-effort. */
export async function restoreHighlights(
  rendition: EpubRendition,
  highlights: Array<{ cfiRange: string; color: string }>,
): Promise<void> {
  for (const h of highlights) {
    try {
      await rendition.annotations.highlight(h.cfiRange, {}, () => {}, "", {
        fill: highlightFill(h.color),
        "fill-opacity": "0.45",
      });
    } catch { /* a highlight may be stale after re-parse */ }
  }
}

/**
 * Force highlight marks back onto the text they belong to.
 *
 * Why this exists: highlight marks live in an SVG overlay whose rects
 * are measured at paint time. When typography/layout changes, epub.js
 * `display()` on the already-shown section only scrolls (see
 * managers/default `display()`: "View is already shown…") instead of
 * reloading — so the overlay keeps stale rects over reflowed text and
 * marks appear on the wrong words. Removing + re-adding re-measures
 * every mark against the current layout. Idempotent and duplicate-free
 * (`remove` detaches before `highlight` re-attaches).
 */
export async function repaintHighlights(
  rendition: EpubRendition,
  highlights: Array<{ cfiRange: string; color: string }>,
): Promise<void> {
  for (const h of highlights) {
    try {
      rendition.annotations.remove(h.cfiRange, "highlight");
    } catch { /* mark may never have painted */ }
  }
  await restoreHighlights(rendition, highlights);
}

/** Extract readable text for a CFI range (bookmark snippets). */
export async function textForCfi(book: EpubBook, cfi: string, max = 160): Promise<string> {
  try {
    const range = await book.getRange(cfi).catch(() => null);
    return range?.toString?.().trim().slice(0, max) ?? "";
  } catch {
    return "";
  }
}

/* ------------------------- chapter labeling --------------------------- */

const normHref = (h: string) => h.split("#")[0].replace(/^\.?\/+/, "");

/**
 * Find the human-readable TOC chapter title for a rendition href
 * (e.g. `Text/ch1.xhtml#sec2` -> "Doubts", `Text/ch1.xhtml` -> "Chapter 1").
 * Priority: full-href exact match (fragment included, depth-first) >
 * fragment-stripped match > suffix match (tolerates `Text/`-prefixed vs
 * bare hrefs across EPUB producers).
 */
export function chapterTitleForHref(items: TocItem[], href: string): string | undefined {
  const full = href.replace(/^\.?\/+/, "");
  if (!full) return undefined;
  const stripped = normHref(href);
  let strippedHit: string | undefined;
  let suffixHit: string | undefined;
  const walk = (list: TocItem[]): string | undefined => {
    for (const t of list) {
      const h = (t.href ?? "").replace(/^\.?\/+/, "");
      if (h && h === full && t.label) return t.label;
      if (t.subitems) {
        const deep = walk(t.subitems);
        if (deep) return deep;
      }
      if (h && h === stripped && t.label) {
        strippedHit ??= t.label;
      } else if (h && stripped && (stripped.endsWith(h) || h.endsWith(stripped)) && t.label) {
        suffixHit ??= t.label;
      }
    }
    return undefined;
  };
  return walk(items) ?? strippedHit ?? suffixHit ?? undefined;
}

/** Turn a spine href into a readable fallback (`Text/part-0003.xhtml` -> "Part 0003"). */
export function prettyFileName(href: string | undefined): string | undefined {
  if (!href) return undefined;
  const base = normHref(href).split("/").pop() ?? "";
  const pretty = base
    .replace(/\.(x?html?|xml|opf|jpe?g|png|gif|webp|svg|pdf|txt|css)$/i, "")
    .replace(/[-_+.]+/g, " ")
    .trim();
  return pretty || undefined;
}

/**
 * Display label for a bookmark. New bookmarks already carry the chapter
 * title; legacy ones may hold raw filenames (`part0003.xhtml`), so strip
 * ebook extensions at render time. Real titles are unaffected.
 */
export function displayBookmarkLabel(label: string): string {
  const stripped = label.replace(/\.(x?html?|xml|opf)$/i, "").trim();
  return stripped || label;
}
