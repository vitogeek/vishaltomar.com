import type { RehypePlugin } from "@astrojs/markdown-remark";
import {
  externalRelValue,
  isExternalHttpUrl,
  OPENS_IN_NEW_TAB,
} from "../utils/externalHref";

interface TextNode {
  type: "text";
  value: string;
}

interface ElementNode {
  type: "element";
  tagName: string;
  properties: Record<string, unknown>;
  children: Node[];
}

type Node = ElementNode | TextNode | { type: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isElementNode(node: unknown): node is ElementNode {
  if (!isRecord(node)) return false;
  if (node.type !== "element") return false;
  if (typeof node.tagName !== "string") return false;
  if (!isRecord(node.properties)) return false;
  if (!Array.isArray(node.children)) return false;
  return true;
}

function classTokens(value: unknown): string[] {
  if (typeof value === "string") {
    return value.split(/\s+/).filter(token => token.length > 0);
  }
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function hasNewTabLabel(element: ElementNode): boolean {
  return element.children.some(child => {
    if (!isElementNode(child) || child.tagName !== "span") return false;
    if (!classTokens(child.properties.className).includes("sr-only")) {
      return false;
    }
    return child.children.some(
      node =>
        node.type === "text" &&
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes(OPENS_IN_NEW_TAB)
    );
  });
}

function readChildren(node: Record<string, unknown>): unknown[] {
  const { children } = node;
  if (!Array.isArray(children)) return [];
  const result: unknown[] = [];
  for (let index = 0; index < children.length; index += 1) {
    result.push(children[index]);
  }
  return result;
}

function decorateAnchor(element: ElementNode, site: string): void {
  const { href } = element.properties;
  if (typeof href !== "string" || !isExternalHttpUrl(href, site)) return;

  element.properties.target = "_blank";
  element.properties.rel = externalRelValue(element.properties.rel);

  if (hasNewTabLabel(element)) return;

  const label: ElementNode = {
    type: "element",
    tagName: "span",
    properties: { className: ["sr-only"] },
    children: [{ type: "text", value: ` ${OPENS_IN_NEW_TAB}` }],
  };
  element.children.push(label);
}

function visit(node: unknown, site: string): void {
  if (!isRecord(node)) return;
  for (const child of readChildren(node)) {
    if (!isElementNode(child)) continue;
    if (child.tagName === "a") decorateAnchor(child, site);
    visit(child, site);
  }
}

const rehypeExternalLinks: RehypePlugin<[{ site: string }]> = function ({
  site,
}) {
  return tree => {
    visit(tree, site);
  };
};

export default rehypeExternalLinks;
