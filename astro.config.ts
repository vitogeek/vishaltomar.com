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
import rehypeExternalLinks from "rehype-external-links";
import { OPENS_IN_NEW_TAB } from "./src/utils/externalHref";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

export default defineConfig({
  site: config.site.url,
  trailingSlash: "always",
  redirects: {
    "/about/": {
      status: 301,
      destination: "/",
    },
    "/contact/": {
      status: 301,
      destination: "/",
    },
  },
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [
        rehypeCallouts,
        [
          rehypeExternalLinks,
          {
            target: "_blank",
            rel: ["noopener", "noreferrer"],
            content: { type: "text", value: OPENS_IN_NEW_TAB },
            contentProperties: { className: ["sr-only"] },
          },
        ],
      ],
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
      weights: ["300 700"],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      formats: ["woff2"],
    },
    {
      name: "Google Sans Code",
      cssVariable: "--font-og",
      provider: fontProviders.google(),
      weights: [400, 700],
      styles: ["normal"],
      formats: ["ttf"],
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
