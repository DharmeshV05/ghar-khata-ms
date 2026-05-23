import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { formatInr } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryPie, SpendTrendChart } from "@/components/charts/lazy-charts";
import {
  DashboardQuickActions,
  DashboardDueCard,
  DashboardRecentTable,
} from "@/components/dashboard/dashboard-actions";
import { canEditLedger } from "@/lib/household";

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startStr: start.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export default async function DashboardPage() {
  const ctx = await requireHousehold();
  const supabase = await createClient();
  const { startStr, endStr, month, year } = monthBounds();

  const [{ data: monthlyPurchases }, { data: catRows }, { data: venRows }] = await Promise.all([
    supabase
      .from("purchases")
      .select(
        "id, item_name, line_total, total_with_tax, payment_status, amount_paid, balance_due, purchase_date, category_id, vendor_id"
      )
      .eq("household_id", ctx.householdId)
      .eq("is_archived", false)
      .gte("purchase_date", startStr)
      .lte("purchase_date", endStr),
    supabase.from("categories").select("id, name").eq("household_id", ctx.householdId),
    supabase.from("vendors").select("id, name").eq("household_id", ctx.householdId),
  ]);

  const catById = new Map((catRows ?? []).map((c) => [c.id, c.name as string]));
  const venById = new Map((venRows ?? []).map((v) => [v.id, v.name as string]));

  const purchases = monthlyPurchases ?? [];

  let totalExpense = 0;
  let totalPending = 0;
  let paidAmount = 0;
  const vendorMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  const itemCount = new Map<string, number>();

  for (const p of purchases) {
    const gross = Number(p.total_with_tax ?? p.line_total);
    totalExpense += gross;
    const st = p.payment_status as string;
    const bal = Number(p.balance_due ?? 0);
    if (st !== "paid") totalPending += bal;
    paidAmount += Number(p.amount_paid ?? 0);

    const vid = p.vendor_id as string | null;
    const vname = vid ? venById.get(vid) ?? "Vendor" : "No vendor";
    vendorMap.set(vname, (vendorMap.get(vname) ?? 0) + gross);

    const cid = p.category_id as string | null;
    const cname = cid ? catById.get(cid) ?? "Category" : "Uncategorized";
    categoryMap.set(cname, (categoryMap.get(cname) ?? 0) + gross);

    itemCount.set(p.item_name, (itemCount.get(p.item_name) ?? 0) + 1);
  }

  const topVendors = [...vendorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topItems = [...itemCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const recent = [...purchases]
    .sort((a, b) => String(b.purchase_date).localeCompare(String(a.purchase_date)))
    .slice(0, 8);

  const sixStart = new Date(year, month - 1 - 5, 1);
  const sixEnd = new Date(year, month, 0);
  const sixStartStr = sixStart.toISOString().slice(0, 10);
  const sixEndStr = sixEnd.toISOString().slice(0, 10);

  const [{ data: sixPurchases }, { data: unpaidRows }] = await Promise.all([
    supabase
      .from("purchases")
      .select("purchase_date, line_total, total_with_tax")
      .eq("household_id", ctx.householdId)
      .eq("is_archived", false)
      .gte("purchase_date", sixStartStr)
      .lte("purchase_date", sixEndStr),
    supabase
      .from("purchases")
      .select("id, item_name, balance_due, purchase_date")
      .eq("household_id", ctx.householdId)
      .eq("is_archived", false)
      .in("payment_status", ["unpaid", "partial"])
      .order("purchase_date", { ascending: false })
      .limit(20),
  ]);

  const monthTotals = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthTotals.set(key, 0);
  }

  for (const row of sixPurchases ?? []) {
    const d = new Date(String(row.purchase_date));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthTotals.has(key)) continue;
    const gross = Number(row.total_with_tax ?? row.line_total);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + gross);
  }

  const last6Months = [...monthTotals.entries()].map(([key, total]) => {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return {
      label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
      total,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </div>
        <DashboardQuickActions canEdit={canEditLedger(ctx.role)} totalPending={totalPending} />
      </div>

      <DashboardDueCard dues={unpaidRows ?? []} canEdit={canEditLedger(ctx.role)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Monthly spend</CardDescription>
            <CardTitle className="text-2xl">{formatInr(totalExpense)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Pending to pay</CardDescription>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
              {formatInr(totalPending)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Recorded payments (month)</CardDescription>
            <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
              {formatInr(paidAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Purchases (count)</CardDescription>
            <CardTitle className="text-2xl">{purchases.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Spending trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            <SpendTrendChart data={last6Months} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">By category</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <CategoryPie data={[...categoryMap.entries()].map(([name, value]) => ({ name, value }))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topVendors.map(([name, amt]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-medium tabular-nums">{formatInr(amt)}</span>
                </li>
              ))}
              {!topVendors.length && (
                <li className="text-muted-foreground text-sm">No data yet this month.</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Most purchased items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topItems.map(([name, n]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span className="truncate pr-2">{name}</span>
                  <span className="text-muted-foreground shrink-0">{n}×</span>
                </li>
              ))}
              {!topItems.length && (
                <li className="text-muted-foreground text-sm">No purchases yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <DashboardRecentTable
        recent={recent.map((r) => ({
          id: r.id,
          item_name: r.item_name,
          total_with_tax: r.total_with_tax as number | null,
          line_total: Number(r.line_total),
          purchase_date: r.purchase_date,
          payment_status: r.payment_status as string,
          balance_due: r.balance_due as number | null,
        }))}
        canEdit={canEditLedger(ctx.role)}
      />
    </div>
  );
}
