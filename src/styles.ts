/**
 * 定理类环境：与 Obsidian「LaTeX-like Theorem & Equation Referencer」插件一致。
 * 这些 keyword 由解析器负责编号，样式上与普通 callout 区分开（无图标、带边框）。
 */
export const THEOREM_CALLOUTS = [
  "thm",
  "def",
  "lem",
  "prp",
  "cor",
  "clm",
  "asm",
  "exm",
  "exr",
  "hyp",
  "rmk",
  "axm",
  "cnj",
] as const;

/** PDF++ 的 facet 配色，对应 `> [!pdf|yellow]` 这类写法 */
const PDF_FACETS: Array<{ facet: string; color: string }> = [
  { facet: "red", color: "#ea5252" },
  { facet: "yellow", color: "#ffd000" },
  { facet: "important", color: "#bb61e5" },
  { facet: "note", color: "#1775d9" },
];

const theoremSelector = THEOREM_CALLOUTS.map((name) => `[data-callout="${name}"]`).join(",\n");

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
export const CALLOUT_CSS = String.raw`
/* 由 blockquote 改为 div 后，基础间距需要自己补 */
article .callout {
  margin: 1rem 0;
}

/* ---------- 定理类环境 ---------- */
article .callout:is(${theoremSelector}) {
  --color: var(--darkgray);
  --border-opacity: 1;
  border: 1px solid var(--gray);
  background: transparent;
}

article .callout:is(${theoremSelector}) > .callout-title {
  padding-bottom: 0.4rem;
  font-weight: 700;
}

article .callout:is(${theoremSelector}) > .callout-title > .callout-icon {
  display: none;
}

article .callout:is(${theoremSelector}) > .callout-content {
  padding-bottom: 0.75rem;
}

/* ---------- PDF++ facet ---------- */
${PDF_FACETS.map(
  ({ facet, color }) => `article .callout[data-callout="pdf"][data-callout-metadata*="${facet}"] {
  --color: ${color};
  --border: ${color}44;
  --bg: ${color}10;
}`,
).join("\n\n")}

/* ---------- border 主题的 style-1 ~ style-4 ---------- */
article .callout[data-callout-metadata*="style-1"] {
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--color) 35%, transparent);
  overflow: hidden;
}

article .callout[data-callout-metadata*="style-1"] > .callout-title {
  padding: 0.6rem 1rem 0.3rem;
}

article .callout[data-callout-metadata*="style-1"] > .callout-content {
  margin-top: 0;
  padding: 0.2rem 1rem 0.8rem;
  border-radius: 0 0 5px 5px;
  background: var(--light);
}

article .callout[data-callout-metadata*="style-2"] {
  padding: 0.35rem;
  border: 1px solid color-mix(in srgb, var(--color) 35%, transparent);
}

article .callout[data-callout-metadata*="style-2"] > .callout-title {
  padding: 0.3rem 0.7rem 0.5rem;
}

article .callout[data-callout-metadata*="style-2"] > .callout-content {
  margin-top: 0;
  padding: 0.6rem 1rem 0.8rem;
  border-radius: 5px;
  background: var(--light);
}

article .callout[data-callout-metadata*="style-3"] {
  padding: 0.6rem 0.9rem 0.6rem 1rem;
  border: none;
  border-left: 4px solid var(--color);
  border-radius: 5px;
}

article .callout[data-callout-metadata*="style-3"] > .callout-title {
  padding: 0 0 0.3rem;
}

article .callout[data-callout-metadata*="style-3"] > .callout-content {
  padding-bottom: 0;
}

article .callout[data-callout-metadata*="style-4"] {
  padding: 0;
  border: none;
  border-left: 4px solid var(--color);
  overflow: hidden;
}

article .callout[data-callout-metadata*="style-4"] > .callout-title {
  padding: 0.6rem 1rem 0.3rem;
}

article .callout[data-callout-metadata*="style-4"] > .callout-content {
  margin-top: 0;
  padding: 0.2rem 1rem 0.8rem;
  background: var(--light);
}

/* ---------- *-blank：无边框、无标题的容器 ---------- */
article .callout[data-callout*="blank"] {
  border: none;
  background: transparent;
  padding: 0;
  box-shadow: none;
}

article .callout[data-callout*="blank"] > .callout-title {
  display: none;
}

article .callout[data-callout*="blank"] > .callout-content {
  margin-top: 0;
  padding: 0;
}

/* ---------- caption：图片标题 ---------- */
article .callout[data-callout*="blank"][data-callout-metadata*="caption"] > .callout-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  text-align: center;
}

article .callout[data-callout*="blank"][data-callout-metadata*="caption"] > .callout-content > p {
  margin: 0;
  font-size: 0.9em;
  color: var(--gray);
}

article .callout[data-callout*="blank"][data-callout-metadata*="caption"] img {
  display: block;
  max-width: 100%;
  height: auto;
}

/* ---------- multi-column 多栏布局 ---------- */
article .callout[data-callout="multi-column"] {
  border: none;
  background: transparent;
  padding: 0;
}

article .callout[data-callout="multi-column"] > .callout-title {
  display: none;
}

article .callout[data-callout="multi-column"] > .callout-content {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  align-items: stretch;
  grid-template-rows: none;
}

article .callout[data-callout="multi-column"] > .callout-content > * {
  flex: 1 1 0;
  min-width: min(100%, 14rem);
  margin: 0;
}

article .callout[data-callout="multi-column"] > .callout-content > .callout {
  display: flex;
  flex-direction: column;
}

article .callout[data-callout="multi-column"] > .callout-content > .callout > .callout-content {
  flex: 1;
}

article .callout[data-callout="multi-column"] > .callout-content > [data-callout-metadata*="wide-2"] { flex: 2 1 0; }
article .callout[data-callout="multi-column"] > .callout-content > [data-callout-metadata*="wide-3"] { flex: 3 1 0; }
article .callout[data-callout="multi-column"] > .callout-content > [data-callout-metadata*="wide-4"] { flex: 4 1 0; }
article .callout[data-callout="multi-column"] > .callout-content > [data-callout-metadata*="wide-5"] { flex: 5 1 0; }

article .callout[data-callout="multi-column"][data-callout-metadata*="col2"] > .callout-content > * { flex-basis: calc(50% - 0.45rem); }
article .callout[data-callout="multi-column"][data-callout-metadata*="col3"] > .callout-content > * { flex-basis: calc(33.333% - 0.6rem); }
article .callout[data-callout="multi-column"][data-callout-metadata*="col4"] > .callout-content > * { flex-basis: calc(25% - 0.675rem); }
article .callout[data-callout="multi-column"][data-callout-metadata*="col5"] > .callout-content > * { flex-basis: calc(20% - 0.72rem); }

article .callout[data-callout="multi-column"][data-callout-metadata*="flex-h"] > .callout-content {
  flex-wrap: nowrap;
}

/* ---------- 旁注：sidenote / stickynote / aside ---------- */
article .callout:is([data-callout^="sidenote"], [data-callout^="stickynote"], [data-callout-metadata*="aside"]) {
  width: var(--sidenote-width, 15rem);
  margin: 0.3rem 0 0.6rem;
  padding: 0.4rem 0.6rem;
  font-size: 0.85em;
  line-height: 1.5;
  border: none;
  background: transparent;
  overflow: visible;
}

article .callout[data-callout^="stickynote"] {
  border: 1px solid var(--lightgray);
  background: var(--light);
}

article .callout:is([data-callout^="sidenote"], [data-callout^="stickynote"]) > .callout-title {
  display: none;
}

/* 带标题的旁注：aside 元数据，保留标题栏 */
article .callout[data-callout-metadata*="aside"] > .callout-title {
  padding: 0 0 0.2rem;
}

article .callout[data-callout^="sidenote-r"],
article .callout[data-callout^="stickynote-r"],
article .callout[data-callout-metadata*="aside-r"] {
  float: right;
  margin-left: 1rem;
}

article .callout[data-callout^="sidenote-l"],
article .callout[data-callout^="stickynote-l"],
article .callout[data-callout-metadata*="aside-l"] {
  float: left;
  margin-right: 1rem;
}

article .callout:is([data-callout="sidenote"], [data-callout="stickynote"]),
article .callout[data-callout-metadata*="aside"]:not([data-callout-metadata*="aside-l"]) {
  float: right;
  margin-left: 1rem;
}

@media (max-width: 800px) {
  article .callout:is([data-callout^="sidenote"], [data-callout^="stickynote"], [data-callout-metadata*="aside"]) {
    float: none;
    width: 100%;
    margin: 1rem 0;
  }
}

/* ---------- 折叠：Quartz 基础样式负责动画，这里只补交互提示 ---------- */
article .callout.is-collapsible > .callout-title {
  cursor: pointer;
  user-select: none;
}

article .callout.is-collapsible > .callout-title > .fold-callout-icon {
  transition: transform 0.15s ease;
}

article .callout.is-collapsed > .callout-title > .fold-callout-icon {
  transform: rotate(-90deg);
}
`;
