"use client";

import { memo, useCallback, useState } from "react";
import { Library } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkPanel } from "@/components/sidebar/BookmarkPanel";
import { HighlightsPanel } from "@/components/sidebar/HighlightsPanel";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onJump: (cfi: string) => void;
}

/** Combined Bookmarks + Highlights sheet with tabs. */
export const LibrarySheet = memo(function LibrarySheet({ open, onOpenChange, onJump }: Props) {
  const { tab, setTab, jumpAndClose } = useLibrarySheet(onJump, onOpenChange);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Library className="h-5 w-5" /> Library</SheetTitle>
          <SheetDescription>Bookmarks and highlights for this book. Click an item to jump to it.</SheetDescription>
        </SheetHeader>
        <Tabs value={tab} onValueChange={setTab} className="mt-4 flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="highlights">Highlights</TabsTrigger>
          </TabsList>
          <TabsContent value="bookmarks" className="min-h-0 flex-1">
            <BookmarkPanel onJump={jumpAndClose} />
          </TabsContent>
          <TabsContent value="highlights" className="min-h-0 flex-1">
            <HighlightsPanel onJump={jumpAndClose} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});

/** All LibrarySheet logic: active tab + jump-and-close navigation. */
function useLibrarySheet(onJump: (cfi: string) => void, onOpenChange: (v: boolean) => void) {
  const [tab, setTab] = useState("bookmarks");

  const jumpAndClose = useCallback(
    (cfi: string) => {
      onJump(cfi);
      onOpenChange(false);
    },
    [onJump, onOpenChange],
  );

  return { tab, setTab, jumpAndClose };
}
