import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import { toHtml } from "hast-util-to-html";
import type { Root } from "mdast";
import { describe, expect, it } from "vitest";
import { transformCallouts } from "../src/callout";

/** 跑完整链路：Markdown → mdast → 本插件 → hast → HTML 字符串 */
async function render(markdown: string, theorems = true): Promise<string> {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(markdown) as Root;
  transformCallouts(tree, { theorems });
  const hast = await unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .run(tree);
  return toHtml(hast, { allowDangerousHtml: true });
}

function compact(html: string): string {
  return html.replace(/\s+/g, " ").trim();
}

describe("基础语法", () => {
  it("渲染为 div.callout 并带有 data-callout", async () => {
    const html = compact(await render("> [!note]\n>\n> hello"));
    expect(html).toContain('<div class="callout note" data-callout="note">');
    expect(html).toContain('<div class="callout-title">');
    expect(html).toContain('<div class="callout-content">');
    expect(html).toContain("<p>hello</p>");
  });

  it("keyword 别名归一到规范名，并保留原名", async () => {
    const html = compact(await render("> [!hint]\n>\n> body"));
    expect(html).toContain('data-callout="tip"');
    expect(html).toContain('data-callout-type="hint"');
  });

  it("未知 keyword 不丢信息", async () => {
    const html = compact(await render("> [!example-keyword]\n>\n> body"));
    expect(html).toContain('data-callout="example-keyword"');
    // 默认标题与 Obsidian 一致：连字符转空格，仅首字母大写
    expect(html).toContain("Example keyword");
  });

  it("自定义标题支持 Markdown", async () => {
    const html = compact(await render("> [!note] **Bold** and `code`\n>\n> body"));
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<code>code</code>");
  });

  it("标题与正文写在同一行时正确切分", async () => {
    const html = compact(await render("> [!note] Title\n> body"));
    expect(html).toContain("Title");
    expect(html).toContain("<p>body</p>");
  });
});

describe("metadata", () => {
  it("| 之后的内容写入 data-callout-metadata", async () => {
    const html = compact(await render("> [!note|style-1]\n>\n> c"));
    expect(html).toContain('data-callout-metadata="style-1"');
    expect(html).toContain('<div class="callout note"');
  });

  it("metadata 不会被当成标题的一部分", async () => {
    const html = compact(await render("> [!pdf|yellow] Title\n>\n> c"));
    expect(html).toContain('data-callout="pdf"');
    expect(html).toContain('data-callout-metadata="yellow"');
    const title = /callout-title-inner">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "";
    expect(title).toContain("Title");
    expect(title).not.toContain("yellow");
  });
});

describe("折叠", () => {
  it("+ 默认展开", async () => {
    const html = compact(await render("> [!note]+ Title\n>\n> body"));
    expect(html).toContain("is-collapsible");
    expect(html).not.toContain("is-collapsed");
    expect(html).toContain("fold-callout-icon");
  });

  it("- 默认折叠", async () => {
    const html = compact(await render("> [!note]- Title\n>\n> body"));
    expect(html).toContain("is-collapsible");
    expect(html).toContain("is-collapsed");
  });

  it("无折叠符号时不生成折叠图标", async () => {
    const html = compact(await render("> [!note] Title\n>\n> body"));
    expect(html).not.toContain("fold-callout-icon");
    expect(html).not.toContain("is-collapsible");
  });
});

describe("定理环境", () => {
  it("自动按 keyword 递增编号", async () => {
    const html = compact(await render("> [!thm] First\n>\n> a\n\n> [!thm] Second\n>\n> b"));
    expect(html).toContain("Theorem 1.");
    expect(html).toContain("Theorem 2.");
  });

  it("|* 不编号", async () => {
    const html = compact(await render("> [!thm|*] Pythagorean\n>\n> a"));
    expect(html).toContain("Theorem.");
    expect(html).not.toContain("Theorem 1.");
  });

  it("手动编号", async () => {
    const html = compact(await render("> [!thm|A] Custom\n>\n> a"));
    expect(html).toContain("Theorem A.");
  });

  it("关闭编号时不改写标题", async () => {
    const html = compact(await render("> [!thm] Keep\n>\n> a", false));
    expect(html).toContain("Keep");
    expect(html).not.toContain("Theorem 1.");
  });

  it("不同 keyword 各自计数", async () => {
    const html = compact(
      await render("> [!thm] T\n>\n> a\n\n> [!lem] L\n>\n> b\n\n> [!thm] T2\n>\n> c"),
    );
    expect(html).toContain("Theorem 1.");
    expect(html).toContain("Lemma 1.");
    expect(html).toContain("Theorem 2.");
  });
});

describe("不误伤", () => {
  it("代码围栏内的示例保持原样", async () => {
    const markdown = "```markdown\n> [!note] T\n> body\n```";
    const html = compact(await render(markdown));
    expect(html).not.toContain('data-callout="note"');
    expect(html).toContain("<pre><code");
    expect(html).toContain("[!note] T");
    expect(html).toContain("> body");
  });

  it("行内代码里的 [!x] 不被解析", async () => {
    const html = compact(await render("普通文本 `[!note]` 保持原样"));
    expect(html).not.toContain("data-callout");
    expect(html).toContain("<code>[!note]</code>");
  });

  it("普通引用不受影响", async () => {
    const html = compact(await render("> 只是引用"));
    expect(html).not.toContain("data-callout");
    expect(html).toContain("<blockquote>");
  });
});

describe("嵌套", () => {
  it("嵌套 callout 逐层渲染", async () => {
    const html = compact(await render("> [!multi-column|col2]\n>\n> > [!note] A\n> >\n> > x"));
    expect(html).toContain('data-callout="multi-column"');
    expect(html).toContain('data-callout-metadata="col2"');
    expect(html).toContain('data-callout="note"');
    expect(html).toContain("<p>x</p>");
  });

  it("列表内的 callout 也能识别", async () => {
    const html = compact(await render("- item\n\n  > [!note] T\n  > body\n"));
    expect(html).toContain('data-callout="note"');
    expect(html).toContain("<li>");
  });
});

describe("内容形式", () => {
  it("列表、代码块、表格都可作为正文", async () => {
    const html = compact(
      await render("> [!note] T\n>\n> - a\n> - b\n>\n> | x | y |\n> |---|---|\n> | 1 | 2 |"),
    );
    expect(html).toContain("<ul>");
    expect(html).toContain("<table>");
  });

  it("正文中的引用块保持引用语义", async () => {
    const html = compact(await render("> [!note] T\n>\n> > quoted"));
    expect(html).toContain('class="callout-content"');
    expect(html).toContain("<blockquote>");
  });
});
