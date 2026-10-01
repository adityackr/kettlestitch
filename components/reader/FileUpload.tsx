"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadCloud, Link2, Loader2, BookOpenText, ArrowRight, HardDrive, Zap, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReaderStore } from "@/store/readerStore";
import { useLibraryStore } from "@/store/libraryStore";
import { LibraryGrid } from "@/components/library/LibraryGrid";
import { importEpubFile, importEpubUrl } from "@/lib/services/books";
import { cn } from "@/lib/utils";

const TIPS = [
  { icon: HardDrive, title: "Stays on-device", text: "Books are stored in localStorage — nothing is uploaded." },
  { icon: Zap, title: "Opens instantly", text: "Files open straight into the distraction-free reader." },
  { icon: Keyboard, title: "Keyboard-first", text: "←/→ turn pages · B bookmarks · F fullscreen · ⌘K settings." },
];

/**
 * File-input card for the add page: drag-and-drop + file picker +
 * URL loader. On success the book is registered in the library and the
 * user is taken to the distraction-free reader route.
 */
export function FileUpload() {
  const {
    url, setUrl, dragOver, loading, error, fileRef,
    browse, handleDropZoneKeyDown, handleDragOver, handleDragLeave,
    handleDrop, handleFileChange, handleUrlKeyDown, submitUrl,
  } = useFileUpload();

  return (
    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-10">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-10 h-56 w-[30rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400/20 via-orange-400/15 to-rose-400/20 blur-3xl dark:from-amber-500/10 dark:via-orange-500/10 dark:to-rose-500/10" />
      </div>

      <div className="animate-fade-up w-full text-center">
        <Badge variant="secondary" className="rounded-full px-3 py-1">Step 1 · Add a book</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          What are we reading <span className="text-gradient-warm">today?</span>
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Drop a file, pick one from your device, or paste a direct EPUB URL. Everything stays in your browser.
        </p>
      </div>

      <Card className="animate-fade-up mt-6 w-full overflow-hidden shadow-lg" style={{ animationDelay: "120ms" }}>
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" aria-hidden />
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25">
            <BookOpenText className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Add a book</CardTitle>
          <CardDescription>EPUB files only · processed entirely on-device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop an EPUB file here or click to browse"
            onClick={browse}
            onKeyDown={handleDropZoneKeyDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 sm:p-10",
              dragOver
                ? "scale-[1.01] border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                : "border-muted-foreground/25 bg-muted/30 hover:border-amber-500/60 hover:bg-amber-500/5",
            )}
          >
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl transition-all",
              dragOver ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
              : loading ? "bg-primary/10" : "bg-gradient-to-br from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400",
            )}>
              {loading ? (
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              ) : (
                <UploadCloud className="h-7 w-7" />
              )}
            </div>
            <p className="text-sm font-semibold">
              {loading ? "Parsing EPUB…" : dragOver ? "Drop it — we'll take it from here" : "Drag & drop your .epub here"}
            </p>
            <p className="text-xs text-muted-foreground">or click to browse your device</p>
            <Badge variant="outline" className="mt-1 font-mono text-[11px]">.epub</Badge>
            <input
              ref={fileRef}
              type="file"
              accept=".epub,application/epub+zip"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            or load from URL
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="https://example.com/book.epub"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleUrlKeyDown}
                className="pl-9"
                inputMode="url"
              />
            </div>
            <Button
              onClick={submitUrl}
              disabled={!url.trim() || loading}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-700"
            >
              Load URL
            </Button>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* tips */}
      <div className="animate-fade-up mt-6 grid w-full gap-3 sm:grid-cols-3" style={{ animationDelay: "200ms" }}>
        {TIPS.map((t) => (
          <div key={t.title} className="rounded-xl border bg-card p-3.5 text-left shadow-sm">
            <t.icon className="h-4 w-4 text-amber-500" />
            <p className="mt-2 text-[13px] font-semibold">{t.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.text}</p>
          </div>
        ))}
      </div>

      {/* Persisted library — every uploaded / URL book lives here. */}
      <LibraryGrid compact />
      <LibraryLink />
    </div>
  );
}

function LibraryLink() {
  const { visible } = useLibraryLink();
  if (!visible) return null;
  return (
    <div className="mt-3 text-center">
      <Link
        href="/library"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        View full library <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/** All LibraryLink logic: visible only when the library is non-empty. */
function useLibraryLink() {
  const count = useLibraryStore((s) => s.books.length);
  return { visible: count > 0 };
}

/** All FileUpload logic: import flows, drag state, input wiring. */
function useFileUpload() {
  const router = useRouter();
  const setSource = useReaderStore((s) => s.setSource);
  const isLoading = useReaderStore((s) => s.isLoading);
  const storeError = useReaderStore((s) => s.error);
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openFile = useCallback(
    async (file: File) => {
      if (!file) return;
      setBusy(true);
      setLocalError(null);
      try {
        const { bookId, title, fileData } = await importEpubFile(file);
        setSource({ bookId, title, fileData, fileUrl: null });
        router.push(`/reader/${bookId}`);
      } catch {
        setLocalError("Could not read that file. Please try another EPUB.");
      } finally {
        setBusy(false);
      }
    },
    [setSource, router],
  );

  const submitUrl = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLocalError(null);
    importEpubUrl(url)
      .then(({ bookId, title, fileUrl }) => {
        setSource({ bookId, title, fileData: null, fileUrl });
        router.push(`/reader/${bookId}`);
      })
      .catch(() => setLocalError("That URL did not work. Check the link and try again."));
  }, [url, setSource, router]);

  const browse = useCallback(() => fileRef.current?.click(), []);

  const handleDropZoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") fileRef.current?.click();
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void openFile(f);
    },
    [openFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void openFile(f);
      e.target.value = "";
    },
    [openFile],
  );

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") submitUrl();
    },
    [submitUrl],
  );

  return {
    url,
    setUrl,
    dragOver,
    loading: isLoading || busy,
    error: storeError ?? localError,
    fileRef,
    browse,
    handleDropZoneKeyDown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    handleUrlKeyDown,
    submitUrl,
  };
}
