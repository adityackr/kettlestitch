# Architecture

Kettlestitch is layered so a backend can be added later without
rewriting the app. The rule is simple: **dependencies point inward**
(`components → hooks → services → stores → repositories → browser APIs`).
Nothing below a layer imports from above it.

```
app/                  routes + layouts (server components, thin)
components/           UI only: render store state, call services on events
hooks/                epub.js lifecycle (useEpub), settings sync, shortcuts
lib/services/         use-cases: import/open/restore/delete books
store/                in-memory UI/domain state (zustand, no raw I/O)
lib/data/             persistence seam (see below)
lib/                  pure helpers (epub, base64, storage, format, fonts)
```

## Data flow: opening a book

```
LibraryCard / FileUpload / /reader/[bookId]
  → lib/services/books.ts   (openBook / importEpubFile / importEpubUrl / restoreBookFile)
      → useLibraryStore     (metadata index only)
      → bookBinaries / bookData (repositories — bytes + per-book JSON)
  → useReaderStore.setSource (transient ArrayBuffer / URL for epub.js)
  → useEpub renders the rendition
```

Components never touch `localStorage` or base64 directly. Stores never
contain transport code. All storage keys are built in exactly one place
(`lib/data/keys.ts`).

## Persistence seam (`lib/data/`)

| File | Role |
|---|---|
| `keys.ts` | Every storage-key builder. Change a format here, nowhere else. |
| `repositories.ts` | `BookBinaryStore` + `BookDataStore` interfaces. **All async** — sync localStorage assumptions must never leak upward again. |
| `local.ts` | `LocalBookBinaryStore` / `LocalBookDataStore` (localStorage + session memory cache). |
| `index.ts` | **Composition root.** The only file that constructs repositories. |

Writes are optimistic: stores update memory immediately, persistence
follows in the background (`void repo.save(...).catch(...)`). Reads that
must precede rendering (`bindBook`, position restore) are awaited.

## Adding a backend later

1. Implement `BookBinaryStore` + `BookDataStore` against your API
   (same async signatures — e.g. `load()` → `GET /books/:id/file`).
2. Construct them in `lib/data/index.ts` instead of the `Local*` classes.
3. Done — no store, service, hook, or component changes.

Notes for that migration:

- **Auth/sync strategy** lives in the new implementations (tokens,
  retries, offline queue). Consider an operation log if you need
  offline writes.
- **Library metadata** (`libraryIndexKey` via zustand/persist) and
  **settings** (`settingsKey`) are still local-only by design (tiny,
  device-specific). If they must roam, abstract them the same way —
  note settings need an async-load UX the current sync store avoids.
- **Large binaries** should move to IndexedDB (async, ~GB quota) before
  any backend exists; the `BookBinaryStore` interface already fits it.
- Keep the optimistic-write pattern: memory first, transport second.

## Conventions

- **Atomic zustand selectors** (`s => s.progress`) — never subscribe to
  whole stores from render-heavy components. Per-page-turn updates
  (`relocated`) must only reach the components that render them.
- **Stable callbacks** (`useCallback` over refs) into every `memo()`-ed
  child; listener hooks (`useKeyboardShortcuts`) mirror handlers into a
  ref and subscribe once.
- **epub.js has no full types upstream** — `lib/epub.ts` aliases the real
  `Book`/`Rendition`/`Contents` declarations and adds minimal structural
  types only for genuinely untyped runtime shapes (`EpubCfiLocation`,
  `spineItems`), each marked as such.
- **No dead code**: unused store actions/components are deleted, not
  commented. `bun run typecheck`, `bun run build`, `bun test` must all
  pass before merge.
