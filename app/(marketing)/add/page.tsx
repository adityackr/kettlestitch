import type { Metadata } from "next";
import { FileUpload } from "@/components/reader/FileUpload";

export const metadata: Metadata = {
  title: "Add book · Kettlestitch",
  description: "Upload an EPUB from your device or load one from a URL. It is saved to your local library.",
};

/** Add page: file import + URL loader (upload card + saved-books shortcut). */
export default function AddPage() {
  return (
    <main className="min-h-[70vh] bg-background">
      <FileUpload />
    </main>
  );
}
