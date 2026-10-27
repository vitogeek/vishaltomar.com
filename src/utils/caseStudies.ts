import type { CollectionEntry } from "astro:content";
import { VERCEL_ENV } from "astro:env/server";
import { pagePath } from "./withBase";

/**
 * Production deploys set VERCEL_ENV=production and omit drafts.
 * Every other build (dev, CI, local preview, Vercel preview) includes
 * them so the placeholder study can be reviewed and its MDX renders.
 */
function includeDraftCaseStudies(): boolean {
  return VERCEL_ENV !== "production";
}

export function getSortedCaseStudies(
  studies: CollectionEntry<"caseStudies">[]
): CollectionEntry<"caseStudies">[] {
  return studies
    .filter(study => !study.data.draft || includeDraftCaseStudies())
    .sort(
      (a, b) => b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime()
    );
}

export function caseStudyPath(id: string): string {
  return pagePath(`case-studies/${id}`);
}
