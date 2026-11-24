import type { Paragraph, PhrasingContent, Text } from "mdast";

/** Obsidian 内置 callout 类型及其别名到规范名的映射 */
export const CALLOUT_ALIASES: Record<string, string> = {
  note: "note",
  abstract: "abstract",
  summary: "abstract",
  tldr: "abstract",
  info: "info",
  todo: "todo",
  tip: "tip",
  hint: "tip",
  important: "tip",
  success: "success",
  check: "success",
  done: "success",
  question: "question",
  help: "question",
  faq: "question",
  warning: "warning",
  attention: "warning",
  caution: "warning",
  failure: "failure",
  missing: "failure",
  fail: "failure",
  danger: "danger",
  error: "danger",
  bug: "bug",
  example: "example",
  quote: "quote",
  cite: "quote",
};

/** 只匹配第一行的 `[!type|metadata]` 与紧随其后的折叠符号 */
const DIRECTIVE = /^\[!([^\]\n]+)\]([+-]?)/;

export interface CalloutHead {
  /** 原样保留的 keyword（已小写） */
  rawType: string;
  /** 用于样式与图标的规范 keyword */
  canonicalType: string;
  /** `|` 之后的 metadata，未写时为 undefined */
  metadata?: string;
  /** `+` 默认展开、`-` 默认折叠 */
  fold?: "+" | "-";
  /** 标题内容；空数组表示使用默认标题 */
  title: PhrasingContent[];
}

export interface ParsedCallout {
  head: CalloutHead;
  /** 标题行之后的内容 */
  content: PhrasingContent[];
}

function isText(node: PhrasingContent | undefined): node is Text {
  return node?.type === "text";
}

/**
 * 把 inline 节点序列在第一个换行处切开。
 *
 * 标题行与正文可能落在同一段落里（`> [!note] title` 紧跟 `> body`），
 * 换行也可能出现在任意 text 节点中，因此必须在节点层面切分，
 * 而不是对第一个 text 节点的字符串做正则。
 */
export function splitAtFirstLineBreak(children: PhrasingContent[]): {
  head: PhrasingContent[];
  tail: PhrasingContent[];
} {
  const head: PhrasingContent[] = [];

  for (let i = 0; i < children.length; i++) {
    const node = children[i]!;
    if (!isText(node)) {
      head.push(node);
      continue;
    }

    const nl = node.value.indexOf("\n");
    if (nl < 0) {
      head.push(node);
      continue;
    }

    if (nl > 0) {
      head.push({ ...node, value: node.value.slice(0, nl) });
    }

    const tail: PhrasingContent[] = [];
    const rest = node.value.slice(nl + 1);
    if (rest.length > 0) {
      tail.push({ ...node, value: rest });
    }
    tail.push(...children.slice(i + 1));

    return { head, tail };
  }

  return { head, tail: [] };
}

/** 去掉首尾空白与空 text 节点，避免标题出现多余空格 */
export function trimInline(children: PhrasingContent[]): PhrasingContent[] {
  const out: PhrasingContent[] = [];

  for (const node of children) {
    if (isText(node) && node.value.trim().length === 0) {
      continue;
    }
    out.push(node);
  }

  const first = out[0];
  if (isText(first)) {
    const value = first.value.replace(/^\s+/, "");
    if (value.length === 0) {
      out.shift();
    } else {
      out[0] = { ...first, value };
    }
  }

  const last = out[out.length - 1];
  if (isText(last)) {
    const value = last.value.replace(/\s+$/, "");
    if (value.length === 0) {
      out.pop();
    } else {
      out[out.length - 1] = { ...last, value };
    }
  }

  return out;
}

/**
 * 从段落的第一个 text 节点读取 callout 指令。
 *
 * 不是 callout 时返回 undefined；`[!` 必须出现在段首，因此普通引用
 * （含正文里偶发的 `[!x]`）不会被误判。
 */
export function parseCalloutParagraph(paragraph: Paragraph): ParsedCallout | undefined {
  const first = paragraph.children[0];
  if (!isText(first)) {
    return undefined;
  }

  const match = DIRECTIVE.exec(first.value);
  if (!match) {
    return undefined;
  }

  const tail = match[1]!.trim();
  if (tail.length === 0) {
    return undefined;
  }

  const pipe = tail.indexOf("|");
  const rawKeyword = (pipe < 0 ? tail : tail.slice(0, pipe)).trim();
  if (rawKeyword.length === 0) {
    return undefined;
  }

  const metadataRaw = pipe < 0 ? "" : tail.slice(pipe + 1).trim();
  const rawType = rawKeyword.toLowerCase();
  const foldChar = match[2];

  const restValue = first.value.slice(match[0].length);
  const restChildren = paragraph.children.slice(1) as PhrasingContent[];
  const inline: PhrasingContent[] =
    restValue.length > 0 ? [{ type: "text", value: restValue }, ...restChildren] : restChildren;

  const { head: titleLine, tail: bodyLine } = splitAtFirstLineBreak(inline);

  return {
    head: {
      rawType,
      canonicalType: CALLOUT_ALIASES[rawType] ?? rawType,
      metadata: metadataRaw.length > 0 ? metadataRaw : undefined,
      fold: foldChar === "+" || foldChar === "-" ? foldChar : undefined,
      title: trimInline(titleLine),
    },
    content: trimInline(bodyLine),
  };
}
