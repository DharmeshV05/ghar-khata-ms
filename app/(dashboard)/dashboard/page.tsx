import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { formatInr } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const paidPct = totalExpense > 0 ? Math.round((paidAmount / totalExpense) * 100) : 0;
  const unpaidPct = 100 - paidPct;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Financial Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Tracking household liquidity and liabilities —{" "}
            {new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </div>
        <DashboardQuickActions canEdit={canEditLedger(ctx.role)} totalPending={totalPending} />
      </div>

      {/* Due Card */}
      <DashboardDueCard dues={unpaidRows ?? []} canEdit={canEditLedger(ctx.role)} />

      {/* Summary Stat Cards — Bento Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Monthly Expenses */}
        <div className="financial-card-lift rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gk-secondary)]/10 text-[var(--gk-secondary)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {paidPct > 0 && (
              <span className="status-paid text-[11px]">
                {paidPct}% paid
              </span>
            )}
          </div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Monthly Expenses
          </p>
          <p className="font-numeric text-2xl text-foreground md:text-3xl">{formatInr(totalExpense)}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-[var(--gk-secondary)] animate-progress"
              style={{ width: `${Math.min(paidPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Total Pending */}
        <div className="financial-card-lift rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {totalPending > 0 && (
              <span className="status-unpaid text-[11px]">High Priority</span>
            )}
          </div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Pending Amount
          </p>
          <p className="font-numeric text-2xl text-foreground md:text-3xl">{formatInr(totalPending)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(unpaidRows ?? []).length} items due
          </p>
        </div>

        {/* Paid vs Unpaid Breakdown */}
        <div className="financial-card-lift rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Paid vs Unpaid Breakdown
          </p>
          <div className="mb-3 flex items-end gap-3" style={{ height: 80 }}>
            <div className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-[var(--gk-tertiary-dim)] transition-all"
                style={{ height: `${Math.max(paidPct * 0.8, 4)}px` }}
              />
              <span className="text-[11px] font-semibold text-muted-foreground">Paid</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-destructive transition-all"
                style={{ height: `${Math.max(unpaidPct * 0.8, 4)}px` }}
              />
              <span className="text-[11px] font-semibold text-muted-foreground">Unpaid</span>
            </div>
          </div>
          <div className="flex justify-between font-numeric text-lg">
            <span className="text-[var(--gk-on-tertiary-container)]">{paidPct}%</span>
            <span className="text-destructive">{unpaidPct}%</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Spending Trend — wider */}
        <Card className="financial-card-lift lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Analytics</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            <SpendTrendChart data={last6Months} />
          </CardContent>
        </Card>

        {/* Category Spend */}
        <Card className="financial-card-lift lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Category Spend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <CategoryPie data={[...categoryMap.entries()].map(([name, value]) => ({ name, value }))} />
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors & Most Purchased */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="financial-card-lift">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topVendors.map(([name, amt]) => (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gk-surface-container)] text-[10px] font-bold text-muted-foreground">
                        {name.slice(0, 2).toUpperCase()}
                      </span>
                      {name}
                    </span>
                    <span className="font-numeric tabular-nums">{formatInr(amt)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-[var(--gk-secondary-container)] animate-progress"
                      style={{ width: `${totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {!topVendors.length && (
                <p className="text-sm text-muted-foreground">No data yet this month.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card-lift">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Most Purchased Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topItems.map(([name, n]) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gk-surface-container-high)] text-[var(--gk-secondary)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">Bought {n} times</p>
                  </div>
                  <span className="font-numeric text-sm">{n}×</span>
                </div>
              ))}
              {!topItems.length && (
                <p className="text-sm text-muted-foreground">No purchases yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
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
