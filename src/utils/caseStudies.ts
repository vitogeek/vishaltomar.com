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

/** Featured studies, or the newest studies when none are featured. */
export function getHomeCaseStudies(
  studies: CollectionEntry<"caseStudies">[],
  limit: number
): CollectionEntry<"caseStudies">[] {
  const sorted = getSortedCaseStudies(studies);
  const featured = sorted.filter(study => study.data.featured);
  if (featured.length > 0) return featured;
  return sorted.slice(0, limit);
}

export function caseStudyPath(id: string): string {
  return pagePath(`case-studies/${id}`);
}
