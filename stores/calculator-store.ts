"use client";

import { create } from "zustand";

type CalculatorState = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

export const useCalculatorStore = create<CalculatorState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
