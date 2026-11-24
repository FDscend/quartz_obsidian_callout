# Changelog

## 0.1.0

- 首个版本：在 mdast 层解析 Obsidian callout，输出与 Obsidian 一致的 `div.callout` 结构
- 修复 OFM 0.1.x 的三个问题：代码围栏被改写、`|metadata` 切分导致标题 Markdown 丢失、未知 keyword 无回退
- 支持 `|metadata`、`+`/`-` 折叠、标题内 Markdown、嵌套、列表内 callout
- 定理环境：`thm`/`def`/`lem` 等 13 种，支持自动编号、`|*` 不编号、`|A` 手动编号
- 内置样式：PDF++ facet、Border 的 `style-1` ~ `style-4`、`*-blank`、`|caption`、`multi-column`、`sidenote`/`stickynote`/`aside`
