import { describe, expect, it } from "vitest";
import { rehypeContentFigures } from "./rehypeContentFigures";

interface Node {
  type: string;
  tagName?: string;
  value?: string;
  properties?: {
    className?: string[];
    alt?: string;
    src?: string;
  };
  children?: Node[];
}

function text(node: Node | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(text).join("");
}

function image(alt: string): Node {
  return {
    type: "element",
    tagName: "img",
    properties: { alt, src: `${alt}.png` },
    children: [],
  };
}

function caption(value: string): Node {
  return {
    type: "element",
    tagName: "em",
    children: [{ type: "text", value: `Caption: ${value}` }],
  };
}

function paragraph(children: Node[]): Node {
  return { type: "element", tagName: "p", children };
}

function run(children: Node[]): Node[] {
  const tree: Node = { type: "root", children };
  rehypeContentFigures()(tree);
  return tree.children ?? [];
}

describe("rehypeContentFigures", () => {
  it("wraps an image and caption in the same paragraph", () => {
    const [figure] = run([
      paragraph([image("Bar"), { type: "text", value: "\n" }, caption("One")]),
    ]);
    expect(figure?.tagName).toBe("figure");
    expect(figure?.properties?.className).toContain("case-figure");
    expect(figure?.children?.[0]?.tagName).toBe("img");
    expect(figure?.children?.[0]?.properties?.className).toBe(
      "h-auto w-auto max-w-full"
    );
    expect(text(figure?.children?.[1])).toBe("One");
  });

  it("wraps an image and caption in consecutive paragraphs", () => {
    const [figure] = run([
      paragraph([image("Bar")]),
      paragraph([caption("Two")]),
    ]);
    expect(figure?.tagName).toBe("figure");
    expect(text(figure?.children?.[1])).toBe("Two");
  });

  it("leaves an image without a caption alone", () => {
    const nodes = run([
      paragraph([image("Bare")]),
      paragraph([{ type: "text", value: "Not a caption." }]),
    ]);
    expect(nodes[0]?.tagName).toBe("p");
    expect(nodes[0]?.children?.[0]?.tagName).toBe("img");
    expect(nodes[1]?.tagName).toBe("p");
  });

  it("wraps two figures back to back", () => {
    const nodes = run([
      paragraph([image("First"), caption("Alpha")]),
      paragraph([image("Second"), caption("Beta")]),
    ]);
    expect(nodes.map(node => node.tagName)).toEqual(["figure", "figure"]);
    expect(nodes.map(node => text(node.children?.[1]))).toEqual([
      "Alpha",
      "Beta",
    ]);
  });
});
