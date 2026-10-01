import type { ReactNode } from "react";

/**
 * Reader layout — deliberately chromeless (no site header/footer).
 * The reader page owns the full viewport for distraction-free reading;
 * all navigation lives inside its own toolbar.
 */
export default function ReaderLayout({ children }: { children: ReactNode }) {
  return children;
}
