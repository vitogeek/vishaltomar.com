import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";
import { transformCalloutRoot } from "./remarkCallouts";

interface Node {
  type: string;
  value?: string;
  children?: Node[];
}

function blockquote(text: string): Node {
  return {
    type: "blockquote",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: text }],
      },
    ],
  };
}

function paragraph(text: string): Node {
  return {
    type: "paragraph",
    children: [{ type: "text", value: text }],
  };
}

function transform(children: Node[]): Node[] {
  const tree: Node = { type: "root", children };
  transformCalloutRoot(tree);
  return tree.children ?? [];
}

function htmlOf(node: Node | undefined): string {
  expect(node?.type).toBe("html");
  return node?.value ?? "";
}

describe("quote callouts", () => {
  it("parses a quote marker into the quote callout", () => {
    const [node] = transform([blockquote("[!QUOTE] Hello there.")]);
    const html = htmlOf(node);
    expect(html).toContain("Hello there.");
    expect(html).toContain("border-s-4");
    expect(html).toContain("before:content-['“']");
    expect(html).not.toContain("[!QUOTE]");
  });

  it("parses an em dash line as attribution and keeps wrapped quote text", () => {
    const [node] = transform([
      blockquote("[!QUOTE] Line one\nkeeps going\n— Ada Lovelace"),
    ]);
    const html = htmlOf(node);
    expect(html).toContain("Line one keeps going");
    expect(html).toContain("— Ada Lovelace");
  });

  it("escapes quote text", () => {
    const [node] = transform([blockquote("[!QUOTE] 1 < 2 & 3")]);
    const html = htmlOf(node);
    expect(html).toContain("1 &lt; 2 &amp; 3");
    expect(html).not.toContain("1 < 2");
  });
});

describe("metric callouts", () => {
  it("parses a value and a label on the first pipe", () => {
    const [node] = transform([blockquote("[!METRIC] 48% | share | extra")]);
    const html = htmlOf(node);
    const root = parse(html);
    expect(root.querySelector("div")?.getAttribute("class")).not.toContain(
      "sm:flex-row"
    );
    expect(root.querySelectorAll("p").map(item => item.text)).toEqual([
      "48%",
      "share | extra",
    ]);
    expect(html).toContain("text-4xl");
    expect(html).toContain("border-s-4");
  });

  it("groups consecutive metrics and leaves separated metrics alone", () => {
    const nodes = transform([
      blockquote("[!METRIC] 1 | one"),
      blockquote("[!METRIC] 2 | two"),
      blockquote("[!METRIC] 3 | three"),
      paragraph("Between the groups."),
      blockquote("[!METRIC] 4 | four"),
      blockquote("[!METRIC] 5 | five"),
    ]);

    expect(nodes).toHaveLength(3);
    expect(nodes[1]?.type).toBe("paragraph");

    const grouped = parse(htmlOf(nodes[0]));
    expect(grouped.querySelector("div")?.getAttribute("class")).toContain(
      "sm:flex-row"
    );
    expect(grouped.querySelectorAll("p").map(item => item.text)).toEqual([
      "1",
      "one",
      "2",
      "two",
      "3",
      "three",
    ]);

    const separated = parse(htmlOf(nodes[2]));
    expect(separated.querySelector("div")?.getAttribute("class")).toContain(
      "sm:flex-row"
    );
    expect(separated.querySelectorAll("p").map(item => item.text)).toEqual([
      "4",
      "four",
      "5",
      "five",
    ]);
  });

  it("does not group metrics that are split by another block", () => {
    const nodes = transform([
      blockquote("[!METRIC] 1 | one"),
      blockquote("[!QUOTE] A quote between metrics."),
      blockquote("[!METRIC] 2 | two"),
    ]);

    expect(nodes).toHaveLength(3);
    expect(htmlOf(nodes[0])).not.toContain("sm:flex-row");
    expect(htmlOf(nodes[1])).toContain("A quote between metrics.");
    expect(htmlOf(nodes[2])).not.toContain("sm:flex-row");
  });
});

describe("malformed markers", () => {
  it("leaves a metric without a pipe as a blockquote", () => {
    const [node] = transform([blockquote("[!METRIC] 12 projects")]);
    expect(node?.type).toBe("blockquote");
  });

  it("leaves an empty value or label as a blockquote", () => {
    const nodes = transform([
      blockquote("[!METRIC] | label"),
      blockquote("[!METRIC] value |"),
      blockquote("[!QUOTE]"),
      blockquote("An ordinary blockquote."),
    ]);
    expect(nodes.every(node => node.type === "blockquote")).toBe(true);
  });
});
