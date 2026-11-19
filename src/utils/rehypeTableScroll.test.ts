import { describe, expect, it } from "vitest";
import { rehypeTableScroll } from "./rehypeTableScroll";

interface Node {
  type: string;
  tagName?: string;
  value?: string;
  properties?: {
    className?: string[];
    tabIndex?: number;
    role?: string;
    ariaLabel?: string;
  };
  children?: Node[];
}

function run(children: Node[]): Node[] {
  const tree: Node = { type: "root", children };
  rehypeTableScroll()(tree);
  return tree.children ?? [];
}

describe("rehypeTableScroll", () => {
  it("wraps a table once with an accessible scroll region", () => {
    const table: Node = {
      type: "element",
      tagName: "table",
      children: [
        {
          type: "element",
          tagName: "caption",
          children: [{ type: "text", value: "Example results" }],
        },
      ],
    };
    const [wrapper] = run([table]);
    expect(wrapper?.tagName).toBe("div");
    expect(wrapper?.properties).toMatchObject({
      className: ["case-table-scroll"],
      tabIndex: 0,
      role: "region",
      ariaLabel: "Example results",
    });
    expect(wrapper?.children).toEqual([table]);
    expect(
      wrapper?.children?.some(child =>
        child.properties?.className?.includes("case-table-scroll")
      )
    ).toBe(false);
  });
});
