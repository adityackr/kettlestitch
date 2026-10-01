/**
 * Base64 helpers for persisting EPUB binaries in localStorage.
 *
 * localStorage only stores strings (~5MB quota in most browsers), so
 * uploaded files are kept as base64 under their own key
 * (`epub-reader:book-data:<id>`) — separate from the metadata index —
 * so one large book can't wipe the whole library on quota errors.
 */

/** ArrayBuffer -> base64 (chunked to avoid call-stack limits on big books). */
export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
}

/** base64 -> ArrayBuffer (fresh copy, safe to hand to epub.js). */
export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer.slice(0) as ArrayBuffer;
}

/** Blob -> dataURL (used for downscaled cover thumbnails). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Downscale an image blob to a small JPEG dataURL so covers stay tiny
 * in localStorage. Falls back to the raw dataURL on any failure.
 */
export async function coverBlobToThumbnail(blob: Blob, maxSide = 256): Promise<string> {
  try {
    const url = URL.createObjectURL(blob);
    try {
      const img = await loadImage(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return await blobToDataUrl(blob);
      ctx.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", 0.72);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return await blobToDataUrl(blob).catch(() => "");
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
