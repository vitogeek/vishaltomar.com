import {
  calloutClass,
  calloutClassNames,
  metricLabelClass,
  metricRowCardClass,
  metricRowClass,
  metricValueClass,
  quoteAttributionClass,
  quoteTextClass,
} from "./calloutMarkup";

interface MarkdownData {
  hName?: string;
  hProperties?: {
    className?: string[];
  };
}

interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  data?: MarkdownData;
}

const quoteMarker = /^\[!QUOTE\]\s+/;
const metricMarker = /^\[!METRIC\]\s+/;
const attributionMarker = /^[—–]\s+/;

function splitLines(children: MarkdownNode[]): MarkdownNode[][] {
  const lines: MarkdownNode[][] = [[]];
  const push = (node: MarkdownNode) => {
    lines[lines.length - 1]?.push(node);
  };
  for (const child of children) {
    if (child.type === "break") {
      lines.push([]);
      continue;
    }
    if (child.type !== "text") {
      push(child);
      continue;
    }
    const parts = (child.value ?? "").split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part !== "") push({ ...child, value: part });
    });
  }
  return lines;
}

function blockLines(node: MarkdownNode): MarkdownNode[][] {
  const lines: MarkdownNode[][] = [];
  for (const child of node.children ?? []) {
    if (child.type !== "paragraph") continue;
    lines.push(...splitLines(child.children ?? []));
  }
  return lines.filter(line => inlineText(line).trim() !== "");
}

function inlineText(nodes: MarkdownNode[]): string {
  return nodes
    .map(node => {
      if (node.type === "text" || node.type === "inlineCode") {
        return node.value ?? "";
      }
      return inlineText(node.children ?? []);
    })
    .join("");
}

function trimInlineEdges(nodes: MarkdownNode[]): MarkdownNode[] {
  const copy = [...nodes];
  while (copy.length > 0 && copy[0]?.type === "text") {
    const value = copy[0].value?.replace(/^\s+/, "") ?? "";
    if (value === "") {
      copy.shift();
      continue;
    }
    copy[0] = { ...copy[0], value };
    break;
  }
  while (copy.length > 0) {
    const last = copy[copy.length - 1];
    if (last?.type !== "text") break;
    const value = last.value?.replace(/\s+$/, "") ?? "";
    if (value === "") {
      copy.pop();
      continue;
    }
    copy[copy.length - 1] = { ...last, value };
    break;
  }
  return copy;
}

function stripPrefix(
  nodes: MarkdownNode[],
  pattern: RegExp
): MarkdownNode[] | null {
  const [first, ...rest] = nodes;
  if (first?.type !== "text" || first.value === undefined) return null;
  const match = pattern.exec(first.value);
  if (!match) return null;
  const value = first.value.slice(match[0].length);
  const next = value === "" ? rest : [{ ...first, value }, ...rest];
  return trimInlineEdges(next);
}

function splitOnPipe(
  nodes: MarkdownNode[]
): { value: MarkdownNode[]; label: MarkdownNode[] } | null {
  const value: MarkdownNode[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!node) continue;
    if (node.type !== "text" || !node.value?.includes("|")) {
      value.push(node);
      continue;
    }
    const pipe = node.value.indexOf("|");
    const before = node.value.slice(0, pipe);
    const after = node.value.slice(pipe + 1);
    if (before !== "") value.push({ ...node, value: before });
    const label = [
      ...(after === "" ? [] : [{ ...node, value: after }]),
      ...nodes.slice(index + 1),
    ];
    return {
      value: trimInlineEdges(value),
      label: trimInlineEdges(label),
    };
  }
  return null;
}

function element(
  type: string,
  hName: string,
  className: string,
  children: MarkdownNode[]
): MarkdownNode {
  return {
    type,
    data: {
      hName,
      hProperties: { className: calloutClassNames(className) },
    },
    children,
  };
}

function paragraph(className: string, children: MarkdownNode[]): MarkdownNode {
  return element("paragraph", "p", className, children);
}

function metricCard(
  value: MarkdownNode[],
  label: MarkdownNode[],
  className: string
): MarkdownNode {
  return element("blockquote", "div", className, [
    paragraph(metricValueClass, value),
    paragraph(metricLabelClass, label),
  ]);
}

function quoteFigure(
  quote: MarkdownNode[],
  attribution: MarkdownNode[] | undefined
): MarkdownNode {
  const children: MarkdownNode[] = [
    {
      type: "blockquote",
      children: [paragraph(quoteTextClass, quote)],
    },
  ];
  if (attribution && attribution.length > 0) {
    children.push(
      element("paragraph", "figcaption", quoteAttributionClass, [
        { type: "text", value: "— " },
        ...attribution,
      ])
    );
  }
  return element("blockquote", "figure", calloutClass, children);
}

function joinLines(lines: MarkdownNode[][]): MarkdownNode[] {
  const children: MarkdownNode[] = [];
  for (const line of lines) {
    const trimmed = trimInlineEdges(line);
    if (trimmed.length === 0) continue;
    if (children.length > 0) children.push({ type: "text", value: " " });
    children.push(...trimmed);
  }
  return children;
}

function matchMetric(
  line: MarkdownNode[]
): { value: MarkdownNode[]; label: MarkdownNode[] } | null {
  const body = stripPrefix(line, metricMarker);
  if (!body) return null;
  const parts = splitOnPipe(body);
  if (!parts || parts.value.length === 0 || parts.label.length === 0) {
    return null;
  }
  return parts;
}

function matchQuote(lines: MarkdownNode[][]): {
  quote: MarkdownNode[];
  attribution?: MarkdownNode[];
} | null {
  const [first, ...rest] = lines;
  if (!first) return null;
  const opening = stripPrefix(first, quoteMarker);
  if (!opening || opening.length === 0) return null;
  const quoteLines: MarkdownNode[][] = [opening];
  let attribution: MarkdownNode[] | undefined;
  for (const line of rest) {
    const credit = stripPrefix(line, attributionMarker);
    if (credit && credit.length > 0) {
      attribution = credit;
      continue;
    }
    quoteLines.push(line);
  }
  return { quote: joinLines(quoteLines), attribution };
}

function calloutNode(node: MarkdownNode): MarkdownNode | null {
  const lines = blockLines(node);
  const first = lines[0];
  if (!first) return null;
  if (stripPrefix(first, metricMarker)) {
    const metric = matchMetric(first);
    if (!metric) return null;
    return metricCard(metric.value, metric.label, calloutClass);
  }
  const quote = matchQuote(lines);
  if (!quote) return null;
  return quoteFigure(quote.quote, quote.attribution);
}

function mapChildren(children: MarkdownNode[]): MarkdownNode[] {
  const next: MarkdownNode[] = [];
  for (let index = 0; index < children.length; index += 1) {
    const node = children[index];
    if (!node) continue;
    if (node.type === "blockquote") {
      const callout = calloutNode(node);
      if (callout?.data?.hName === "div") {
        const metrics = [callout];
        while (index + 1 < children.length) {
          const sibling = children[index + 1];
          if (sibling?.type !== "blockquote") break;
          const siblingCallout = calloutNode(sibling);
          if (siblingCallout?.data?.hName !== "div") break;
          metrics.push(siblingCallout);
          index += 1;
        }
        next.push(
          metrics.length === 1
            ? callout
            : element(
                "blockquote",
                "div",
                metricRowClass,
                metrics.map(metric => ({
                  ...metric,
                  data: {
                    hName: "div",
                    hProperties: {
                      className: calloutClassNames(metricRowCardClass),
                    },
                  },
                }))
              )
        );
        continue;
      }
      if (callout) {
        next.push(callout);
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
