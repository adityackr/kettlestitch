"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { Trash2, UploadCloud, Globe, HardDrive, CloudOff, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLibraryStore } from "@/store/libraryStore";
import { deleteBookEverywhere } from "@/lib/services/books";
import { formatBytes } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type LibrarySortKey = "recent" | "added" | "title" | "progress";

/** Deterministic cover gradient per book (for entries without artwork). */
const COVER_GRADIENTS = [
  "from-amber-500 to-orange-700",
  "from-emerald-500 to-teal-700",
  "from-sky-500 to-indigo-700",
  "from-rose-500 to-pink-700",
];

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COVER_GRADIENTS[h % COVER_GRADIENTS.length];
}

/**
 * Grid of saved books. Click a card to open it — the `/reader/[bookId]`
 * route resolves the source (URL, cached/persisted bytes, or the
 * re-upload screen for quota-evicted books), so cards never touch
 * binaries themselves.
 *
 * Render discipline: the grid subscribes to the book list (shallow),
 * and each card subscribes to its own book object. A progress tick for
 * one book re-renders exactly one card.
 */
export function LibraryGrid({
  compact = false,
  query = "",
  sort = "recent",
  onClearSearch,
}: {
  compact?: boolean;
  query?: string;
  sort?: LibrarySortKey;
  onClearSearch?: () => void;
}) {
  const { bookCount, visibleIds, trimmedQuery } = useLibraryGrid(query, sort);

  if (bookCount === 0) return null;

  return (
    <div className={compact ? "mt-8 w-full" : "w-full"}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your library · {bookCount} {bookCount === 1 ? "book" : "books"}
        </h2>
      </div>
      {visibleIds.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
          <SearchX className="h-7 w-7 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            No books match “{trimmedQuery}”.
          </p>
          {onClearSearch && (
            <Button variant="outline" size="sm" onClick={onClearSearch}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibleIds.map((id) => (
            <LibraryCard key={id} id={id} />
          ))}
        </div>
      )}
    </div>
  );
}

const LibraryCard = memo(function LibraryCard({ id }: { id: string }) {
  const { book, pct, initial, gradient, open, confirmOpen, setConfirmOpen, handleRemove } =
    useLibraryCard(id);

  if (!book) return null;

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10">
      <button onClick={open} className="block w-full text-left" aria-label={`Open ${book.title}`}>
        <div className="relative flex h-36 items-center justify-center overflow-hidden bg-muted">
          {book.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br", gradient)}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" aria-hidden />
              <span className="font-serif text-5xl font-bold text-white/95 drop-shadow-md">{initial}</span>
            </div>
          )}
          {pct >= 100 ? (
            <Badge className="absolute bottom-2 left-2 bg-emerald-600 text-[10px] text-white hover:bg-emerald-600">Finished</Badge>
          ) : pct > 0 ? (
            <Badge variant="secondary" className="absolute bottom-2 left-2 text-[10px] backdrop-blur">{pct}% read</Badge>
          ) : null}
        </div>
        <CardContent className="space-y-1.5 p-3">
          <p className="truncate text-sm font-medium" title={book.title}>{book.title}</p>
          {book.author && <p className="truncate text-xs text-muted-foreground">{book.author}</p>}
          <div className="flex items-center gap-1.5">
            {book.sourceType === "url" ? (
              <Badge variant="outline" className="gap-1 text-[10px]"><Globe className="h-3 w-3" /> URL</Badge>
            ) : book.storage === "localStorage" && !book.binaryMissing ? (
              <Badge variant="outline" className="gap-1 text-[10px]"><HardDrive className="h-3 w-3" /> Saved</Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[10px] text-amber-600"><CloudOff className="h-3 w-3" /> Re-upload needed</Badge>
            )}
            {book.size != null && book.size > 0 && (
              <span className="text-[10px] text-muted-foreground">{formatBytes(book.size)}</span>
            )}
          </div>
          {pct > 0 && pct < 100 && (
            <Progress value={pct} className="h-1" />
          )}
        </CardContent>
      </button>
      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {book.binaryMissing && (
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 shadow-md"
            aria-label={`Re-upload file for ${book.title}`}
            onClick={open}
          >
            <UploadCloud className="h-3.5 w-3.5" />
          </Button>
        )}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 shadow-md hover:text-destructive"
              aria-label={`Remove ${book.title} from library`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove &ldquo;{book.title}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This deletes the book file plus its saved position, bookmarks and
                highlights from this device. This can&rsquo;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete book
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
});

/** All LibraryGrid logic: book list with search filter + sort. */
function useLibraryGrid(query: string, sort: LibrarySortKey) {
  const books = useLibraryStore(useShallow((s) => s.books));

  const visibleIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            (b.author ?? "").toLowerCase().includes(q) ||
            (b.fileName ?? "").toLowerCase().includes(q),
        )
      : books;
    const sorted = [...filtered];
    switch (sort) {
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "added":
        sorted.sort((a, b) => b.addedAt - a.addedAt);
        break;
      case "progress":
        sorted.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        break;
      case "recent":
      default:
        sorted.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    }
    return sorted.map((b) => b.id);
  }, [books, query, sort]);

  return { bookCount: books.length, visibleIds, trimmedQuery: query.trim() };
}

/** All LibraryCard logic: book lookup, derived display values, actions. */
function useLibraryCard(id: string) {
  const router = useRouter();
  const book = useLibraryStore((s) => s.books.find((b) => b.id === id));
  const [confirmOpen, setConfirmOpen] = useState(false);

  // The reader route resolves + loads the book; missing bytes land on
  // the re-upload screen. No binary handling here by design.
  const open = useCallback(() => {
    if (!book) return;
    router.push(`/reader/${book.id}`);
  }, [book, router]);

  const handleRemove = useCallback(() => {
    void deleteBookEverywhere(id);
  }, [id]);

  return {
    book,
    pct: book ? Math.round((book.progress || 0) * 100) : 0,
    initial: ((book?.title.trim()[0] ?? "B").toUpperCase()),
    gradient: book ? gradientFor(book.id) : gradientFor(id),
    open,
    confirmOpen,
    setConfirmOpen,
    handleRemove,
  };
}
