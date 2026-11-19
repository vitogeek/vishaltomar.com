import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { caseStudySchema } from "./caseStudySchema";

const schema = caseStudySchema(() => z.string());

const entry = {
  title: "Title",
  summary: "Summary",
  role: "Role",
  timeline: "Timeline",
  stack: ["Example"],
  tags: ["Test data"],
  cover: "cover.png",
  coverAlt: "Cover",
  pubDatetime: new Date("2026-01-01T00:00:00.000Z"),
};

describe("case study type", () => {
  it("defaults to case-study", () => {
    expect(schema.parse(entry).type).toBe("case-study");
  });

  it("accepts impact-report", () => {
    expect(schema.parse({ ...entry, type: "impact-report" }).type).toBe(
      "impact-report"
    );
  });
});
