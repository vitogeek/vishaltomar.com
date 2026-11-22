const NOON_UTC = 12;

function displayedInstant(date: Date): Date {
  const dateOnly =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
  if (!dateOnly) return date;
  // YAML `2026-10-26` is UTC midnight, the previous evening in Toronto.
  // Noon UTC is still that calendar day in the site timezone.
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      NOON_UTC
    )
  );
}

export function publishedDate(
  date: Date,
  locale = "en-CA",
  timeZone = "America/Toronto"
): { iso: string; label: string } {
  const instant = displayedInstant(date);
  return {
    iso: new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone,
    }).format(instant),
    label: new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone,
    }).format(instant),
  };
}
