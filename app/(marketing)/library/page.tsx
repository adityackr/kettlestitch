import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LibraryView } from "@/components/library/LibraryView";

export const metadata: Metadata = {
  title: "Library · Kettlestitch",
  description: "All your saved EPUB books, persisted locally in your browser.",
};

/**
 * Library page (inside the marketing layout, so it shares the site
 * header/footer). Books persist in localStorage — click any book to
 * open it in the distraction-free reader.
 */
export default function LibraryPage() {
  return (
    <main className="relative mx-auto min-h-[70vh] w-full max-w-4xl px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-20 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400/15 via-orange-400/10 to-rose-400/15 blur-3xl" />
      </div>
      <div className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Your <span className="text-gradient-warm">library</span>
          </h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Saved in your browser&apos;s localStorage. Open any book to resume exactly
            where you left off — position, bookmarks and highlights included.
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-700"
        >
          <Link href="/add">
            <Plus className="mr-2 h-4 w-4" /> Add book
          </Link>
        </Button>
      </div>
      <LibraryView />
    </main>
  );
}
