# Kettlestitch

A feature-rich, private EPUB reader built with **Next.js (App Router)**, **TypeScript (strict)**, **shadcn/ui**, **Tailwind CSS**, **epub.js**, **next-themes**, **Zustand** and **lucide-react**. Package manager: **bun**.

## Features

- **Library (localStorage)** — every uploaded EPUB / URL is saved to a library
  (`/library` page + section on the welcome screen). Metadata (title, author,
  cover thumbnail, progress) lives under `epub-reader:library`; each
  file's binary is base64-persisted under its own `epub-reader:book-data:<id>`
  key so one large book can't corrupt the index. Click to reopen with position,
  bookmarks and highlights restored; delete per book. Files exceeding the ~5MB
  localStorage quota still open for the session (memory-only) and are flagged
  for re-upload.

- **File input** — drag-and-drop zone, file picker, EPUB URL loader, loading skeleton while parsing.
- **Theme** — dark/light/system via `next-themes` + shadcn `DropdownMenu`, persisted.
- **Layout** — single vs double-page spread, left–right paginated vs top–bottom scrolled; persisted.
- **Typography** — font-size slider (12–32px), 3 English fonts (Georgia, Merriweather, Open Sans) + 3 Bengali fonts (Noto Sans Bengali, Hind Siliguri, Baloo Da 2) loaded from Google Fonts; persisted.
- **Page color themes** — cream, sepia, soft gray, mint, dark navy, pure dark swatches with auto contrast text.
- **Bookmarks** — `B` to bookmark current CFI, Sheet listing with snippet preview, jump + delete, per-book persistence.
- **Highlights** — select text → Popover with 4 colors → saved by CFI range; Highlights tab to jump/delete; re-applied on load.
- **Fullscreen** — Fullscreen API toggle (`F`).
- **Progress bar** — shadcn `Progress`, updates on `relocated` via `book.locations`.
- **Chapter sidebar** — TOC from `book.loaded.navigation`, click to navigate, active chapter highlighted.
- **Navigation** — prev/next buttons, ToggleGroup for direction, location/% jump input.
- **UX** — collapsible sidebar + settings/library sheets, responsive, smooth theme transitions, autosave/restore of last CFI per book.
- **Shortcuts** — `←/→` prev/next, `B` bookmark, `F` fullscreen, `Ctrl/⌘+K` settings.

## Pages

| Route | Layout | Purpose |
|---|---|---|
| `/` | marketing (header + footer) | Landing page: hero, features, recently saved books |
| `/add` | marketing | Upload an EPUB (drag-drop/picker) or load from URL; saved to the library, then opens the reader |
| `/library` | marketing | All saved books with covers, authors and progress; click to read |
| `/reader` | **chromeless** | Continue-reading redirect: most recently opened book, or `/add` when the library is empty |
| `/reader/[bookId]` | **chromeless** | Distraction-free reading for one book — no site header/footer, only the reader toolbar. The id is a library entry id, so refreshes and shared links restore the book (URL or locally persisted bytes) with position, bookmarks and highlights |

## Project structure

```
app/
  layout.tsx              # root: fonts, theme providers
  (marketing)/            # shared header + footer
    page.tsx              # landing page
    add/page.tsx          # import page
    library/page.tsx      # saved books
  reader/                 # chromeless layout (no header/footer)
    page.tsx              # continue-reading redirect
    [bookId]/page.tsx     # per-book reader (deep-linkable, refresh-safe)
components/
  layout/               # SiteHeader, SiteFooter, Logo (marketing only)
  reader/               # EpubReader, FileUpload, ReaderView, Toolbar, ReaderProgress, HighlightPicker, RestoreBook, ReaderRedirect, ThemeToggle, Providers
  library/              # LibraryGrid, LibraryView
  settings/             # SettingsPanel
  sidebar/              # ChapterSidebar, BookmarkPanel, HighlightsPanel, LibrarySheet
  ui/                   # shadcn primitives (button, slider, select, dialog, alert-dialog, sheet, tabs, ...)
store/                  # in-memory zustand state: readerStore, settingsStore, libraryStore (metadata), bookmarkStore, highlightStore
types/                  # TocItem, PageTheme, FontOption, Bookmark, Highlight, LibraryBook
hooks/                  # useEpub, useEpubSettings, useBookmarkActions, usePendingSelection, useFullscreen, useKeyboardShortcuts
lib/
  data/                 # persistence seam: keys.ts, repositories.ts (async interfaces), local.ts, index.ts (composition root)
  services/             # use-cases: books.ts (import/open/restore/delete)
  utils, storage, epub (pure epub.js helpers + real epubjs types), base64, format, fonts
```

> Architecture notes (layers, data flow, and the backend recipe) live in
> `ARCHITECTURE.md`. Unit tests (`bun test`) cover the pure `lib/` units.

## Setup (bun)

```bash
bun install
bun dev        # http://localhost:3000
bun run build
bun start
bun run typecheck
bun test       # unit tests (pure lib/ units)
```

> shadcn components in `components/ui` follow the CLI output (`npx shadcn@latest add button slider select dialog sheet tabs tooltip popover card scroll-area separator toggle toggle-group progress input dropdown-menu skeleton badge`). To re-add upstream: `bunx --bun shadcn@latest add <component>`.

## Usage

1. Start at `/add`: drop a `.epub` file (or paste a direct `https://… .epub` URL) — you're taken to `/reader`.
2. Read with ←/→, adjust fonts/colors/layout in settings (`Ctrl/⌘+K`).
3. Select text to highlight; press `B` to bookmark.
4. Progress, position, bookmarks, highlights and preferences restore automatically per book (keys: `epub-reader:*` in localStorage).
5. Close a book with the ✕ button to return to `/library`.

## Notes

- Remote URLs need CORS enabled on the host (epub.js fetches the file as a blob). Files from disk always work.
- Location percentages require `book.locations.generate()`; the jump box also accepts a raw location index once generated.
