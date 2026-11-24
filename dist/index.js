// src/directive.ts
var CALLOUT_ALIASES = {
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
  cite: "quote"
};
var DIRECTIVE = /^\[!([^\]\n]+)\]([+-]?)/;
function isText(node) {
  return node?.type === "text";
}
function splitAtFirstLineBreak(children) {
  const head = [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
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
    const tail = [];
    const rest = node.value.slice(nl + 1);
    if (rest.length > 0) {
      tail.push({ ...node, value: rest });
    }
    tail.push(...children.slice(i + 1));
    return { head, tail };
  }
  return { head, tail: [] };
}
function trimInline(children) {
  const out = [];
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
function parseCalloutParagraph(paragraph) {
  const first = paragraph.children[0];
  if (!isText(first)) {
    return void 0;
  }
  const match = DIRECTIVE.exec(first.value);
  if (!match) {
    return void 0;
  }
  const tail = match[1].trim();
  if (tail.length === 0) {
    return void 0;
  }
  const pipe = tail.indexOf("|");
  const rawKeyword = (pipe < 0 ? tail : tail.slice(0, pipe)).trim();
  if (rawKeyword.length === 0) {
    return void 0;
  }
  const metadataRaw = pipe < 0 ? "" : tail.slice(pipe + 1).trim();
  const rawType = rawKeyword.toLowerCase();
  const foldChar = match[2];
  const restValue = first.value.slice(match[0].length);
  const restChildren = paragraph.children.slice(1);
  const inline = restValue.length > 0 ? [{ type: "text", value: restValue }, ...restChildren] : restChildren;
  const { head: titleLine, tail: bodyLine } = splitAtFirstLineBreak(inline);
  return {
    head: {
      rawType,
      canonicalType: CALLOUT_ALIASES[rawType] ?? rawType,
      metadata: metadataRaw.length > 0 ? metadataRaw : void 0,
      fold: foldChar === "+" || foldChar === "-" ? foldChar : void 0,
      title: trimInline(titleLine)
    },
    content: trimInline(bodyLine)
  };
}

// src/theorems.ts
var THEOREM_KEYWORDS = {
  thm: { title: "Theorem" },
  def: { title: "Definition" },
  lem: { title: "Lemma" },
  prp: { title: "Proposition" },
  cor: { title: "Corollary" },
  clm: { title: "Claim" },
  asm: { title: "Assumption" },
  exm: { title: "Example" },
  exr: { title: "Exercise" },
  hyp: { title: "Hypothesis" },
  rmk: { title: "Remark" },
  axm: { title: "Axiom" },
  cnj: { title: "Conjecture" }
};
function isTheoremKeyword(keyword) {
  return Object.prototype.hasOwnProperty.call(THEOREM_KEYWORDS, keyword);
}
function allocateTheoremLabel(counters, keyword, metadata) {
  if (metadata === "*") {
    return null;
  }
  if (metadata !== void 0 && metadata.length > 0) {
    return metadata;
  }
  const next = (counters.get(keyword) ?? 0) + 1;
  counters.set(keyword, next);
  return next;
}

// src/callout.ts
var GENERATED_CLASSES = /* @__PURE__ */ new Set([
  "callout-content",
  "callout-title",
  "callout-icon",
  "callout-title-inner",
  "fold-callout-icon"
]);
function hProperties(node) {
  const data = node.data;
  return data?.hProperties ?? {};
}
function classNames(node) {
  const value = hProperties(node).className;
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }
  return [];
}
function isGenerated(node) {
  return classNames(node).some((name) => GENERATED_CLASSES.has(name));
}
function text(value) {
  return { type: "text", value };
}
function div(className, children) {
  return {
    type: "paragraph",
    data: { hName: "div", hProperties: { className } },
    children
  };
}
function buildTitleChildren(keyword, title, metadata, counters, theoremNumbering) {
  if (theoremNumbering && isTheoremKeyword(keyword)) {
    const meta = THEOREM_KEYWORDS[keyword];
    const label = allocateTheoremLabel(counters, keyword, metadata);
    const heading = label === null ? `${meta.title}.` : `${meta.title} ${label}.`;
    const nodes = [text(heading)];
    if (title.length > 0) {
      nodes.push(text(" ("), ...title, text(")"));
    }
    return nodes;
  }
  if (title.length > 0) {
    return title;
  }
  return [text(keyword.replace(/-/g, " ").replace(/^[a-z]/, (c) => c.toUpperCase()))];
}
function transformCallouts(tree, options = {}) {
  const theoremNumbering = options.theorems ?? true;
  const counters = /* @__PURE__ */ new Map();
  let count = 0;
  const walk = (node) => {
    const children = node.children;
    for (const child of children) {
      if (child.type === "blockquote" && !isGenerated(child)) {
        if (convertCallout(child, counters, theoremNumbering)) {
          count += 1;
          walk(child);
          continue;
        }
      }
      if ("children" in child && Array.isArray(child.children)) {
        walk(child);
      }
    }
  };
  walk(tree);
  return count;
}
function convertCallout(node, counters, theoremNumbering) {
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
  const titleNodes = buildTitleChildren(
    rawType,
    head.title,
    metadata,
    counters,
    theoremNumbering
  );
  const body = [...node.children.slice(1)];
  if (content.length > 0) {
    body.unshift({ type: "paragraph", children: content });
  }
  const classList = ["callout", canonicalType];
  const properties = {
    className: classList,
    "data-callout": canonicalType
  };
  if (canonicalType !== rawType) {
    properties["data-callout-type"] = rawType;
  }
  if (metadata !== void 0) {
    properties["data-callout-metadata"] = metadata;
  }
  if (fold !== void 0) {
    classList.push("is-collapsible");
    if (fold === "-") {
      classList.push("is-collapsed");
    }
    properties["data-callout-fold"] = fold;
  }
  const titleBar = [
    div(["callout-icon"], []),
    div(["callout-title-inner"], titleNodes)
  ];
  if (fold !== void 0) {
    titleBar.push(div(["fold-callout-icon", "callout-fold"], []));
  }
  node.children = [
    div(["callout-title"], titleBar),
    {
      type: "blockquote",
      data: { hName: "div", hProperties: { className: ["callout-content"] } },
      children: body
    }
  ];
  node.data = {
    ...node.data,
    hName: "div",
    hProperties: { ...hProperties(node), ...properties }
  };
  return true;
}

