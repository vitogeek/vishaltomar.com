import type { CollectionEntry } from "astro:content";
import { VERCEL_ENV } from "astro:env/server";
import { pagePath } from "./withBase";

/**
 * Production deploys set VERCEL_ENV=production and omit drafts.
 * Every other build (dev, CI, local preview, Vercel preview) includes them.
 */
function includeDraftCaseStudies(): boolean {
  return VERCEL_ENV !== "production";
}

function byNewest(
  studies: CollectionEntry<"caseStudies">[]
): CollectionEntry<"caseStudies">[] {
  return [...studies].sort(
    (a, b) => b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime()
  );
}

export function getPublishedCaseStudies(
  studies: CollectionEntry<"caseStudies">[]
): CollectionEntry<"caseStudies">[] {
  return byNewest(studies.filter(study => !study.data.draft));
}

export function getSortedCaseStudies(
  studies: CollectionEntry<"caseStudies">[]
): CollectionEntry<"caseStudies">[] {
  return byNewest(
    studies.filter(study => !study.data.draft || includeDraftCaseStudies())
  );
}

export function caseStudyPath(id: string): string {
  return pagePath(`case-studies/${id}`);
}
