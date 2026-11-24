import type { Blockquote, PhrasingContent, Paragraph, Root } from "mdast";
import { parseCalloutParagraph } from "./directive";
import { allocateTheoremLabel, isTheoremKeyword, THEOREM_KEYWORDS } from "./theorems";

export interface CalloutTransformOptions {
  /** 关闭 thm 类环境的自动编号 */
  theorems?: boolean;
}

/** 我们生成的容器类名，用于避免重复处理 */
const GENERATED_CLASSES = new Set([
  "callout-content",
  "callout-title",
  "callout-icon",
  "callout-title-inner",
  "fold-callout-icon",
]);

type HProperties = Record<string, string | number | boolean | Array<string | number> | null>;

function hProperties(node: Blockquote | Paragraph): HProperties {
  const data = node.data as { hProperties?: HProperties } | undefined;
  return data?.hProperties ?? {};
}

function classNames(node: Blockquote | Paragraph): string[] {
  const value = hProperties(node).className as string[] | string | undefined;
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }
  return [];
}

function isGenerated(node: Blockquote | Paragraph): boolean {
  return classNames(node).some((name) => GENERATED_CLASSES.has(name));
}

function text(value: string): PhrasingContent {
  return { type: "text", value };
}

/**
 * 构造一个输出为 `<div>` 的容器。
 *
 * mdast 的 `hName`/`hProperties` 会被 remark-rehype 直接采用，
 * 因此不必生成原始 HTML 节点，标题里的 Markdown 也能正常渲染。
 * 类型上借用 `paragraph` + `hName` 表达块级容器，与 Quartz 内置做法一致。
 */
function div(className: string[], children: PhrasingContent[]): PhrasingContent {
  return {
    type: "paragraph",
    data: { hName: "div", hProperties: { className } },
    children,
  } as unknown as PhrasingContent;
}

function buildTitleChildren(
  keyword: string,
  title: PhrasingContent[],
  metadata: string | undefined,
  counters: Map<string, number>,
  theoremNumbering: boolean,
): PhrasingContent[] {
  if (theoremNumbering && isTheoremKeyword(keyword)) {
    const meta = THEOREM_KEYWORDS[keyword]!;
    const label = allocateTheoremLabel(counters, keyword, metadata);
    const heading = label === null ? `${meta.title}.` : `${meta.title} ${label}.`;
    const nodes: PhrasingContent[] = [text(heading)];
    if (title.length > 0) {
      nodes.push(text(" ("), ...title, text(")"));
    }
    return nodes;
  }

  if (title.length > 0) {
    return title;
  }

  // 与 Obsidian 一致：连字符转空格，仅首字母大写（`note-blank` → `Note blank`）
  return [text(keyword.replace(/-/g, " ").replace(/^[a-z]/, (c) => c.toUpperCase()))];
}

/**
 * 把整棵树里的 callout 引用块改写为 `div.callout` 结构。
 *
 * 返回转换的 callout 数量，方便测试与排查。
 */
export function transformCallouts(tree: Root, options: CalloutTransformOptions = {}): number {
  const theoremNumbering = options.theorems ?? true;
  const counters = new Map<string, number>();
  let count = 0;

  const walk = (node: Root | Blockquote | Paragraph) => {
    const children = node.children as Array<Root["children"][number]>;

    for (const child of children) {
      if (child.type === "blockquote" && !isGenerated(child)) {
        if (convertCallout(child, counters, theoremNumbering)) {
          count += 1;
          // 转换后继续深入，让嵌套 callout 也被处理
          walk(child);
          continue;
        }
      }

      if ("children" in child && Array.isArray(child.children)) {
        walk(child as Paragraph);
      }
    }
  };

  walk(tree);
  return count;
}

function convertCallout(
  node: Blockquote,
  counters: Map<string, number>,
  theoremNumbering: boolean,
): boolean {
  const firstChild = node.children[0];
  if (!firstChild || firstChild.type !== "paragraph") {
    return false;
  }

  const parsed = parseCalloutParagraph(firstChild);
  if (!parsed) {
    return false;
  }

  const { head, content } = parsed;
  const { rawType, canonicalType, metadata, fold } = head;

  const titleNodes = buildTitleChildren(rawType, head.title, metadata, counters, theoremNumbering);

  const body: Array<Blockquote["children"][number]> = [...node.children.slice(1)];
  if (content.length > 0) {
    body.unshift({ type: "paragraph", children: content });
  }

  const classList = ["callout", canonicalType];
  const properties: HProperties = {
    className: classList,
    "data-callout": canonicalType,
  };
  if (canonicalType !== rawType) {
    properties["data-callout-type"] = rawType;
  }
  if (metadata !== undefined) {
    properties["data-callout-metadata"] = metadata;
  }

  if (fold !== undefined) {
    classList.push("is-collapsible");
    if (fold === "-") {
      classList.push("is-collapsed");
    }
    properties["data-callout-fold"] = fold;
  }

  const titleBar: PhrasingContent[] = [
    div(["callout-icon"], []),
    div(["callout-title-inner"], titleNodes),
  ];
  if (fold !== undefined) {
    titleBar.push(div(["fold-callout-icon", "callout-fold"], []));
  }

  node.children = [
    div(["callout-title"], titleBar) as unknown as Blockquote["children"][number],
    {
      type: "blockquote",
      data: { hName: "div", hProperties: { className: ["callout-content"] } },
      children: body,
    },
  ];

  node.data = {
    ...node.data,
    hName: "div",
    hProperties: { ...hProperties(node), ...properties },
  };

  return true;
}
