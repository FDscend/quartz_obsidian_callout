# Quartz Obsidian Callout

A [Quartz](https://quartz.jzhao.xyz/) v5 transformer plugin that renders Obsidian callouts
as `div.callout` — the same DOM Obsidian itself uses — and supports the callout variants that
Obsidian plugins, themes and CSS snippets add on top of the built-in syntax.

## Why not use the built-in parser?

`@quartz-community/obsidian-flavored-markdown` (OFM) 0.1.x implements callouts with a text
pre-pass plus a blockquote rewrite. That has three visible problems:

| Problem                                            | Symptom                                                                    |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| The pre-pass regex runs before the Markdown parser | `> [!NOTE]` inside a fenced code block gets a stray `> ` line appended     |
| `                                                  | metadata` is split with a lazy regex                                       | `> [!thm | *] Theorem **name**`loses the`**name**` formatting |
| No keyword fallback                                | unknown keywords keep a raw `data-callout` and only look right by accident |

This plugin works on the mdast instead, so code fences are untouched, metadata is split on the
node boundary, and Markdown inside the title renders normally.

## What it renders

```markdown
> [!note] Title
> Body
```

```html
<div class="callout note" data-callout="note">
  <div class="callout-title">
    <div class="callout-icon"></div>
    <div class="callout-title-inner">Title</div>
  </div>
  <div class="callout-content"><p>Body</p></div>
</div>
```

### Syntax covered

| Feature                    | Syntax                                                                          |
| -------------------------- | ------------------------------------------------------------------------------- |
| Built-in types and aliases | `> [!note]`, `> [!hint]` → `tip`, `> [!check]` → `success`, …                   |
| Unknown keywords           | `> [!example-keyword]` keeps `data-callout="example-keyword"`, styled as `note` |
| Custom title with Markdown | `> [!note] **Bold** and \`code\``                                               |
| Metadata                   | `> [!note\|style-1]`, `> [!pdf\|yellow]`, `> [!multi-column\|col2]`             |
| Foldable                   | `> [!note]+` (expanded) / `> [!note]-` (collapsed)                              |
| Nested callouts            | a callout inside another callout, or inside a list                              |
| Theorem environments       | `> [!thm]`, `> [!thm\|*]`, `> [!thm\|A]` — auto numbering per keyword           |

### Bundled CSS

Obsidian ecosystem conventions are styled out of the box:

- theorem environments (`thm`, `def`, `lem`, `prp`, `cor`, `clm`, `asm`, `exm`, `exr`, `hyp`, `rmk`, `axm`, `cnj`)
- PDF++ facets: `> [!pdf|red]`, `|yellow`, `|important`, `|note`
- Border theme variants: `style-1` … `style-4`
- `*-blank` containers and `|caption` image captions
- `multi-column` with `col2`…`col5`, `wide-2`…`wide-5`, `flex-h` (flexible height) and `no-wrap`
- sidenotes: `sidenote`, `sidenote-l`, `sidenote-r`, `stickynote*`, and `|aside`, `|aside-l`, `|aside-r`

## Installation

```bash
npx quartz plugin add github:FDscend/quartz_obsidian_callout#v0.1.0
```

Then in `quartz.config.yaml`, turn off OFM's callout parser so this plugin can take over:

```yaml
plugins:
  - source: "@quartz-community/obsidian-flavored-markdown"
    enabled: true
    options:
      callouts: false # handled by obsidian-callout
    order: 30
  - source: "github:FDscend/quartz_obsidian_callout#v0.1.0"
    enabled: true
    options:
      theorems: true
    order: 31
```

The order matters: it must run after OFM.

## Configuration

| Option     | Type      | Default | Description                            |
| ---------- | --------- | ------- | -------------------------------------- |
| `theorems` | `boolean` | `true`  | Auto-number theorem-like environments  |
| `css`      | `boolean` | `true`  | Inject the bundled stylesheet          |
| `fold`     | `boolean` | `true`  | Inject the collapse interaction script |

## Notes

- The plugin draws its icon and colour variables from Quartz's own `quartz/styles/callouts.scss`,
  so theme colours keep working; only the extensions above are added.
- Turning OFM's `callouts` off is recommended even if you keep the rest of OFM: it also removes
  the code-fence corruption described above.
- Quartz's `callout` i18n strings are not used, matching Obsidian's behaviour of showing the
  keyword as the default title.

## License

MIT
