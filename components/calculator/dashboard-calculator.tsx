"use client";

import dynamic from "next/dynamic";

const CalculatorModal = dynamic(
  () => import("@/components/calculator/calculator-modal").then((m) => m.CalculatorModal),
  { ssr: false }
);

export function DashboardCalculator() {
  return <CalculatorModal />;
}
