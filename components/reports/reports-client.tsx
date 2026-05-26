"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { FileDown, Printer, FileText, Table2 } from "lucide-react";

type Props = {
  year: number;
  month: number;
};

export function ReportsClient({ year, month }: Props) {
  const [y, setY] = useState(String(year));
  const [m, setM] = useState(String(month));
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  const qs = `year=${y}&month=${m}`;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Financial Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Insightful breakdown of your household economy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="inline-flex rounded-xl bg-[var(--gk-surface-container-high)] p-1">
            {(["monthly", "quarterly", "yearly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all capitalize",
                  period === p
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <a
              href={`/api/reports/export?format=pdf&${qs}`}
              download
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 border-border"
              )}
            >
              <FileText className="h-4 w-4" />
              Export as PDF
            </a>
            <a
              href={`/api/reports/export?format=xlsx&${qs}`}
              download
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 border-border"
              )}
            >
              <Table2 className="h-4 w-4" />
              Export as Excel
            </a>
          </div>
        </div>
      </div>

      {/* Period Selectors */}
      <Card className="financial-card-lift">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Select Period</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Select value={y} onValueChange={(v) => v && setY(v)}>
            <SelectTrigger className="w-28 border-border bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[year, year - 1, year - 2].map((yr) => (
                <SelectItem key={yr} value={String(yr)}>
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={m} onValueChange={(v) => v && setM(v)}>
            <SelectTrigger className="w-36 border-border bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((mo) => (
                <SelectItem key={mo} value={String(mo)}>
                  {new Date(2000, mo - 1).toLocaleString("en-IN", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Export Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="financial-card-lift">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">PDF Report</CardTitle>
                <p className="text-xs text-muted-foreground">Download formatted statement</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <a
              href={`/api/reports/export?format=pdf&${qs}`}
              download
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full gap-2 border-border hover:bg-accent"
              )}
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </a>
          </CardContent>
        </Card>

        <Card className="financial-card-lift">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gk-tertiary-dim)]/10 text-[var(--gk-on-tertiary-container)]">
                <Table2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Excel Report</CardTitle>
                <p className="text-xs text-muted-foreground">Spreadsheet with all data</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <a
              href={`/api/reports/export?format=xlsx&${qs}`}
              download
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full gap-2 border-border hover:bg-accent"
              )}
            >
              <FileDown className="h-4 w-4" /> Download Excel
            </a>
          </CardContent>
        </Card>

        <Card className="financial-card-lift">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gk-secondary)]/10 text-[var(--gk-secondary)]">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Print Statement</CardTitle>
                <p className="text-xs text-muted-foreground">Printer-friendly view</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link
              href={`/reports/print?${qs}`}
              target="_blank"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full gap-2 border-border hover:bg-accent"
              )}
            >
              <Printer className="h-4 w-4" /> Open Printable View
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
