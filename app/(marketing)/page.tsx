import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, BookOpenText, Gauge, Highlighter, History, Keyboard,
  LibraryBig, MoonStar, ShieldCheck, Sparkles, UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LibraryGrid } from "@/components/library/LibraryGrid";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kettlestitch — private reading, beautifully simple",
  description:
    "A feature-rich EPUB reader with library, bookmarks, highlights, themes and typography controls. Everything stays in your browser.",
};

const FEATURES = [
  {
    icon: LibraryBig,
    tint: "from-amber-500 to-orange-500",
    title: "Local library",
    text: "Uploaded books persist in localStorage with covers, authors and per-book progress.",
  },
  {
    icon: Highlighter,
    tint: "from-yellow-400 to-amber-500",
    title: "Bookmarks & highlights",
    text: "Bookmark pages with B, select text to highlight in four colors — all restored per book.",
  },
  {
    icon: MoonStar,
    tint: "from-indigo-500 to-violet-500",
    title: "Eye-friendly themes",
    text: "Six soothing page themes plus system-aware dark mode for the surrounding UI.",
  },
  {
    icon: BookOpenText,
    tint: "from-emerald-500 to-teal-500",
    title: "Typography control",
    text: "Font-size slider and English + Bengali font families, applied live without reflow jumps.",
  },
  {
    icon: Gauge,
    tint: "from-sky-500 to-blue-500",
    title: "Progress & chapters",
    text: "Live reading percentage, chapter sidebar with active tracking, and location jumping.",
  },
  {
    icon: Keyboard,
    tint: "from-rose-500 to-pink-500",
    title: "Keyboard-first",
    text: "Arrow keys navigate, B bookmarks, F goes fullscreen, Ctrl/⌘+K opens settings.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: UploadCloud,
    title: "Add a book",
    text: "Drop an .epub file or paste a URL. It is saved to your on-device library.",
  },
  {
    n: "02",
    icon: BookOpenText,
    title: "Read your way",
    text: "Tune fonts, themes and layout in a calm, distraction-free reader.",
  },
  {
    n: "03",
    icon: History,
    title: "Pick up where you left off",
    text: "Position, bookmarks and highlights restore automatically per book.",
  },
];

/** Decorative CSS book for the hero shelf (pure markup, no images). */
function HeroBook({
  title, author, gradient, rotate, delay, className,
}: {
  title: string;
  author: string;
  gradient: string;
  rotate: string;
  delay: string;
  className?: string;
}) {
  return (
    <div
      className={cn("animate-float w-32 shrink-0 sm:w-40", className)}
      style={{ "--float-rotate": rotate, animationDelay: delay } as React.CSSProperties}
    >
      <div className={cn("relative h-48 overflow-hidden rounded-l-sm rounded-r-xl shadow-xl shadow-black/20 sm:h-60", gradient)}>
        {/* spine */}
        <div className="absolute inset-y-0 left-0 w-2.5 bg-black/25" />
        <div className="absolute inset-y-0 left-2.5 w-px bg-white/30" />
        {/* sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/20" />
        <div className="relative flex h-full flex-col justify-between p-3 pl-5 text-white">
          <p className="font-serif text-sm font-bold leading-snug sm:text-base">{title}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/80 sm:text-[11px]">{author}</p>
        </div>
      </div>
      {/* shadow */}
      <div className="mx-auto mt-2 h-2 w-3/4 rounded-full bg-black/20 blur-sm dark:bg-black/60" />
    </div>
  );
}

/** Landing page: hero shelf, steps, features, recent books and CTA. */
export default function LandingPage() {
  return (
    <main className="overflow-x-clip">
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative">
        {/* ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="bg-grid mask-fade-y absolute inset-0" />
          <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400/25 via-orange-400/20 to-rose-400/25 blur-3xl dark:from-amber-500/15 dark:via-orange-500/10 dark:to-rose-500/15" />
        </div>

        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pb-10 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up text-center lg:text-left">
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Private · No account · Free forever
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
              Read EPUBs <span className="text-gradient-warm">beautifully</span> and privately
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
              Drop in a book and start reading — your library, position, bookmarks and
              highlights never leave this browser. No account, no backend.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-700"
              >
                <Link href="/add">
                  <UploadCloud className="mr-2 h-4 w-4" /> Add a book
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/library">
                  Open library <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:justify-start">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Files are processed locally — nothing is uploaded anywhere.
            </p>
          </div>

          {/* floating shelf */}
          <div className="animate-fade-up relative hidden items-end justify-center gap-5 pb-4 md:flex" style={{ animationDelay: "150ms" }} aria-hidden>
            <div className="absolute bottom-0 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
            <HeroBook title="Moby Dick" author="Melville" gradient="bg-gradient-to-br from-slate-700 to-slate-900" rotate="-6deg" delay="0s" className="mb-6" />
            <HeroBook title="Gitanjali" author="Tagore" gradient="bg-gradient-to-br from-amber-500 to-orange-700" rotate="2deg" delay="1.2s" />
            <HeroBook title="পথের পাঁচালী" author="বন্দ্যোপাধ্যায়" gradient="bg-gradient-to-br from-emerald-600 to-teal-800" rotate="7deg" delay="2.1s" className="mb-10" />
          </div>
        </div>
      </section>

      {/* ---------------------------- How it works ---------------------------- */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card
              key={s.n}
              className="animate-fade-up group relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 blur-xl transition-opacity group-hover:opacity-100" aria-hidden />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="font-serif text-3xl font-bold text-muted-foreground/25">{s.n}</span>
                </div>
                <CardTitle className="pt-2 text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{s.text}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------------------- Recent books ---------------------------- */}
      <section className="mx-auto w-full max-w-2xl px-4 pb-4">
        <LibraryGrid compact />
      </section>

      {/* ------------------------------ Features ------------------------------ */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">Everything a reader needs</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Built with Next.js, shadcn/ui and epub.js — tuned to avoid re-render storms while you read.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5">
              <CardHeader className="pb-2">
                <div className={cn("mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", f.tint)}>
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{f.text}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* -------------------------------- CTA -------------------------------- */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-8 text-center text-white shadow-xl shadow-orange-500/20 sm:p-12">
          <div className="bg-grid absolute inset-0 opacity-20" aria-hidden style={{ filter: "invert(1)" }} />
          <div className="relative">
            <BookOpenText className="mx-auto h-10 w-10 opacity-90" />
            <h2 className="mx-auto mt-4 max-w-md text-2xl font-bold sm:text-3xl">Your next book is one drop away</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
              Start your on-device library in seconds. Resume exactly where you left off — every time.
            </p>
            <Button size="lg" variant="secondary" asChild className="mt-6 bg-white text-orange-700 hover:bg-orange-50">
              <Link href="/add">
                <UploadCloud className="mr-2 h-4 w-4" /> Add your first book
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
