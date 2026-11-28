import type { CollectionEntry } from "astro:content";
import { VERCEL_ENV } from "astro:env/server";
import { isCaseStudyDraft } from "./caseStudyDraft";
import { pagePath } from "./withBase";

/**
 * Production deploys set VERCEL_ENV=production and omit drafts.
 * Every other build (dev, CI, local preview, Vercel preview) includes them.
 */
function includeDraftCaseStudies(): boolean {
  return VERCEL_ENV !== "production";
}

function byNewest<T extends { data: { pubDatetime: Date } }>(
  studies: readonly T[]
): T[] {
  return [...studies].sort(
    (a, b) => b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime()
  );
}

type FeaturedCaseStudy = {
  data: {
    draft: boolean;
    featured: boolean;
    pubDatetime: Date;
  };
  body?: string;
};

export function getFeaturedCaseStudies<T extends FeaturedCaseStudy>(
  studies: readonly T[]
): T[] {
  return byNewest(
    studies.filter(study => study.data.featured && !isCaseStudyDraft(study))
  );
}

export function getPublishedCaseStudies(
  studies: CollectionEntry<"caseStudies">[]
): CollectionEntry<"caseStudies">[] {
  return byNewest(studies.filter(study => !isCaseStudyDraft(study)));
}

export function getSortedCaseStudies(
  studies: CollectionEntry<"caseStudies">[]
): CollectionEntry<"caseStudies">[] {
  return byNewest(
    studies.filter(
      study => !isCaseStudyDraft(study) || includeDraftCaseStudies()
    )
  );
}

export function caseStudyPath(id: string): string {
  return pagePath(`case-studies/${id}`);
}

type RankableCaseStudy = {
  id: string;
  data: {
    draft: boolean;
    tags: readonly string[];
    pubDatetime: Date;
  };
  body?: string;
};

function sharedTagCount(
  tags: readonly string[],
  currentTags: ReadonlySet<string>
): number {
  const shared = new Set<string>();
  for (const tag of tags) {
    if (currentTags.has(tag)) shared.add(tag);
  }
  return shared.size;
}

export function getRelatedCaseStudies<T extends RankableCaseStudy>(
  studies: readonly T[],
  currentId: string,
  limit = 3
): T[] {
  const currentTags = new Set(
    studies.find(study => study.id === currentId)?.data.tags ?? []
  );

  return studies
    .filter(study => study.id !== currentId && !isCaseStudyDraft(study))
    .map(study => ({
      study,
      sharedTags: sharedTagCount(study.data.tags, currentTags),
    }))
    .sort((a, b) => {
      if (a.sharedTags !== b.sharedTags) return b.sharedTags - a.sharedTags;
      return (
        b.study.data.pubDatetime.getTime() - a.study.data.pubDatetime.getTime()
      );
    })
    .slice(0, limit)
    .map(item => item.study);
}
