# vishaltomar.com

Portfolio site for Vishal Tomar: [vishaltomar.com](https://vishaltomar.com).
It is built with Astro and [AstroPaper](https://github.com/satnaing/astro-paper) (MIT licence), TypeScript, Tailwind, MDX, and pnpm, and deployed on Vercel.

## Running it locally

- Node.js `>=22.12.0` (`engines` in `package.json`). No `.nvmrc`.
- pnpm `11.3.0` (`packageManager` in `package.json`).

```sh
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm check
pnpm lint
pnpm format
pnpm format:check
```

| Command             | Runs                 |
| ------------------- | -------------------- |
| `pnpm dev`          | `astro dev`          |
| `pnpm build`        | `astro build`        |
| `pnpm preview`      | `astro preview`      |
| `pnpm check`        | `astro check`        |
| `pnpm lint`         | `eslint .`           |
| `pnpm format`       | `prettier --write .` |
| `pnpm format:check` | `prettier --check .` |

`pnpm check` is the type check.

## Adding a case study

Add `src/content/case-studies/<slug>/index.mdx`. The `caseStudies` collection in `src/content.config.ts` loads `**/[^_]*.{md,mdx}` from `src/content/case-studies`. That file is served at `/case-studies/<slug>/`.

### Front matter

| Field         | Type                    | Required            |
| ------------- | ----------------------- | ------------------- |
| `title`       | string                  | yes                 |
| `summary`     | string                  | yes                 |
| `role`        | string                  | yes                 |
| `timeline`    | string                  | yes                 |
| `stack`       | string[]                | yes                 |
| `tags`        | string[]                | yes                 |
| `cover`       | local image (`image()`) | yes                 |
| `coverAlt`    | string                  | yes                 |
| `draft`       | boolean                 | no, default `false` |
| `featured`    | boolean                 | no, default `false` |
| `pubDatetime` | date                    | yes                 |

`cover` is a path relative to the MDX file, such as `./cover.png`. `pubDatetime` is a YAML date.

### Draft behaviour

A study with `draft: true` is omitted when `VERCEL_ENV` is `production` (`src/utils/caseStudies.ts`). Dev, `pnpm preview`, CI, and Vercel preview include drafts. The RSS feed excludes drafts in every build.

### Featured on the home page

`featured: true` selects the study for the home page, from the studies included in that build, newest `pubDatetime` first. If any included study is featured, the home page lists those featured studies. If none are featured, it lists the newest included studies, up to `perIndex` (`4` in `astro-paper.config.ts`).

### `Figure`, `Video`, and `Callout`

`src/pages/case-studies/[slug]/index.astro` provides `Figure`, `Video`, and `Callout` to the MDX. Import a local image when a figure needs one.

**`Figure`** (`src/components/mdx/Figure.astro`)

| Prop      | Type            | Required |
| --------- | --------------- | -------- |
| `src`     | `ImageMetadata` | yes      |
| `alt`     | string          | yes      |
| `caption` | string          | yes      |

```mdx
import shot from "./shot.png";

<Figure
  src={shot}
  alt="What the still shows"
  caption="Caption under the figure."
/>
```

**`Video`** (`src/components/mdx/Video.astro`)

| Prop      | Type   | Required |
| --------- | ------ | -------- |
| `src`     | string | yes      |
| `caption` | string | yes      |
| `width`   | number | yes      |
| `height`  | number | yes      |
| `poster`  | string | no       |
| `label`   | string | no       |

`src` is the URL of an MP4. `width` and `height` are its pixel size. `poster` is an optional image URL. With no `label`, the caption is the accessible name. The player is muted, loops, and has controls. Keep the files in `public/`; the studies in this repo use `public/case-studies/<slug>/`.

```mdx
<Video
  src="/case-studies/your-slug/clip.mp4"
  poster="/case-studies/your-slug/clip-poster.webp"
  width={1024}
  height={711}
  label="What the clip shows"
  caption="Caption under the video."
/>
```

**`Callout`** (`src/components/mdx/Callout.astro`)

- Metric: `kind="metric"`, `value` (string, required), `label` (string, required).
- Quote: `kind="quote"`, `quote` (string, required), `attribution` (string, optional).

```mdx
<Callout kind="metric" value="12" label="What the number means" />

<Callout
  kind="quote"
  quote="The sentence to pull out."
  attribution="Who said it"
/>
```

### Upload format

One zip per study, named `case-study-<kebab-slug>.zip`. Uploading that same name again updates the study.

```text
<slug>/index.md
<slug>/cover.png
<slug>/visuals/
```

In that source:

- An image followed by a `*Caption: ...*` line becomes a `Figure` or a `Video`.
- A `> [!QUOTE]` block becomes a quote `Callout`.
- GIFs become muted, looping MP4s with a poster.

## CI

`.github/workflows/ci.yml` runs on pull requests and on pushes to `main`. Both jobs use pnpm `11.3.0`, Node.js `24`, and `pnpm install --frozen-lockfile`.

**Typecheck, lint, and build** (`verify`)

- `pnpm exec astro check`
- `pnpm run lint`
- `pnpm run format:check` (Prettier)
- `pnpm run build`

**Lighthouse** (`lighthouse`)

- `pnpm run build` with `VERCEL_ENV` set to `preview`, so drafts are in the output
- `pnpm exec lhci autorun`
- Prints the median category scores for each URL

`lighthouserc.json` sets `numberOfRuns` to `3` and `aggregationMethod` to `median`. Each category must score at least `0.95`, or the job fails: performance, accessibility, best-practices, and seo.

Add a URL in `ci.collect.url` in `lighthouserc.json`. The file currently lists:

- `/`
- `/about/`
- `/case-studies/`
- `/case-studies/example/`
- `/case-studies/versioned-ai-prompts/`

## Deploys

Vercel builds a preview for every pull request. Production deploys are built from `main`.
