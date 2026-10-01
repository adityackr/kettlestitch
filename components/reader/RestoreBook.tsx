"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { CloudOff, UploadCloud, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReaderStore } from "@/store/readerStore";
import { restoreBookFile } from "@/lib/services/books";

/**
 * Shown when a library entry's binary is missing (localStorage quota
 * evicted it). The user re-attaches the file, which is re-cached,
 * re-persisted, and opened — bookmarks/highlights/position are keyed by
 * book id, so everything is restored.
 */
export function RestoreBook({ bookId, title, onRestored }: { bookId: string; title: string; onRestored: () => void }) {
  const { fileRef, busy, error, browse, handleFileChange } = useRestoreBook(bookId, title, onRestored);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4">
      <Card className="w-full overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" aria-hidden />
        <CardHeader className="text-center">
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <CloudOff className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">File needed to open “{title}”</CardTitle>
          <CardDescription>
            This book&apos;s file no longer fits in localStorage, so only its
            library entry was kept. Re-attach the .epub to continue — your
            position, bookmarks and highlights are still saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
            disabled={busy}
            onClick={browse}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {busy ? "Reading file…" : "Re-attach EPUB file"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".epub,application/epub+zip"
            className="hidden"
            onChange={handleFileChange}
          />
          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/library">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to library
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** All RestoreBook logic: re-attach flow, busy/error state. */
function useRestoreBook(bookId: string, title: string, onRestored: () => void) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        const { title: resolvedTitle, buffer } = await restoreBookFile(bookId, file);
        useReaderStore.getState().setSource({ bookId, title: resolvedTitle, fileData: buffer, fileUrl: null });
        onRestored();
      } catch {
        setError("Could not read that file. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [bookId, title, onRestored],
  );

  const browse = useCallback(() => fileRef.current?.click(), []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void restore(f);
      e.target.value = "";
    },
    [restore],
  );

  return { fileRef, busy, error, browse, handleFileChange };
}
