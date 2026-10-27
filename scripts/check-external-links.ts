import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";
import config from "../astro-paper.config.ts";
import { isExternal } from "../src/utils/externalHref.ts";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const site = config.site.url;
const failures: string[] = [];
const found = new Map<string, Set<string>>();
const write = (line: string) => process.stdout.write(`${line}\n`);
const fail = (line: string) => process.stderr.write(`${line}\n`);

function staysInTab(href: string): boolean {
  const scheme = href
    .trim()
    .match(/^[a-z][\w+.-]*:/i)?.[0]
    ?.toLowerCase();
  const plain = !scheme || ["mailto:", "http:", "https:"].includes(scheme);
  return !isExternal(href, site) && plain;
}

if (!existsSync(dist)) {
  fail("dist was not found. Build the site before checking links.");
  process.exit(1);
}

for (const file of globSync("**/*.html", { cwd: dist }).sort()) {
  const page = `dist/${file}`;
  const html = readFileSync(join(dist, file), "utf8");
  for (const anchor of parse(html).querySelectorAll("a")) {
    const href = anchor.getAttribute("href");
    if (!href) continue;
    const blank =
      anchor.getAttribute("target")?.trim().toLowerCase() === "_blank";
    const rel = (anchor.getAttribute("rel") ?? "").toLowerCase().split(/\s+/);
    if (isExternal(href, site)) {
      const missing = [
        !blank && 'target="_blank"',
        !rel.includes("noopener") && 'rel "noopener"',
        !rel.includes("noreferrer") && 'rel "noreferrer"',
      ].filter(item => typeof item === "string");
      if (missing.length > 0) {
        failures.push(
          `${page}: ${href} is an external link missing ${missing.join(" and ")}.`
        );
      }
      found.set(href, (found.get(href) ?? new Set()).add(page));
    } else if (blank && staysInTab(href)) {
      const kind = /^mailto:/i.test(href) ? "a mailto" : "an internal";
      failures.push(`${page}: ${href} is ${kind} link with target="_blank".`);
    }
  }
}

write(`External links (${found.size})`);
for (const href of [...found.keys()].sort()) {
  write(href);
  for (const page of [...(found.get(href) ?? [])].sort()) write(`  ${page}`);
}
if (failures.length > 0) {
  fail(`Link check failed (${failures.length})`);
  for (const failure of failures) fail(failure);
  process.exitCode = 1;
}
