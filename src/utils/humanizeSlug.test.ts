import { describe, expect, it } from "vitest";
import { humanizeSlug } from "./humanizeSlug";

describe("humanizeSlug", () => {
  it("splits on hyphens and capitalises each word", () => {
    expect(humanizeSlug("founder-bots")).toBe("Founder Bots");
    expect(humanizeSlug("founder-bots-update-1")).toBe("Founder Bots Update 1");
    expect(humanizeSlug("format-test")).toBe("Format Test");
  });

  it("keeps known acronyms in their usual form", () => {
    expect(humanizeSlug("versioned-ai-prompts")).toBe("Versioned AI Prompts");
    expect(humanizeSlug("regulated-saas-tools")).toBe("Regulated SaaS Tools");
    expect(humanizeSlug("ai-saas")).toBe("AI SaaS");
    expect(humanizeSlug("pci-dss")).toBe("PCI DSS");
    expect(humanizeSlug("public-api")).toBe("Public API");
  });

  it("ignores empty pieces from extra hyphens", () => {
    expect(humanizeSlug("founder--bots-")).toBe("Founder Bots");
    expect(humanizeSlug("")).toBe("");
    expect(humanizeSlug("-")).toBe("");
  });

  it("normalises mixed-case slugs", () => {
    expect(humanizeSlug("Versioned-AI-Prompts")).toBe("Versioned AI Prompts");
  });
});
