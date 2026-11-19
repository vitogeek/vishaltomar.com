import { describe, expect, it } from "vitest";
import { isCaseStudyDraft } from "./caseStudyDraft";

describe("placeholder draft guard", () => {
  it("treats a placeholder as a draft when front matter says otherwise", () => {
    expect(
      isCaseStudyDraft({
        data: { draft: false },
        body: "Result\n\n[PLACEHOLDER: fill in the outcome]\n",
      })
    ).toBe(true);
  });

  it("keeps a draft flagged in front matter", () => {
    expect(
      isCaseStudyDraft({
        data: { draft: true },
        body: "No marker in the body.",
      })
    ).toBe(true);
  });

  it("publishes an entry with neither a draft flag nor a placeholder", () => {
    expect(
      isCaseStudyDraft({
        data: { draft: false },
        body: "A finished study.",
      })
    ).toBe(false);
    expect(isCaseStudyDraft({ data: { draft: false } })).toBe(false);
  });
});
