/** CSS view-transition-name: a custom-ident, never starting with a digit. */
export function toTransitionName(value: string): string {
  let result = value
    .toLowerCase()
    .replace(/[^\x00-\x7F]/gu, char => {
      const code = char.codePointAt(0);
      return code === undefined ? "" : `u${code.toString(16).padStart(6, "0")}`;
    })
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (/^\d/.test(result)) result = `p-${result}`;
  return result || "item";
}
