import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { caseStudyPath, getPublishedCaseStudies } from "@/utils/caseStudies";
import config from "@/config";

export async function GET() {
  const studies = await getCollection("caseStudies");
  const published = getPublishedCaseStudies(studies);

  return rss({
    title: config.site.title,
    description: config.site.description,
    site: config.site.url,
    items: published.map(({ data, id }) => ({
      link: caseStudyPath(id),
      title: data.title,
      description: data.summary,
      pubDate: data.pubDatetime,
    })),
  });
}
