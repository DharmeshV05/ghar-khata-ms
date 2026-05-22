/** Safe numeric evaluation for calculator (arithmetic only, no mathjs). */
export function evaluateArithmetic(expression: string): number | null {
  const trimmed = expression.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/\s+/g, "");
  if (!/^[\d.+\-*/()]+$/.test(normalized)) return null;
  if (/(\.\.)|(\/\/)/.test(normalized)) return null;

  try {
    const result = Function(`"use strict"; return (${normalized})`)() as unknown;
    const n = typeof result === "number" ? result : Number(result);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100) / 100;
  } catch {
    return null;
  }
}
