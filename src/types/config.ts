interface SiteConfig {
  /** Deployed URL of the site, e.g. "https://example.com" */
  url: string;
  /** Site title shown in the header and meta tags */
  title: string;
  /** Short description used in SEO meta and the RSS feed */
  description: string;
  /** Author name */
  author: string;
  /** Author profile URL (used in structured data) */
  profile?: string;
  /** Fallback OG image filename in /public, e.g. "og.jpg" */
  ogImage?: string;
  /** HTML lang attribute, defaults to "en-CA" */
  lang?: string;
  /** IANA timezone for dates, e.g. "America/Toronto" */
  timezone?: string;
  /** Text direction */
  dir?: "ltr" | "rtl" | "auto";
  /** Google Search Console verification meta tag value */
  googleVerification?: string;
}

interface CaseStudiesConfig {
  /** Newest case studies shown on the home page when none are featured. */
  perIndex?: number;
}

interface FeaturesConfig {
  /** Enable light/dark mode toggle. Defaults to true. */
  lightAndDarkMode?: boolean;
  /**
   * Generate a dynamic OG image per case study and provide `/og.png` when the
   * static `public/{site.ogImage}` file is absent. When false, that file is
   * required for the default layout OG image (build fails if missing).
   */
  dynamicOgImage?: boolean;
}

interface SocialLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "github" → src/assets/icons/socials/github.svg
   */
  name: string;
  url: string;
  /**
   * Accessible label for the icon link (aria-label, title attribute).
   * Auto-generated if omitted: "{site.title} on GitHub", "Send an email to {site.title}", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

interface AstroPaperConfig {
  site: SiteConfig;
  caseStudies?: CaseStudiesConfig;
  features?: FeaturesConfig;
  /** Social profile links. The footer and contact page share these URLs. */
  socials?: SocialLink[];
}

type ResolvedSiteConfig = Required<
  Pick<
    SiteConfig,
    | "url"
    | "title"
    | "description"
    | "author"
    | "lang"
    | "timezone"
    | "dir"
    | "ogImage"
  >
> &
  Pick<SiteConfig, "profile" | "googleVerification">;

export interface ResolvedAstroPaperConfig {
  site: ResolvedSiteConfig;
  caseStudies: Required<CaseStudiesConfig>;
  features: Required<FeaturesConfig>;
  socials: SocialLink[];
}

/**
 * Type helper for astro-paper.config.ts.
 * Provides full IntelliSense without any runtime overhead.
 */
export function defineAstroPaperConfig(
  config: AstroPaperConfig
): AstroPaperConfig {
  return config;
}
