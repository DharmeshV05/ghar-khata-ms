import { formatDate, formatInr } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Due = { id: string; item_name: string; balance_due: string | number | null; purchase_date: string };

export function DashboardReminders({ dues }: { dues: Due[] }) {
  const rows = dues.filter((d) => Number(d.balance_due) > 0).slice(0, 5);
  if (!rows.length) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Due payments reminder</CardTitle>
        <CardDescription>Unpaid or partially paid purchases with a balance</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {rows.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{d.item_name}</span>
              <span className="text-muted-foreground">{formatDate(d.purchase_date)}</span>
              <span className="text-amber-700 dark:text-amber-300 font-semibold tabular-nums">
                {formatInr(Number(d.balance_due))} due
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
