"use client";

import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalculatorStore } from "@/stores/calculator-store";

export function CalculatorToggle() {
  const setOpen = useCalculatorStore((s) => s.setOpen);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Open calculator"
      onClick={() => setOpen(true)}
    >
      <Calculator className="h-4 w-4" />
    </Button>
  );
}
