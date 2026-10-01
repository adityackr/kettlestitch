import { describe, expect, test } from "bun:test";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./base64";

describe("base64 binary round-trip", () => {
  test("empty buffer", () => {
    const buf = new ArrayBuffer(0);
    expect(base64ToArrayBuffer(arrayBufferToBase64(buf)).byteLength).toBe(0);
  });

  test("all byte values survive", () => {
    const bytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) bytes[i] = i;
    const roundTripped = new Uint8Array(base64ToArrayBuffer(arrayBufferToBase64(bytes.buffer)));
    expect(roundTripped).toEqual(bytes);
  });

  test("multi-chunk payload (exercises the 32k slicing)", () => {
    const bytes = new Uint8Array(200_000);
    crypto.getRandomValues(bytes);
    const roundTripped = new Uint8Array(base64ToArrayBuffer(arrayBufferToBase64(bytes.buffer)));
    expect(roundTripped).toEqual(bytes);
  });

  test("zip magic survives (sanity for EPUB bytes)", () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    const out = new Uint8Array(base64ToArrayBuffer(arrayBufferToBase64(bytes.buffer)));
    expect(Array.from(out)).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
