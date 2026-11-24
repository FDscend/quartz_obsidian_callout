# Quartz Obsidian Callout

[Quartz](https://quartz.jzhao.xyz/) v5 插件：把 Obsidian 的 callout 渲染为 `div.callout`（与 Obsidian 自身
DOM 一致），并支持 Obsidian 插件、主题、CSS snippets 在此基础上扩展出来的写法。

## 为什么不直接用内置解析器

`@quartz-community/obsidian-flavored-markdown`（OFM）0.1.x 用「文本预处理 + 引用块改写」实现 callout，
有三个可见问题：

| 问题                             | 现象                                                            |
| -------------------------------- | --------------------------------------------------------------- |
| 预处理的正在 Markdown 解析之前跑 | 代码围栏里的 `> [!NOTE]` 会被追加一行多余的 `> `                |
| `\|metadata` 用惰性正则切分      | `> [!thm\|*] Theorem **name**` 会丢掉 `**name**` 的加粗         |
| 没有 keyword 回退                | 未知 keyword 保留原始 `data-callout`，只是「碰巧」看起来像 note |

本插件在 mdast 层工作：代码围栏不受影响，metadata 在节点边界处切分，标题里的 Markdown 正常渲染。

## 渲染结果

```markdown
> [!note] 标题
> 正文
```

```html
<div class="callout note" data-callout="note">
  <div class="callout-title">
    <div class="callout-icon"></div>
    <div class="callout-title-inner">标题</div>
  </div>
  <div class="callout-content"><p>正文</p></div>
</div>
```

### 支持的语法

| 能力                      | 语法                                                                        |
| ------------------------- | --------------------------------------------------------------------------- |
| 内置类型与别名            | `> [!note]`、`> [!hint]` → `tip`、`> [!check]` → `success` 等               |
| 未知关键字                | `> [!example-keyword]` 保留 `data-callout="example-keyword"`，外观回退 note |
| 自定义标题（含 Markdown） | `> [!note] **加粗** 与 \`代码\``                                            |
| metadata                  | `> [!note\|style-1]`、`> [!pdf\|yellow]`、`> [!multi-column\|col2]`         |
| 折叠                      | `> [!note]+`（展开）/ `> [!note]-`（折叠）                                  |
| 嵌套                      | callout 套 callout，或列表内的 callout                                      |
| 定理环境                  | `> [!thm]`、`> [!thm\|*]`、`> [!thm\|A]`，按 keyword 自动编号               |

### 内置样式

Obsidian 生态的约定开箱即用：

- 定理环境（`thm`、`def`、`lem`、`prp`、`cor`、`clm`、`asm`、`exm`、`exr`、`hyp`、`rmk`、`axm`、`cnj`）
- PDF++ facet：`> [!pdf|red]`、`|yellow`、`|important`、`|note`
- Border 主题变体：`style-1` … `style-4`
- `*-blank` 容器与 `|caption` 图片标题
- `multi-column`，支持 `col2`…`col5`、`wide-2`…`wide-5`、`flex-h`（flexible height，子栏高度不拉伸）、`no-wrap`（单行横向滚动）
- 旁注：`sidenote`、`sidenote-l`、`sidenote-r`、`stickynote*`，以及 `|aside`、`|aside-l`、`|aside-r`

## 安装

```bash
npx quartz plugin add github:FDscend/quartz_obsidian_callout#v0.1.0
```

然后在 `quartz.config.yaml` 里关掉 OFM 的 callout 解析，交给本插件：

```yaml
plugins:
  - source: "@quartz-community/obsidian-flavored-markdown"
    enabled: true
    options:
      callouts: false # 交给 obsidian-callout
    order: 30
  - source: "github:FDscend/quartz_obsidian_callout#v0.1.0"
    enabled: true
    options:
      theorems: true
    order: 31
```

顺序很重要：必须排在 OFM 之后。

## 配置项

| 选项       | 类型      | 默认   | 说明                 |
| ---------- | --------- | ------ | -------------------- |
| `theorems` | `boolean` | `true` | 自动为定理类环境编号 |
| `css`      | `boolean` | `true` | 注入内置样式         |
| `fold`     | `boolean` | `true` | 注入折叠交互脚本     |

## 说明

- 图标与配色变量沿用 Quartz 自带的 `quartz/styles/callouts.scss`，主题配色继续生效；插件只补上面这些扩展。
- 即使保留 OFM 的其它功能，也建议关掉它的 `callouts`：上面提到的代码围栏损坏也来自它。
- 不使用 Quartz 的 `callout` i18n 文案，与 Obsidian「默认标题显示 keyword」的行为一致。

## 许可证

MIT
