export const PLACEHOLDER_MARKER = "[PLACEHOLDER:";

export function isCaseStudyDraft(entry: {
  data: { draft: boolean };
  body?: string;
}): boolean {
  if (entry.data.draft) return true;
  return entry.body?.includes(PLACEHOLDER_MARKER) ?? false;
}
