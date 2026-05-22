import { format as formatFns } from "date-fns";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatInr(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);
  return INR.format(Number.isFinite(n) ? n : 0);
}

export function formatDate(d: string | Date | null | undefined, pattern = "dd MMM yyyy"): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return formatFns(dt, pattern);
}
