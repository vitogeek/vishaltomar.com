export type MetricCallout = {
  kind: "metric";
  value: string;
  label: string;
};

export type QuoteCallout = {
  kind: "quote";
  quote: string;
  attribution?: string;
};

export type CalloutModel = MetricCallout | QuoteCallout;

export const calloutClass =
  "border-accent bg-muted not-prose my-8 border-s-4 px-5 py-4";
export const metricValueClass =
  "text-foreground text-4xl font-semibold tracking-tight wrap-break-word sm:text-5xl";
export const metricLabelClass =
  "text-foreground mt-2 text-sm leading-snug font-medium wrap-break-word";
export const quoteTextClass =
  "text-foreground text-xl leading-relaxed font-medium wrap-break-word before:me-1 before:content-['“'] after:content-['”']";
export const quoteAttributionClass =
  "text-foreground mt-3 text-sm leading-snug wrap-break-word";
export const metricRowClass =
  "not-prose my-8 flex flex-col gap-4 sm:flex-row sm:has-[>:nth-child(4)]:flex-wrap sm:has-[>:nth-child(4)]:[&>*]:max-w-[calc(50%-0.5rem)] sm:has-[>:nth-child(4)]:[&>*]:flex-[1_1_calc(50%-0.5rem)]";
export const metricRowCardClass =
  "border-accent bg-muted not-prose min-w-0 flex-1 border-s-4 px-5 py-4";

export function calloutClassNames(value: string): string[] {
  return value.split(" ").filter(name => name !== "");
}
