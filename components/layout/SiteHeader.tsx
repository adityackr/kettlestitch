"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/reader/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/add", label: "Add book" },
  { href: "/library", label: "Library" },
];

/** Shared site header for marketing pages (landing / add / library). */
export function SiteHeader() {
  const { links } = useSiteHeader();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="group flex items-center gap-2 font-semibold" aria-label="Kettlestitch home">
          <span className="transition-transform group-hover:scale-105">
            <Logo size={32} />
          </span>
          <span className="text-sm sm:text-base">Kettle<span className="text-gradient-warm">stitch</span></span>
        </Link>
        <nav className="ml-2 flex items-center gap-1" aria-label="Primary">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                item.active ? "bg-muted font-medium" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** All SiteHeader logic: nav links with active-route state. */
function useSiteHeader() {
  const pathname = usePathname();
  const links = NAV.map((item) => ({
    ...item,
    active: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  }));
  return { links };
}
