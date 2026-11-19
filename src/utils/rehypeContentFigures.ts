interface HastProperties {
  className?: string | string[];
  alt?: string;
  src?: string;
  densities?: number[];
}

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: HastProperties;
  children?: HastNode[];
}

const captionMarker = /^Caption:\s*(\S[\s\S]*)$/;

function isElement(
  node: HastNode,
  tagName: string
): node is HastNode & { tagName: string } {
  return node.type === "element" && node.tagName === tagName;
}

function isWhitespace(node: HastNode): boolean {
  return node.type === "text" && (node.value ?? "").trim() === "";
}

function textOf(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

function meaningfulChildren(node: HastNode): HastNode[] {
  return (node.children ?? []).filter(child => !isWhitespace(child));
}

function captionFrom(node: HastNode): string | null {
  if (!isElement(node, "em")) return null;
  const match = captionMarker.exec(textOf(node).trim());
  if (!match) return null;
  const caption = match[1].trim();
  return caption === "" ? null : caption;
}

function withImageClasses(image: HastNode): HastNode {
  const current = image.properties?.className;
  const names = [
    ...(Array.isArray(current)
      ? current
      : typeof current === "string"
        ? current.split(/\s+/)
        : []),
    "h-auto",
    "w-auto",
    "max-w-full",
  ];
  return {
    ...image,
    properties: {
      ...image.properties,
      // A string, not an array: MDX copies img properties with String(), which
      // would join an array with commas and produce one invalid class.
      className: names.join(" "),
      // One candidate at the file's own width, so the markup does not emit an empty srcset.
      densities: image.properties?.densities ?? [1],
    },
  };
}

function figureFor(image: HastNode, caption: string): HastNode {
  return {
    type: "element",
    tagName: "figure",
    properties: { className: ["case-figure", "not-prose"] },
    children: [
      withImageClasses(image),
      {
        type: "element",
        tagName: "figcaption",
        properties: {
          className: ["text-foreground", "mt-2", "text-sm", "leading-snug"],
        },
        children: [{ type: "text", value: caption }],
      },
    ],
  };
}

function figuresFromParagraph(node: HastNode): HastNode[] | null {
  if (!isElement(node, "p")) return null;
  const parts = meaningfulChildren(node);
  if (parts.length === 0 || parts.length % 2 !== 0) return null;
  const figures: HastNode[] = [];
  for (let index = 0; index < parts.length; index += 2) {
    const image = parts[index];
    const captionNode = parts[index + 1];
    if (!image || !captionNode || !isElement(image, "img")) return null;
    const caption = captionFrom(captionNode);
    if (caption === null) return null;
    figures.push(figureFor(image, caption));
  }
  return figures;
}

function imageParagraph(node: HastNode): HastNode | null {
  if (!isElement(node, "p")) return null;
  const parts = meaningfulChildren(node);
  const image = parts[0];
  if (parts.length !== 1 || !image || !isElement(image, "img")) return null;
  return image;
}

function captionParagraph(node: HastNode | undefined): string | null {
  if (!node || !isElement(node, "p")) return null;
  const parts = meaningfulChildren(node);
  const captionNode = parts[0];
  if (parts.length !== 1 || !captionNode) return null;
  return captionFrom(captionNode);
}

function transform(node: HastNode): void {
  if (!node.children) return;
  const next: HastNode[] = [];
  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];
    if (!child) continue;
    const figures = figuresFromParagraph(child);
    if (figures) {
      next.push(...figures);
      continue;
    }
    const image = imageParagraph(child);
    const caption = captionParagraph(node.children[index + 1]);
    if (image && caption) {
      next.push(figureFor(image, caption));
      index += 1;
      continue;
    }
    if (child.children) transform(child);
    next.push(child);
  }
  node.children = next;
}

export function rehypeContentFigures() {
  return (tree: HastNode) => {
    transform(tree);
  };
}
