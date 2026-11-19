import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { rehypeContentFigures } from "./rehypeContentFigures";
import { rehypeTableScroll } from "./rehypeTableScroll";
import { remarkCallouts, transformCalloutRoot } from "./remarkCallouts";

interface Node {
  type: string;
  value?: string;
  url?: string;
  children?: Node[];
  data?: {
    hName?: string;
    hProperties?: { className?: string[] };
  };
}

function text(node: Node | undefined): string {
  if (!node) return "";
  if (node.type === "text" || node.type === "inlineCode")
    return node.value ?? "";
  return (node.children ?? []).map(text).join("");
}

function classes(node: Node | undefined): string {
  return node?.data?.hProperties?.className?.join(" ") ?? "";
}

function blockquote(children: Node[]): Node {
  return { type: "blockquote", children };
}

function paragraph(children: Node[]): Node {
  return { type: "paragraph", children };
}

function transform(children: Node[]): Node[] {
  const tree: Node = { type: "root", children };
  transformCalloutRoot(tree);
  return tree.children ?? [];
}

describe("quote callouts", () => {
  it("parses a quote marker into the quote callout", () => {
    const [node] = transform([
      blockquote([
        paragraph([{ type: "text", value: "[!QUOTE] Hello there." }]),
      ]),
    ]);
    expect(node?.data?.hName).toBe("figure");
    expect(classes(node)).toContain("border-s-4");
    expect(text(node)).toBe("Hello there.");
    expect(text(node)).not.toContain("[!QUOTE]");
  });

  it("keeps inline markdown inside the quote", () => {
    const [node] = transform([
      blockquote([
        paragraph([
          { type: "text", value: "[!QUOTE] See " },
          { type: "strong", children: [{ type: "text", value: "bold" }] },
          { type: "text", value: " and " },
          { type: "inlineCode", value: "code" },
        ]),
      ]),
    ]);
    const quote = node?.children?.[0]?.children?.[0];
    expect(quote?.children?.map(child => child.type)).toEqual([
      "text",
      "strong",
      "text",
      "inlineCode",
    ]);
    expect(text(quote)).toBe("See bold and code");
  });

  it("parses an em dash line as attribution and keeps wrapped quote text", () => {
    const [node] = transform([
      blockquote([
        paragraph([
          {
            type: "text",
            value: "[!QUOTE] Line one\nkeeps going\n— Ada Lovelace",
          },
        ]),
      ]),
    ]);
    expect(text(node?.children?.[0])).toBe("Line one keeps going");
    expect(node?.children?.[1]?.data?.hName).toBe("figcaption");
    expect(text(node?.children?.[1])).toBe("— Ada Lovelace");
  });

  it("keeps characters that the HTML renderer must escape", () => {
    const [node] = transform([
      blockquote([paragraph([{ type: "text", value: "[!QUOTE] 1 < 2 & 3" }])]),
    ]);
    expect(text(node)).toBe("1 < 2 & 3");
    expect(node?.type).not.toBe("html");
  });
});