// src/styles.ts
var THEOREM_CALLOUTS = [
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
  "cnj"
];
var PDF_FACETS = [
  { facet: "red", color: "#ea5252" },
  { facet: "yellow", color: "#ffd000" },
  { facet: "important", color: "#bb61e5" },
  { facet: "note", color: "#1775d9" }
];
var theoremSelector = THEOREM_CALLOUTS.map((name) => `[data-callout="${name}"]`).join(",\n");
var CALLOUT_CSS = String.raw`
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
}`
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

// src/fold.ts
var FOLD_SCRIPT = String.raw`
function setupCallout(callout) {
  const title = callout.querySelector(":scope > .callout-title");
  const content = callout.querySelector(":scope > .callout-content");
  if (!title || !content) return;

  const sync = () => {
    content.style.gridTemplateRows = callout.classList.contains("is-collapsed") ? "0fr" : "1fr";
  };

  const onClick = () => {
    callout.classList.toggle("is-collapsed");
    sync();
  };

  title.addEventListener("click", onClick);
  sync();

  if (window.addCleanup) {
    window.addCleanup(() => title.removeEventListener("click", onClick));
  }
}

function initCallouts() {
  document.querySelectorAll(".callout.is-collapsible").forEach(setupCallout);
}

document.addEventListener("nav", initCallouts);
document.addEventListener("render", initCallouts);
`;

// src/index.ts
var remarkObsidianCallout = (options = {}) => (tree) => {
  transformCallouts(tree, options);
};
var ObsidianCallout = (userOpts) => {
  const opts = {
    theorems: true,
    css: true,
    fold: true,
    ...userOpts
  };
  return {
    name: "ObsidianCallout",
    markdownPlugins() {
      return [[remarkObsidianCallout, { theorems: opts.theorems }]];
    },
    externalResources() {
      const css = opts.css ? [{ content: CALLOUT_CSS, inline: true }] : [];
      const js = opts.fold ? [
        {
          script: FOLD_SCRIPT,
          loadTime: "afterDOMReady",
          contentType: "inline"
        }
      ] : [];
      return { css, js };
    }
  };
};
var src_default = ObsidianCallout;
ObsidianCallout.quartzCategory = "transformer";
var plugin = ObsidianCallout;

export { CALLOUT_ALIASES, CALLOUT_CSS, FOLD_SCRIPT, ObsidianCallout, THEOREM_KEYWORDS, allocateTheoremLabel, src_default as default, isTheoremKeyword, parseCalloutParagraph, plugin, remarkObsidianCallout, splitAtFirstLineBreak, transformCallouts };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map