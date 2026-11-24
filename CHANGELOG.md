# Changelog

## 0.1.1

### Fixed

- `multi-column` 的 `flex-h` 语义写错：MCL 中它是 **flexible height**（`align-items: flex-start`，子栏高度不拉伸），插件误写成 `flex-wrap: nowrap`，导致 `col2-flex-h` 等多栏内容被挤成单行并溢出裁剪。现已改为正确语义。
- `multi-column` 子项原先用 `min-width: min(100%, 14rem)` 作为地板，使 `col4`（basis 25%）/`col5`（basis 20%）的分配宽度低于 14rem 时永远无法同排，强制降列。改为 `flex-basis: var(--callout-min-width, 14rem)` + `min-width: 0`，让列数真正由 `col2`~`col5` 决定，窄屏才折行。

### Added

- 支持 MCL 的 `no-wrap` 元数据：单行排列 + 横向滚动，子项不收缩。

## 0.1.0

- 首个版本：在 mdast 层解析 Obsidian callout，输出与 Obsidian 一致的 `div.callout` 结构
- 修复 OFM 0.1.x 的三个问题：代码围栏被改写、`|metadata` 切分导致标题 Markdown 丢失、未知 keyword 无回退
- 支持 `|metadata`、`+`/`-` 折叠、标题内 Markdown、嵌套、列表内 callout
- 定理环境：`thm`/`def`/`lem` 等 13 种，支持自动编号、`|*` 不编号、`|A` 手动编号
- 内置样式：PDF++ facet、Border 的 `style-1` ~ `style-4`、`*-blank`、`|caption`、`multi-column`、`sidenote`/`stickynote`/`aside`
