import type { Metadata } from "next";
import { ReaderRedirect } from "@/components/reader/ReaderRedirect";

export const metadata: Metadata = {
  title: "Reader · Kettlestitch",
  description: "Distraction-free EPUB reading with themes, bookmarks and highlights.",
};

/**
 * `/reader` (no id) — continues the most recently read book,
 * or sends first-time users to `/add`.
 */
export default function ReaderPage() {
  return (
    <main className="min-h-screen bg-background">
      <ReaderRedirect />
    </main>
  );
}
