"use client";

import { useState } from "react";
import Link from "next/link";
import { LibraryBig, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LibraryGrid, type LibrarySortKey } from "@/components/library/LibraryGrid";
import { useLibraryStore } from "@/store/libraryStore";

/** Client body of /library — search/sort toolbar, grid, or a styled empty state. */
export function LibraryView() {
  const { count, query, setQuery, sort, setSort } = useLibraryView();

  if (count === 0) {
    return (
      <div className="animate-fade-up relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-dashed p-10 text-center sm:p-14">
        <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden>
          <div className="absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400/20 via-orange-400/15 to-rose-400/20 blur-3xl" />
        </div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/25">
          <LibraryBig className="h-8 w-8" />
        </div>
        <p className="relative text-lg font-semibold">Your shelf is empty</p>
        <p className="relative max-w-sm text-sm text-muted-foreground">
          Upload an EPUB or paste a URL and it will live here — with its cover,
          progress, bookmarks and highlights, all on this device.
        </p>
        <Button
          asChild
          className="relative mt-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25 hover:from-amber-600 hover:to-orange-700"
        >
          <Link href="/add">
            <Plus className="mr-2 h-4 w-4" /> Add your first book
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, filename…"
            aria-label="Search library"
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as LibrarySortKey)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Sort library">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently read</SelectItem>
            <SelectItem value="added">Recently added</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
            <SelectItem value="progress">Most progress</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <LibraryGrid query={query} sort={sort} onClearSearch={() => setQuery("")} />
    </div>
  );
}

/** All LibraryView logic: count, search query, sort order. */
function useLibraryView() {
  const count = useLibraryStore((s) => s.books.length);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<LibrarySortKey>("recent");
  return { count, query, setQuery, sort, setSort };
}
