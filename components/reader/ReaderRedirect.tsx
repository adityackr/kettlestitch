"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLibraryStore } from "@/store/libraryStore";

/**
 * `/reader` (no id) — "continue reading" redirector.
 * Jumps to the most recently opened book, or to `/add` when the library
 * is empty. Waits for zustand/persist hydration so a hard refresh still
 * lands on the right page.
 */
export function ReaderRedirect() {
  useReaderRedirect();

  return (
    <div className="flex h-screen items-center justify-center gap-2">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Opening your library…</p>
    </div>
  );
}

/** All ReaderRedirect logic: continue most-recent book, else go to /add. */
function useReaderRedirect() {
  const router = useRouter();

  useEffect(() => {
    const decide = () => {
      const books = useLibraryStore.getState().books;
      if (books.length === 0) {
        router.replace("/add");
        return;
      }
      const latest = [...books].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)[0];
      // Ids are URL-safe by construction (see `bookKey`), so no encoding needed.
      router.replace(`/reader/${latest.id}`);
    };
    if (useLibraryStore.persist.hasHydrated()) {
      decide();
    } else {
      const unsub = useLibraryStore.persist.onFinishHydration(decide);
      return unsub;
    }
  }, [router]);
}
