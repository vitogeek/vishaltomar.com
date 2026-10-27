export const OPENS_IN_NEW_TAB = " (opens in a new tab)";

export function isExternal(href: string, site: string): boolean {
  try {
    const url = new URL(href, site);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== new URL(site).origin
    );
  } catch {
    return false;
  }
}
