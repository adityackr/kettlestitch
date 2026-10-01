import type { Metadata } from "next";
import { EpubReader } from "@/components/reader/EpubReader";

export const metadata: Metadata = {
  title: "Reader · Kettlestitch",
  description: "Distraction-free EPUB reading with themes, bookmarks and highlights.",
};

/**
 * Per-book reader route. The id is a library entry id — the reader
 * resolves the book (URL or locally persisted bytes) from the library,
 * so refreshes and shared links keep working.
 */
export default function BookReaderPage({ params }: { params: { bookId: string } }) {
  return (
    <main className="min-h-screen bg-background">
      <EpubReader bookId={params.bookId} />
    </main>
  );
}
