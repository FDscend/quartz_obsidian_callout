import type { Root as MdastRoot } from "mdast";
import type { PluggableList, Plugin } from "unified";
import type { QuartzTransformerPlugin } from "@quartz-community/types";
import { transformCallouts, type CalloutTransformOptions } from "./callout";
import { CALLOUT_CSS } from "./styles";
import { FOLD_SCRIPT } from "./fold";

export interface ObsidianCalloutOptions extends CalloutTransformOptions {
  /** 注入插件自带的样式（默认开启） */
  css?: boolean;
  /** 注入折叠交互脚本（默认开启） */
  fold?: boolean;
}

export { transformCallouts } from "./callout";
export { CALLOUT_CSS } from "./styles";
export { parseCalloutParagraph, splitAtFirstLineBreak, CALLOUT_ALIASES } from "./directive";
export {
  THEOREM_KEYWORDS,
  isTheoremKeyword,
  allocateTheoremLabel,
  type TheoremLabel,
} from "./theorems";
export { FOLD_SCRIPT } from "./fold";

/**
 * remark 插件：把 Obsidian 的 `> [!type]` 引用块改写为 `<div class="callout">`。
 *
 * 与其他方案的区别：
 * - 在 mdast 层工作，代码块与行内代码天然不受影响（不会像 OFM 0.1.x 那样改坏围栏示例）；
 * - `|metadata` 与标题在节点层切分，标题里的 Markdown 会正常渲染；
 * - 未知 keyword 保留原 `data-callout`，样式回退到 note，但不会丢失自定义名；
 * - 支持 `thm` 类环境的自动编号 / `|*` / 手动编号。
 */
export const remarkObsidianCallout: Plugin<[CalloutTransformOptions?], MdastRoot> =
  (options = {}) =>
  (tree: MdastRoot) => {
    transformCallouts(tree, options);
  };

/**
 * 渲染 Obsidian 风格 callout 的 Quartz v5 插件。
 *
 * 需要把宿主配置中的 Obsidian Flavored Markdown `callouts` 关掉（`callouts: false`），
 * 否则它会先把引用块改写掉，本插件就没机会处理了。
 * 由于 OFM 0.1.x 的文本预处理会破坏代码围栏，关闭它对所有站点都是更安全的选择。
 */
export const ObsidianCallout: QuartzTransformerPlugin<Partial<ObsidianCalloutOptions>> = (
  userOpts,
) => {
  const opts: ObsidianCalloutOptions = {
    theorems: true,
    css: true,
    fold: true,
    ...userOpts,
  };

  return {
    name: "ObsidianCallout",
    markdownPlugins(): PluggableList {
      return [[remarkObsidianCallout, { theorems: opts.theorems }]];
    },
    externalResources() {
      const css = opts.css ? [{ content: CALLOUT_CSS, inline: true }] : [];
      const js = opts.fold
        ? [
            {
              script: FOLD_SCRIPT,
              loadTime: "afterDOMReady" as const,
              contentType: "inline" as const,
            },
          ]
        : [];
      return { css, js };
    },
  };
};

export default ObsidianCallout;

// 让加载器无需实例化探针即可识别插件类别
(ObsidianCallout as unknown as Record<string, unknown>).quartzCategory = "transformer";

/** 别名，便于不使用 `default` 导出的宿主引用 */
export const plugin = ObsidianCallout;
