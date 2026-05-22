import { describe, expect, it } from "vitest";
import { evaluateArithmetic } from "./safe-eval";

describe("evaluateArithmetic", () => {
  it("multiplies quantity and price", () => {
    expect(evaluateArithmetic("2 * 60")).toBe(120);
    expect(evaluateArithmetic("1.5 * 280")).toBe(420);
    expect(evaluateArithmetic("12 * 8")).toBe(96);
  });

  it("returns null for invalid input", () => {
    expect(evaluateArithmetic("")).toBeNull();
    expect(evaluateArithmetic("alert(1)")).toBeNull();
  });
});
