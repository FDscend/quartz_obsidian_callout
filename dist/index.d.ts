import { Root, Paragraph, PhrasingContent } from 'mdast';
import { Plugin } from 'unified';
import { QuartzTransformerPlugin } from '@quartz-community/types';

interface CalloutTransformOptions {
    /** 关闭 thm 类环境的自动编号 */
    theorems?: boolean;
}
/**
 * 把整棵树里的 callout 引用块改写为 `div.callout` 结构。
 *
 * 返回转换的 callout 数量，方便测试与排查。
 */
declare function transformCallouts(tree: Root, options?: CalloutTransformOptions): number;

/**
 * 插件注入的样式。
 *
 * 基础外观（图标、色彩变量、折叠过渡）沿用 Quartz 内置的 callouts.scss，
 * 这里只补齐 Obsidian 生态扩展出来的写法：
 * - 定理环境、PDF facet
 * - border 主题的 style-1 ~ style-4
 * - `*-blank`、`caption`
 * - multi-column 多栏布局
 * - sidenote / stickynote / aside 旁注
 */
declare const CALLOUT_CSS: string;

/** Obsidian 内置 callout 类型及其别名到规范名的映射 */
declare const CALLOUT_ALIASES: Record<string, string>;
interface CalloutHead {
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
interface ParsedCallout {
    head: CalloutHead;
    /** 标题行之后的内容 */
    content: PhrasingContent[];
}
/**
 * 把 inline 节点序列在第一个换行处切开。
 *
 * 标题行与正文可能落在同一段落里（`> [!note] title` 紧跟 `> body`），
 * 换行也可能出现在任意 text 节点中，因此必须在节点层面切分，
 * 而不是对第一个 text 节点的字符串做正则。
 */
declare function splitAtFirstLineBreak(children: PhrasingContent[]): {
    head: PhrasingContent[];
    tail: PhrasingContent[];
};
/**
 * 从段落的第一个 text 节点读取 callout 指令。
 *
 * 不是 callout 时返回 undefined；`[!` 必须出现在段首，因此普通引用
 * （含正文里偶发的 `[!x]`）不会被误判。
 */
declare function parseCalloutParagraph(paragraph: Paragraph): ParsedCallout | undefined;

interface TheoremMeta {
    /** 默认标题，如 `Theorem` */
    title: string;
}
/**
 * 与 Obsidian「LaTeX-like Theorem & Equation Referencer」插件一致的环境列表。
 *
 * 编号规则：
 * - `> [!thm]`   → 按 keyword 各自递增（Theorem 1、Theorem 2…）
 * - `> [!thm|*]` → 不编号
 * - `> [!thm|A]` → 手动编号（Theorem A）
 */
declare const THEOREM_KEYWORDS: Record<string, TheoremMeta>;
declare function isTheoremKeyword(keyword: string): boolean;
type TheoremLabel = number | string | null;
/**
 * 分配编号。`metadata` 为空时按 keyword 递增，`*` 表示不编号，
 * 其余视为手动标签。
 */
declare function allocateTheoremLabel(counters: Map<string, number>, keyword: string, metadata: string | undefined): TheoremLabel;

/**
 * 折叠交互脚本。
 *
 * 以源码字符串形式提供，由 Quartz 注入 `<script>`；
 * 与 Quartz 内置 callout 脚本保持相同实现：只切换 `is-collapsed`
 * 并同步 `grid-template-rows`，高度动画交给 `quartz/styles/callouts.scss`。
 *
 * SPA 导航会重复触发 `nav`，因此每次都需要重新绑定，并用
 * `window.addCleanup` 释放上一次的监听。
 */
declare const FOLD_SCRIPT: string;

interface ObsidianCalloutOptions extends CalloutTransformOptions {
    /** 注入插件自带的样式（默认开启） */
    css?: boolean;
    /** 注入折叠交互脚本（默认开启） */
    fold?: boolean;
}

/**
 * remark 插件：把 Obsidian 的 `> [!type]` 引用块改写为 `<div class="callout">`。
 *
 * 与其他方案的区别：
 * - 在 mdast 层工作，代码块与行内代码天然不受影响（不会像 OFM 0.1.x 那样改坏围栏示例）；
 * - `|metadata` 与标题在节点层切分，标题里的 Markdown 会正常渲染；
 * - 未知 keyword 保留原 `data-callout`，样式回退到 note，但不会丢失自定义名；
 * - 支持 `thm` 类环境的自动编号 / `|*` / 手动编号。
 */
declare const remarkObsidianCallout: Plugin<[CalloutTransformOptions?], Root>;
/**
 * 渲染 Obsidian 风格 callout 的 Quartz v5 插件。
 *
 * 需要把宿主配置中的 Obsidian Flavored Markdown `callouts` 关掉（`callouts: false`），
 * 否则它会先把引用块改写掉，本插件就没机会处理了。
 * 由于 OFM 0.1.x 的文本预处理会破坏代码围栏，关闭它对所有站点都是更安全的选择。
 */
declare const ObsidianCallout: QuartzTransformerPlugin<Partial<ObsidianCalloutOptions>>;

/** 别名，便于不使用 `default` 导出的宿主引用 */
declare const plugin: QuartzTransformerPlugin<Partial<ObsidianCalloutOptions>>;

export { CALLOUT_ALIASES, CALLOUT_CSS, FOLD_SCRIPT, ObsidianCallout, type ObsidianCalloutOptions, THEOREM_KEYWORDS, type TheoremLabel, allocateTheoremLabel, ObsidianCallout as default, isTheoremKeyword, parseCalloutParagraph, plugin, remarkObsidianCallout, splitAtFirstLineBreak, transformCallouts };
