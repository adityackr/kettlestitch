"use client";

import { ThemeProvider } from "next-themes";

/**
 * Client-side theme provider. Tooltips are provided once at the root
 * layout (`app/layout.tsx`) so every route — marketing and reader —
 * shares a single TooltipProvider.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
