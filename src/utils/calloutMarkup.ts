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

const calloutClass =
  "border-accent bg-muted not-prose my-8 border-s-4 px-5 py-4";
const metricValueClass =
  "text-foreground text-4xl font-semibold tracking-tight wrap-break-word sm:text-5xl";
const metricLabelClass =
  "text-foreground mt-2 text-sm leading-snug font-medium wrap-break-word";
const quoteTextClass =
  "text-foreground text-xl leading-relaxed font-medium wrap-break-word before:me-1 before:content-['“'] after:content-['”']";
const quoteAttributionClass =
  "text-foreground mt-3 text-sm leading-snug wrap-break-word";
const metricRowClass = "not-prose my-8 flex flex-col gap-4 sm:flex-row";
const metricRowCardClass =
  "border-accent bg-muted not-prose min-w-0 flex-1 border-s-4 px-5 py-4";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function metricCard(value: string, label: string, className: string): string {
  return `<div class="${className}"><p class="${metricValueClass}">${escapeHtml(value)}</p><p class="${metricLabelClass}">${escapeHtml(label)}</p></div>`;
}

export function renderMetricCallout(value: string, label: string): string {
  return metricCard(value, label, calloutClass);
}

export function renderMetricRow(metrics: readonly MetricCallout[]): string {
  const cards = metrics
    .map(metric => metricCard(metric.value, metric.label, metricRowCardClass))
    .join("");
  return `<div class="${metricRowClass}">${cards}</div>`;
}

export function renderQuoteCallout(
  quote: string,
  attribution?: string
): string {
  const caption =
    attribution === undefined
      ? ""
      : `<figcaption class="${quoteAttributionClass}">— ${escapeHtml(attribution)}</figcaption>`;
  return `<figure class="${calloutClass}"><blockquote><p class="${quoteTextClass}">${escapeHtml(quote)}</p></blockquote>${caption}</figure>`;
}

export function renderCallout(model: CalloutModel): string {
  if (model.kind === "metric") {
    return renderMetricCallout(model.value, model.label);
  }
  return renderQuoteCallout(model.quote, model.attribution);
}
