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
export const FOLD_SCRIPT = String.raw`
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
