import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

function draftCaseStudySlugs(): string[] {
  const dir = join(process.cwd(), "src/content/case-studies");
  return readdirSync(dir).flatMap(name => {
    if (!name.endsWith(".md") && !name.endsWith(".mdx")) return [];
    const source = readFileSync(join(dir, name), "utf8");
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
    if (!frontmatter || !/^draft:\s*true\s*$/m.test(frontmatter[1])) return [];
    return [name.replace(/\.(md|mdx)$/, "")];
  });
}

const draftSlugs = draftCaseStudySlugs();

export default defineConfig({
  site: config.site.url,
  trailingSlash: "always",
  integrations: [
    mdx(),
    sitemap({
      filter(page) {
        const { pathname } = new URL(page);
        return !draftSlugs.some(
          slug =>
            pathname === `/case-studies/${slug}` ||
            pathname.startsWith(`/case-studies/${slug}/`)
        );
      },
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      VERCEL_ENV: envField.string({
        access: "public",
        context: "server",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
