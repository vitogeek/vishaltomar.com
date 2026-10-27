export const OPENS_IN_NEW_TAB = "(opens in a new tab)";

export type HrefClass = "external" | "internal" | "mailto" | "other";

function parseSite(site: string): URL | undefined {
  try {
    const url = new URL(site);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url;
  } catch {
    return undefined;
  }
}

export function isExternalHttpUrl(href: string, site: string): boolean {
  return classifyHref(href, site) === "external";
}

export function classifyHref(href: string, site: string): HrefClass {
  const trimmed = href.trim();
  if (/^mailto:/i.test(trimmed)) return "mailto";

  const siteUrl = parseSite(site);
  if (!siteUrl) return "other";

  let url: URL;
  try {
    url = new URL(trimmed, siteUrl);
  } catch {
    return "other";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return "other";
  return url.origin === siteUrl.origin ? "internal" : "external";
}

function collectRelTokens(existing: unknown, tokens: Set<string>): void {
  if (typeof existing === "string") {
    for (const token of existing.split(/\s+/)) {
      if (token.length > 0) tokens.add(token);
    }
    return;
  }

  if (!Array.isArray(existing)) return;

  for (const item of existing) collectRelTokens(item, tokens);
}

export function externalRelValue(existing: unknown): string {
  const tokens = new Set<string>();
  collectRelTokens(existing, tokens);
  tokens.add("noopener");
  tokens.add("noreferrer");
  return [...tokens].join(" ");
}
