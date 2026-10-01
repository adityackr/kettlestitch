import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/reader/Providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { READER_FONTS_URL } from "@/lib/fonts";

const SITE_NAME = "Kettlestitch";
const SITE_TAGLINE = "Private EPUB reading, beautifully simple";
const SITE_DESCRIPTION =
  "Kettlestitch is a free, private EPUB reader with an on-device library, bookmarks, highlights, soothing page themes and English + Bengali typography. No account, no backend — your books never leave your browser.";

// TODO: replace with the production domain when deployed.
const SITE_URL = "https://kettlestitch.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "epub reader",
    "ebook reader",
    "read epub online",
    "private ereader",
    "bengali ebooks",
    "bangla epub reader",
    "offline epub reader",
    "epub highlights",
    "epub bookmarks",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0" },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* English + Bengali reading fonts — same URL is injected into
            EPUB iframe documents (see `lib/fonts.ts`, `lib/epub.ts`),
            since iframes cannot see parent-document fonts. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={READER_FONTS_URL} rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
