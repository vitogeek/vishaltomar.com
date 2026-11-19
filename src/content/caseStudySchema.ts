import { z } from "astro/zod";

export function caseStudySchema<TCover extends z.ZodType>(image: () => TCover) {
  return z.object({
    title: z.string(),
    summary: z.string(),
    role: z.string(),
    timeline: z.string(),
    stack: z.array(z.string()),
    tags: z.array(z.string()),
    cover: image(),
    coverAlt: z.string(),
    type: z.enum(["case-study", "impact-report"]).default("case-study"),
    draft: z.boolean().default(false),
    pubDatetime: z.date(),
  });
}
