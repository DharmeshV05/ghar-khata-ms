"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { FileDown, Printer } from "lucide-react";

type Props = {
  year: number;
  month: number;
};

export function ReportsClient({ year, month }: Props) {
  const [y, setY] = useState(String(year));
  const [m, setM] = useState(String(month));

  const qs = `year=${y}&month=${m}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm">Export monthly or yearly summaries</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Period</CardTitle>
          <CardDescription>Select month and year for exports</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Select value={y} onValueChange={(v) => v && setY(v)}>
            <SelectTrigger className="w-28">
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
            <SelectTrigger className="w-32">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">PDF report</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`/api/reports/export?format=pdf&${qs}`}
              download
              className={cn(buttonVariants({ variant: "outline" }), "w-full inline-flex")}
            >
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </a>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Excel report</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`/api/reports/export?format=xlsx&${qs}`}
              download
              className={cn(buttonVariants({ variant: "outline" }), "w-full inline-flex")}
            >
              <FileDown className="mr-2 h-4 w-4" /> Download Excel
            </a>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Print statement</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/reports/print?${qs}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline" }), "w-full inline-flex")}
            >
              <Printer className="mr-2 h-4 w-4" /> Open printable view
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
