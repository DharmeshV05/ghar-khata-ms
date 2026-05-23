"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateArithmetic } from "@/lib/math/safe-eval";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCalculatorStore } from "@/stores/calculator-store";
import { toast } from "sonner";

export function CalculatorModal() {
  const { open, setOpen } = useCalculatorStore();
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const recalc = useCallback(() => {
    setResult(evaluateArithmetic(expr));
  }, [expr]);

  useEffect(() => {
    recalc();
  }, [recalc]);

  useEffect(() => {
    if (open) {
      setExpr("");
      setResult(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  function append(s: string) {
    setExpr((prev) => `${prev}${s}`);
  }

  function copyResult() {
    if (result == null) return;
    void navigator.clipboard.writeText(String(result));
    toast.success("Copied to clipboard");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            ref={inputRef}
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && result != null) {
                e.preventDefault();
                copyResult();
              }
            }}
            placeholder="e.g. 2 * 60 or 1.5 * 280"
            className="font-mono text-lg"
          />
          <div className="text-muted-foreground min-h-8 text-right text-xl font-semibold tabular-nums">
            {result != null ? `= ${result.toLocaleString("en-IN")}` : "—"}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["7", "8", "9", "/"].map((x) => (
              <Button key={x} type="button" variant="secondary" onClick={() => append(x)}>
                {x}
              </Button>
            ))}
            {["4", "5", "6", "*"].map((x) => (
              <Button key={x} type="button" variant="secondary" onClick={() => append(x)}>
                {x}
              </Button>
            ))}
            {["1", "2", "3", "-"].map((x) => (
              <Button key={x} type="button" variant="secondary" onClick={() => append(x)}>
                {x}
              </Button>
            ))}
            {["0", ".", "+", "("].map((x) => (
              <Button key={x} type="button" variant="secondary" onClick={() => append(x)}>
                {x}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => append(")")}>
              )
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setExpr((s) => s.slice(0, -1))}>
              ⌫
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setExpr("")}>
              Clear
            </Button>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" className="flex-1" disabled={result == null} onClick={copyResult}>
              Copy result
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">Shortcut: Ctrl+K</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
