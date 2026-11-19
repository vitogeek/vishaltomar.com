import {
  renderMetricCallout,
  renderMetricRow,
  renderQuoteCallout,
  type MetricCallout,
  type QuoteCallout,
} from "./calloutMarkup";

interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
}

type ParsedCallout = MetricCallout | QuoteCallout;

const quoteMarker = /^\[!QUOTE\]\s+(\S[\s\S]*)$/;
const metricMarker = /^\[!METRIC\]\s+([\s\S]+)$/;
const attributionMarker = /^[—–]\s+(\S[\s\S]*)$/;

function inlineText(node: MarkdownNode): string {
  if (node.type === "text") return node.value ?? "";
  if (node.type === "break") return "\n";
  return (node.children ?? []).map(inlineText).join("");
}

function blockquoteLines(node: MarkdownNode): string[] {
  const lines: string[] = [];
  for (const child of node.children ?? []) {
    if (child.type !== "paragraph") continue;
    lines.push(...inlineText(child).split("\n"));
  }
  return lines;
}

function parseMetric(line: string): MetricCallout | null {
  const match = metricMarker.exec(line.trim());
  if (!match) return null;
  const pipe = match[1].indexOf("|");
  if (pipe === -1) return null;
  const value = match[1].slice(0, pipe).trim();
  const label = match[1].slice(pipe + 1).trim();
  if (value === "" || label === "") return null;
  return { kind: "metric", value, label };
}

function parseQuote(lines: string[]): QuoteCallout | null {
  const first = lines[0]?.trim() ?? "";
  const match = quoteMarker.exec(first);
  if (!match) return null;
  const quoteParts = [match[1].trim()];
  let attribution: string | undefined;
  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    const attributionMatch = attributionMarker.exec(trimmed);
    if (attributionMatch) {
      attribution = attributionMatch[1].trim();
      continue;
    }
    quoteParts.push(trimmed);
  }
  return { kind: "quote", quote: quoteParts.join(" "), attribution };
}

function parseBlockquote(node: MarkdownNode): ParsedCallout | null {
  const lines = blockquoteLines(node);
  if (lines.length === 0) return null;
  return parseMetric(lines[0] ?? "") ?? parseQuote(lines);
}

function htmlNode(value: string): MarkdownNode {
  return { type: "html", value };
}

function mapChildren(children: MarkdownNode[]): MarkdownNode[] {
  const next: MarkdownNode[] = [];
  for (let index = 0; index < children.length; index += 1) {
    const node = children[index];
    if (!node) continue;
    if (node.type === "blockquote") {
      const parsed = parseBlockquote(node);
      if (parsed?.kind === "metric") {
        const metrics: MetricCallout[] = [parsed];
        while (index + 1 < children.length) {
          const sibling = children[index + 1];
          if (!sibling || sibling.type !== "blockquote") break;
          const siblingCallout = parseBlockquote(sibling);
          if (siblingCallout?.kind !== "metric") break;
          metrics.push(siblingCallout);
          index += 1;
        }
        next.push(
          htmlNode(
            metrics.length > 1
              ? renderMetricRow(metrics)
              : renderMetricCallout(metrics[0].value, metrics[0].label)
          )
        );
        continue;
      }
      if (parsed?.kind === "quote") {
        next.push(
          htmlNode(renderQuoteCallout(parsed.quote, parsed.attribution))
        );
        continue;
      }
    }
    if (node.children) {
      next.push({ ...node, children: mapChildren(node.children) });
      continue;
    }
    next.push(node);
  }
  return next;
}

export function transformCalloutRoot(tree: MarkdownNode): void {
  tree.children = mapChildren(tree.children ?? []);
}

export function remarkCallouts() {
  return (tree: MarkdownNode) => {
    transformCalloutRoot(tree);
  };
}
