import { describe, expect, test } from "bun:test";
import { formatBytes } from "./format";

describe("formatBytes", () => {
  test("bytes", () => expect(formatBytes(512)).toBe("512 B"));
  test("kilobytes", () => expect(formatBytes(2048)).toBe("2 KB"));
  test("megabytes", () => expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB"));
});
