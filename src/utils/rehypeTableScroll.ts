interface HastProperties {
  className?: string | string[];
  tabIndex?: number;
  role?: string;
  ariaLabel?: string;
}

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: HastProperties;
  children?: HastNode[];
}

function isElement(
  node: HastNode,
  tagName: string
): node is HastNode & { tagName: string } {
  return node.type === "element" && node.tagName === tagName;
}

function textOf(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

function tableLabel(table: HastNode): string {
  const caption = (table.children ?? []).find(child =>
    isElement(child, "caption")
  );
  const text = caption ? textOf(caption).trim() : "";
  return text === "" ? "Scrollable table" : text;
}

function wrapTable(table: HastNode): HastNode {
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["case-table-scroll"],
      tabIndex: 0,
      role: "region",
      ariaLabel: tableLabel(table),
    },
    children: [table],
  };
}

function transform(node: HastNode): void {
  if (!node.children) return;
  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];
    if (!child) continue;
    if (isElement(child, "table")) {
      node.children[index] = wrapTable(child);
      continue;
    }
    if (child.children) transform(child);
  }
}

export function rehypeTableScroll() {
  return (tree: HastNode) => {
    transform(tree);
  };
}
