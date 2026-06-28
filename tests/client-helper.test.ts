import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatLabel,
  formatPelkatName,
  getServiceTypeColor,
  toTitleCase,
} from "@/lib/client-helper";

describe("client-helper", () => {
  describe("toTitleCase", () => {
    it("formats words as title case", () => {
      expect(toTitleCase("member management")).toBe("Member Management");
    });

    it("handles single word", () => {
      expect(toTitleCase("hello")).toBe("Hello");
    });

    it("handles empty string", () => {
      expect(toTitleCase("")).toBe("");
    });
  });

  describe("getServiceTypeColor", () => {
    it("returns correct badge variant for known types", () => {
      expect(getServiceTypeColor("Sunday Service")).toBe("default");
      expect(getServiceTypeColor("Wednesday Service")).toBe("secondary");
      expect(getServiceTypeColor("Youth Service")).toBe("destructive");
      expect(getServiceTypeColor("Children's Church")).toBe("outline");
    });

    it("returns default for unknown types", () => {
      expect(getServiceTypeColor("Unknown Type")).toBe("default");
      expect(getServiceTypeColor("")).toBe("default");
    });
  });

  describe("formatPelkatName", () => {
    it("converts snake_case to Title Case", () => {
      expect(formatPelkatName("PELAYANAN_ANAK")).toBe("Pelayanan Anak");
      expect(formatPelkatName("PERSEKUTUAN_KAUM_BAPAK")).toBe(
        "Persekutuan Kaum Bapak",
      );
    });

    it("handles single word input", () => {
      expect(formatPelkatName("HELLO")).toBe("Hello");
    });

    it("handles empty string", () => {
      expect(formatPelkatName("")).toBe("");
    });
  });

  describe("formatDate", () => {
    it("formats a Date object", () => {
      const date = new Date("2026-06-02T12:00:00Z");
      const result = formatDate(date);
      // jsdom defaults to en-US locale
      expect(result).toBe("6/2/2026");
    });

    it("formats a date string", () => {
      const result = formatDate("2026-06-02");
      expect(result).toBe("6/2/2026");
    });

    it("formats dates with single-digit month/day", () => {
      expect(formatDate("2026-01-05")).toBe("1/5/2026");
    });
  });

  describe("formatLabel", () => {
    it("replaces underscores with spaces", () => {
      expect(formatLabel("hello_world")).toBe("hello world");
    });

    it("handles multiple underscores", () => {
      expect(formatLabel("a_b_c_d")).toBe("a b c d");
    });

    it("handles string without underscores", () => {
      expect(formatLabel("hello world")).toBe("hello world");
    });

    it("handles empty string", () => {
      expect(formatLabel("")).toBe("");
    });
  });
});
