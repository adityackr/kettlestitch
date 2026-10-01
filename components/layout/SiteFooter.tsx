import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

/** Shared site footer for marketing pages. */
export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <div>
            <p className="text-sm font-semibold">Kettlestitch</p>
            <p className="text-xs text-muted-foreground">The stitch that holds your books together — private reading, on your device.</p>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground" aria-label="Footer">
          <Link href="/add" className="transition-colors hover:text-foreground">Add book</Link>
          <Link href="/library" className="transition-colors hover:text-foreground">Library</Link>
          <Link href="/reader" className="transition-colors hover:text-foreground">Reader</Link>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-5xl px-4 py-3 text-center text-[11px] text-muted-foreground sm:text-left">
          Shortcuts: ←/→ navigate · B bookmark · F fullscreen · Ctrl/⌘+K settings
        </p>
      </div>
    </footer>
  );
}