describe("metric callouts", () => {
  it("parses a value and a label on the first pipe", () => {
    const [node] = transform([
      blockquote([
        paragraph([{ type: "text", value: "[!METRIC] 48% | share | extra" }]),
      ]),
    ]);
    expect(node?.data?.hName).toBe("div");
    expect(classes(node)).toContain("border-s-4");
    expect(classes(node)).not.toContain("sm:flex-row");
    expect(text(node?.children?.[0])).toBe("48%");
    expect(text(node?.children?.[1])).toBe("share | extra");
  });

  it("keeps inline markdown in a metric value and label", () => {
    const [node] = transform([
      blockquote([
        paragraph([
          { type: "text", value: "[!METRIC] " },
          { type: "strong", children: [{ type: "text", value: "12" }] },
          { type: "text", value: " | labelled " },
          { type: "inlineCode", value: "test" },
        ]),
      ]),
    ]);
    expect(node?.children?.[0]?.children?.[0]?.type).toBe("strong");
    expect(node?.children?.[1]?.children?.[1]?.type).toBe("inlineCode");
  });

  it("groups consecutive metrics and leaves separated metrics alone", () => {
    const nodes = transform([
      blockquote([paragraph([{ type: "text", value: "[!METRIC] 1 | one" }])]),
      blockquote([paragraph([{ type: "text", value: "[!METRIC] 2 | two" }])]),
      blockquote([paragraph([{ type: "text", value: "[!METRIC] 3 | three" }])]),
      paragraph([{ type: "text", value: "Between the groups." }]),
      blockquote([paragraph([{ type: "text", value: "[!METRIC] 4 | four" }])]),
      blockquote([paragraph([{ type: "text", value: "[!METRIC] 5 | five" }])]),
    ]);

    expect(nodes).toHaveLength(3);
    expect(nodes[1]?.type).toBe("paragraph");
    expect(classes(nodes[0])).toContain("sm:flex-row");
    expect(nodes[0]?.children).toHaveLength(3);
    expect(nodes[0]?.children?.map(text)).toEqual(["1one", "2two", "3three"]);
    expect(classes(nodes[2])).toContain("sm:flex-row");
    expect(nodes[2]?.children).toHaveLength(2);
  });

  it("does not group metrics that are split by another block", () => {
    const nodes = transform([
      blockquote([paragraph([{ type: "text", value: "[!METRIC] 1 | one" }])]),
      blockquote([
        paragraph([
          { type: "text", value: "[!QUOTE] A quote between metrics." },
        ]),
      ]),
      blockquote([paragraph([{ type: "text", value: "[!METRIC] 2 | two" }])]),
    ]);

    expect(nodes).toHaveLength(3);
    expect(classes(nodes[0])).not.toContain("sm:flex-row");
    expect(nodes[1]?.data?.hName).toBe("figure");
    expect(text(nodes[1])).toBe("A quote between metrics.");
    expect(classes(nodes[2])).not.toContain("sm:flex-row");
  });
});

describe("malformed markers", () => {
  it("leaves a metric without a pipe as a blockquote", () => {
    const [node] = transform([
      blockquote([
        paragraph([{ type: "text", value: "[!METRIC] 12 projects" }]),
      ]),
    ]);
    expect(node?.type).toBe("blockquote");
    expect(node?.data?.hName).toBeUndefined();
  });

  it("leaves an empty value or label as a blockquote", () => {
    const nodes = transform([
      blockquote([paragraph([{ type: "text", value: "[!METRIC] | label" }])]),
      blockquote([paragraph([{ type: "text", value: "[!METRIC] value |" }])]),
      blockquote([paragraph([{ type: "text", value: "[!QUOTE]" }])]),
      blockquote([
        paragraph([{ type: "text", value: "An ordinary blockquote." }]),
      ]),
    ]);
    expect(
      nodes.every(node => node.type === "blockquote" && !node.data?.hName)
    ).toBe(true);
  });
});

describe("MDX pipeline", () => {
  it("compiles callouts, a table wrapper, and a figure through MDX", async () => {
    const file = await compile(
      [
        "> [!QUOTE] See **bold** and `code`",
        "",
        "> [!METRIC] 1 | one",
        "",
        "> [!METRIC] 2 | two",
        "",
        "| A | B |",
        "| - | - |",
        "| 1 | 2 |",
        "",
        "![Chart](chart.png)",
        "*Caption: Example chart.*",
      ].join("\n"),
      {
        remarkPlugins: [remarkGfm, remarkCallouts],
        rehypePlugins: [rehypeContentFigures, rehypeTableScroll],
      }
    );
    const code = String(file);
    expect(code).toContain("border-s-4");
    expect(code).toContain("sm:flex-row");
    expect(code).toContain("case-table-scroll");
    expect(code).toContain("case-figure");
    expect(code).toContain("bold");
    expect(code).toContain("Example chart.");
    expect(code).not.toContain("[!QUOTE]");
    expect(code).not.toContain("[!METRIC]");
  });
});
