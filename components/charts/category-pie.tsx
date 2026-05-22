"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type Row = { name: string; value: number };

export function CategoryPie({ data }: { data: Row[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (!filtered.length) {
    return <p className="text-muted-foreground flex h-full items-center justify-center text-sm">No category data</p>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `₹${Number(v ?? 0).toLocaleString("en-IN")}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
