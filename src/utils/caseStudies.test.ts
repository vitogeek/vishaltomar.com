import { describe, expect, it } from "vitest";
import { getRelatedCaseStudies } from "./caseStudies";

function study(
  id: string,
  tags: string[],
  iso: string,
  draft = false,
  body?: string
) {
  return {
    id,
    data: {
      draft,
      tags,
      pubDatetime: new Date(iso),
    },
    body,
  };
}

function ids(studies: { id: string }[]): string[] {
  return studies.map(item => item.id);
}

describe("getRelatedCaseStudies", () => {
  it("excludes the current study", () => {
    const studies = [
      study("current", ["shared"], "2026-05-01T00:00:00.000Z"),
      study("other", ["shared"], "2026-01-01T00:00:00.000Z"),
    ];
    expect(ids(getRelatedCaseStudies(studies, "current"))).toEqual(["other"]);
  });

  it("excludes drafts", () => {
    const studies = [
      study("current", ["shared"], "2026-01-01T00:00:00.000Z"),
      study("draft", ["shared", "extra"], "2026-06-01T00:00:00.000Z", true),
      study(
        "placeholder",
        ["shared", "extra"],
        "2026-07-01T00:00:00.000Z",
        false,
        "Result\n\n[PLACEHOLDER: outcome]\n"
      ),
      study("published", ["shared"], "2026-02-01T00:00:00.000Z"),
    ];
    expect(ids(getRelatedCaseStudies(studies, "current"))).toEqual([
      "published",
    ]);
  });

  it("orders by the number of shared tags", () => {
    const studies = [
      study("current", ["a", "b", "c"], "2026-01-01T00:00:00.000Z"),
      study("none", ["z"], "2026-06-01T00:00:00.000Z"),
      study("one", ["a"], "2026-02-01T00:00:00.000Z"),
      study("two", ["a", "b"], "2026-03-01T00:00:00.000Z"),
    ];
    expect(ids(getRelatedCaseStudies(studies, "current"))).toEqual([
      "two",
      "one",
      "none",
    ]);
  });

  it("breaks shared-tag ties with the newest published date", () => {
    const studies = [
      study("current", ["a"], "2026-01-01T00:00:00.000Z"),
      study("older", ["a"], "2026-02-01T00:00:00.000Z"),
      study("newer", ["a"], "2026-03-01T00:00:00.000Z"),
    ];
    expect(ids(getRelatedCaseStudies(studies, "current"))).toEqual([
      "newer",
      "older",
    ]);
  });

  it("returns at most three studies", () => {
    const studies = [
      study("current", ["a"], "2026-01-01T00:00:00.000Z"),
      study("fourth", ["a"], "2026-02-01T00:00:00.000Z"),
      study("third", ["a"], "2026-03-01T00:00:00.000Z"),
      study("second", ["a"], "2026-04-01T00:00:00.000Z"),
      study("first", ["a"], "2026-05-01T00:00:00.000Z"),
    ];
    expect(ids(getRelatedCaseStudies(studies, "current"))).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("returns nothing when no other published study exists", () => {
    expect(getRelatedCaseStudies([], "missing")).toEqual([]);
    expect(
      getRelatedCaseStudies(
        [study("only", ["a"], "2026-01-01T00:00:00.000Z")],
        "only"
      )
    ).toEqual([]);
    expect(
      getRelatedCaseStudies(
        [
          study("current", ["a"], "2026-01-01T00:00:00.000Z"),
          study("draft", ["a"], "2026-02-01T00:00:00.000Z", true),
        ],
        "current"
      )
    ).toEqual([]);
  });
});
