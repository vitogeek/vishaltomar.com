import { describe, expect, it } from "vitest";
import { publishedDate } from "./publishedDate";

describe("publishedDate", () => {
  it("keeps a date-only value on the calendar day that was written", () => {
    expect(publishedDate(new Date("2026-10-26T00:00:00.000Z"))).toEqual({
      iso: "2026-10-26",
      label: "Oct 26, 2026",
    });
  });

  it("formats a zoned datetime in America/Toronto", () => {
    expect(publishedDate(new Date("2026-11-13T09:00:00-05:00"))).toEqual({
      iso: "2026-11-13",
      label: "Nov 13, 2026",
    });
    expect(publishedDate(new Date("2026-11-21T15:00:00.000Z"))).toEqual({
      iso: "2026-11-21",
      label: "Nov 21, 2026",
    });
  });

  it("uses the previous Toronto calendar day when the instant falls there", () => {
    expect(publishedDate(new Date("2026-11-21T03:30:00.000Z"))).toEqual({
      iso: "2026-11-20",
      label: "Nov 20, 2026",
    });
  });
});
