const ACRONYMS: Readonly<Record<string, string>> = {
  ai: "AI",
  api: "API",
  css: "CSS",
  dns: "DNS",
  dss: "DSS",
  html: "HTML",
  http: "HTTP",
  https: "HTTPS",
  json: "JSON",
  pci: "PCI",
  qa: "QA",
  saas: "SaaS",
  seo: "SEO",
  soc: "SOC",
  sql: "SQL",
  ui: "UI",
  url: "URL",
  ux: "UX",
};

function capitaliseWord(word: string): string {
  const acronym = ACRONYMS[word.toLowerCase()];
  if (acronym) return acronym;
  const lower = word.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(part => part.length > 0)
    .map(capitaliseWord)
    .join(" ");
}
