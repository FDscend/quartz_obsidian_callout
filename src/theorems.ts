export interface TheoremMeta {
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
export const THEOREM_KEYWORDS: Record<string, TheoremMeta> = {
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
  cnj: { title: "Conjecture" },
};

export function isTheoremKeyword(keyword: string): boolean {
  return Object.prototype.hasOwnProperty.call(THEOREM_KEYWORDS, keyword);
}

export type TheoremLabel = number | string | null;

/**
 * 分配编号。`metadata` 为空时按 keyword 递增，`*` 表示不编号，
 * 其余视为手动标签。
 */
export function allocateTheoremLabel(
  counters: Map<string, number>,
  keyword: string,
  metadata: string | undefined,
): TheoremLabel {
  if (metadata === "*") {
    return null;
  }
  if (metadata !== undefined && metadata.length > 0) {
    return metadata;
  }
  const next = (counters.get(keyword) ?? 0) + 1;
  counters.set(keyword, next);
  return next;
}
