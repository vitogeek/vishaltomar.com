import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyHref, type HrefClass } from "../src/utils/externalHref.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(root, "dist");
const configPath = join(root, "astro-paper.config.ts");

interface Anchor {
  href: string | undefined;
  target: string | undefined;
  rel: string | undefined;
}

function readSiteUrl(source: string): string {
  const match = source.match(
    /site:\s*\{[\s\S]*?\burl:\s*(["'])(https?:\/\/[^"']+)\1/
  );
  const url = match?.[2];
  if (url === undefined) {
    throw new Error("Could not read site.url from astro-paper.config.ts.");
  }
  return url;
}

function decodeAttribute(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10))
    );
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  let index = 0;

  while (index < source.length) {
    while (index < source.length && /\s/.test(source[index] ?? "")) index += 1;
    if (
      index >= source.length ||
      source[index] === "/" ||
      source[index] === ">"
    ) {
      break;
    }

    const nameStart = index;
    while (index < source.length && /[^\s=/>]/.test(source[index] ?? "")) {
      index += 1;
    }
    const name = source.slice(nameStart, index).toLowerCase();

    while (index < source.length && /\s/.test(source[index] ?? "")) index += 1;
    if (source[index] !== "=") {
      attributes[name] = "";
      continue;
    }

    index += 1;
    while (index < source.length && /\s/.test(source[index] ?? "")) index += 1;

    const quote = source[index];
    if (quote === '"' || quote === "'") {
      index += 1;
      const valueStart = index;
      while (index < source.length && source[index] !== quote) index += 1;
      attributes[name] = decodeAttribute(source.slice(valueStart, index));
      if (source[index] === quote) index += 1;
      continue;
    }

    const valueStart = index;
    while (index < source.length && !/[\s>]/.test(source[index] ?? "")) {
      index += 1;
    }
    attributes[name] = decodeAttribute(source.slice(valueStart, index));
  }

  return attributes;
}

function stripEmbedded(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

function readAnchors(html: string): Anchor[] {
  const source = stripEmbedded(html);
  const lower = source.toLowerCase();
  const anchors: Anchor[] = [];
  let index = 0;

  while (index < source.length) {
    const start = lower.indexOf("<a", index);
    if (start === -1) break;

    const boundary = source[start + 2];
    if (boundary !== undefined && !/[\s>/]/.test(boundary)) {
      index = start + 2;
      continue;
    }

    let cursor = start + 2;
    let quote: string | undefined;
    let end = -1;
    while (cursor < source.length) {
      const character = source[cursor];
      if (quote) {
        if (character === quote) quote = undefined;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === ">") {
        end = cursor;
        break;
      }
      cursor += 1;
    }

    if (end === -1) break;

    const attributes = parseAttributes(source.slice(start + 2, end));
    anchors.push({
      href: attributes.href,
      target: attributes.target,
      rel: attributes.rel,
    });
    index = end + 1;
  }

  return anchors;
}

function htmlFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...htmlFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(path);
    }
  }
  return files;
}

function displayPath(path: string): string {
  return relative(root, path).split("\\").join("/");
}

function relTokens(rel: string | undefined): Set<string> {
  return new Set(
    (rel ?? "")
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 0)
  );
}

function isBlankTarget(target: string | undefined): boolean {
  return (target ?? "").trim().toLowerCase() === "_blank";
}

function writeLine(line: string): void {
  process.stdout.write(`${line}\n`);
}

function fail(message: string): void {
  process.stderr.write(`${message}\n`);
}

function checkAnchor(
  file: string,
  href: string,
  anchor: Anchor,
  site: string,
  failures: string[]
): HrefClass {
  const kind = classifyHref(href, site);
  const blank = isBlankTarget(anchor.target);

  if (kind === "external") {
    const tokens = relTokens(anchor.rel);
    const missing: string[] = [];
    if (!blank) missing.push('target="_blank"');
    if (!tokens.has("noopener")) missing.push('rel "noopener"');
    if (!tokens.has("noreferrer")) missing.push('rel "noreferrer"');
    if (missing.length > 0) {
      failures.push(
        `${file}: ${href} is an external link missing ${missing.join(" and ")}.`
      );
    }
    return kind;
  }

  if ((kind === "internal" || kind === "mailto") && blank) {
    const kindLabel = kind === "mailto" ? "a mailto" : "an internal";
    failures.push(
      `${file}: ${href} is ${kindLabel} link with target="_blank".`
    );
  }

  return kind;
}

function main(): void {
  if (!existsSync(distDir)) {
    fail("dist was not found. Build the site before checking links.");
    process.exitCode = 1;
    return;
  }

  const site = readSiteUrl(readFileSync(configPath, "utf8"));
  const failures: string[] = [];
  const found = new Map<string, Set<string>>();

  for (const path of htmlFiles(distDir).sort()) {
    const file = displayPath(path);
    const anchors = readAnchors(readFileSync(path, "utf8"));
    for (const anchor of anchors) {
      if (anchor.href === undefined) continue;
      const kind = checkAnchor(file, anchor.href, anchor, site, failures);
      if (kind !== "external") continue;
      const files = found.get(anchor.href) ?? new Set<string>();
      files.add(file);
      found.set(anchor.href, files);
    }
  }

  const hrefs = [...found.keys()].sort();
  writeLine(`External links (${hrefs.length})`);
  for (const href of hrefs) {
    writeLine(href);
    for (const file of [...(found.get(href) ?? [])].sort()) {
      writeLine(`  ${file}`);
    }
  }

  if (failures.length === 0) return;

  fail(`Link check failed (${failures.length})`);
  for (const failure of failures) fail(failure);
  process.exitCode = 1;
}

main();
