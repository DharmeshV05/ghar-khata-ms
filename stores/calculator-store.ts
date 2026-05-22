"use client";

import { create } from "zustand";

type Field = "quantity" | "unit_price" | "tax_rate" | "none";

type CalculatorState = {
  open: boolean;
  applyField: Field;
  setOpen: (v: boolean) => void;
  setApplyField: (f: Field) => void;
};

export const useCalculatorStore = create<CalculatorState>((set) => ({
  open: false,
  applyField: "none",
  setOpen: (open) => set({ open }),
  setApplyField: (applyField) => set({ applyField }),
}));
