import { defineConfig } from "tsup";
import type { Plugin } from "esbuild";
import path from "path";

/**
 * 把 `.inline.ts` 编译成浏览器可用的 JavaScript 字符串。
 *
 * 与 Quartz v5 自己的 inline-script-loader 保持一致：去掉模块语法、
 * 打包本地与 npm 依赖，输出单段可注入 `<script>` 的代码。
 */
const inlineScriptPlugin: Plugin = {
  name: "inline-script-loader",
  setup(build) {
    const absWorkingDir = build.initialOptions.absWorkingDir ?? process.cwd();

    build.onLoad({ filter: /\.inline\.ts$/ }, async (args) => {
      const esbuild = await import("esbuild");
      const fs = await import("fs");
      let text = await fs.promises.readFile(args.path, "utf8");

      text = text.replace(/^export default /gm, "");
      text = text.replace(/^export /gm, "");

      const resolveDir = path.dirname(args.path);
      const sourcefile = path.relative(absWorkingDir, args.path);

      const result = await esbuild.build({
        stdin: {
          contents: text,
          loader: "ts",
          resolveDir,
          sourcefile,
        },
        write: false,
        bundle: true,
        minify: true,
        platform: "browser",
        format: "esm",
        target: "es2020",
        sourcemap: false,
        external: ["http://*", "https://*"],
      });

      const js = result.outputFiles?.[0]?.text;
      if (!js) throw new Error(`inline-script-loader: no JS output for ${args.path}`);

      return { contents: js, loader: "text" };
    });
  },
};

/**
 * 必须是宿主与所有插件共用的单实例包，否则 hook / context 会跨实例失效。
 */
const SINGLETON_EXTERNALS = [
  "preact",
  "preact/hooks",
  "preact/jsx-runtime",
  "preact/compat",
  "@jackyzha0/quartz",
  "@jackyzha0/quartz/*",
  "vfile",
  "vfile/*",
  "unified",
];

export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types.ts",
  },
  format: ["esm"],
  dts: true,
  tsconfig: "tsconfig.build.json",
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  splitting: false,
  outDir: "dist",
  platform: "node",
  noExternal: [/.*/],
  external: SINGLETON_EXTERNALS,
  esbuildPlugins: [inlineScriptPlugin],
});
