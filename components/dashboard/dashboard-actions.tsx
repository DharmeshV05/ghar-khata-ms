"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatInr } from "@/lib/format";
import { Plus, Receipt, AlertCircle } from "lucide-react";

const PaymentDialog = dynamic(
  () => import("@/components/purchases/payment-dialog").then((m) => m.PaymentDialog),
  { ssr: false }
);

type Due = {
  id: string;
  item_name: string;
  balance_due: string | number | null;
  purchase_date: string;
};

type Recent = {
  id: string;
  item_name: string;
  total_with_tax: number | null;
  line_total: number;
  purchase_date: string;
  payment_status: string;
  balance_due: number | null;
};

type Payable = { id: string; item_name: string; balance_due: string | number | null };

function usePayDialog() {
  const [payItem, setPayItem] = useState<{ id: string; name: string; balance: number } | null>(null);

  const dialog = payItem ? (
    <PaymentDialog
      purchaseId={payItem.id}
      itemName={payItem.name}
      balanceDue={payItem.balance}
      open={!!payItem}
      onOpenChange={(o) => !o && setPayItem(null)}
    />
  ) : null;

  function openPay(d: Payable) {
    setPayItem({
      id: d.id,
      name: d.item_name,
      balance: Number(d.balance_due),
    });
  }

  return { dialog, openPay };
}

export function DashboardQuickActions({
  canEdit,
  totalPending,
}: {
  canEdit: boolean;
  totalPending: number;
}) {
  if (!canEdit) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/purchases?add=1"
        className={cn(
          buttonVariants(),
          "bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-transform"
        )}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Entry
      </Link>
      {totalPending > 0 && (
        <Link
          href="/purchases?status=unpaid"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-border hover:bg-accent"
          )}
        >
          <Receipt className="mr-2 h-4 w-4" />
          View Dues ({formatInr(totalPending)})
        </Link>
      )}
    </div>
  );
}

export function DashboardDueCard({ dues, canEdit }: { dues: Due[]; canEdit: boolean }) {
  const { dialog, openPay } = usePayDialog();
  const dueRows = dues.filter((d) => Number(d.balance_due) > 0).slice(0, 5);
  if (!dueRows.length) return dialog;

  return (
    <>
      <div className="financial-card-lift rounded-xl border border-destructive/20 bg-[var(--gk-error-container)]/5 p-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Payments Due</h3>
              <p className="text-xs text-muted-foreground">Tap Pay to record a payment</p>
            </div>
          </div>
          <Link
            href="/purchases?status=unpaid"
            className="text-xs font-semibold text-[var(--gk-secondary)] hover:underline"
          >
            See all →
          </Link>
        </div>
        <ul className="space-y-2">
          {dueRows.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{d.item_name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(d.purchase_date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-numeric tabular-nums text-destructive">
                  {formatInr(Number(d.balance_due))}
                </span>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => openPay(d)}
                  >
                    Pay
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {dialog}
    </>
  );
}

export function DashboardRecentTable({
  recent,
  canEdit,
}: {
  recent: Recent[];
  canEdit: boolean;
}) {
  const { dialog, openPay } = usePayDialog();

  function statusClass(status: string) {
    switch (status) {
      case "paid":
        return "status-paid";
      case "unpaid":
        return "status-unpaid";
      case "partial":
        return "status-partial";
      default:
        return "status-pending";
    }
  }

  return (
    <>
      <div className="financial-card-lift overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
          <Link
            href="/purchases"
            className="text-xs font-semibold text-[var(--gk-secondary)] hover:underline"
          >
            View All Ledger →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent hover:bg-accent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Item
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                {canEdit && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((r) => (
                <TableRow key={r.id} className="transition-colors hover:bg-accent/50">
                  <TableCell className="font-semibold">{r.item_name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.purchase_date)}</TableCell>
                  <TableCell className="text-right font-numeric tabular-nums">
                    {formatInr(Number(r.total_with_tax ?? r.line_total))}
                  </TableCell>
                  <TableCell>
                    <span className={statusClass(r.payment_status)}>
                      {r.payment_status === "paid"
                        ? "Paid"
                        : r.payment_status === "unpaid"
                          ? "Unpaid"
                          : r.payment_status === "partial"
                            ? "Partial"
                            : "Pending"}
                    </span>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      {r.payment_status !== "paid" && Number(r.balance_due) > 0 && (
                        <Button size="sm" variant="outline" onClick={() => openPay(r)}>
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!recent.length && (
                <TableRow>
                  <TableCell
                    colSpan={canEdit ? 5 : 4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {canEdit ? (
                      <>
                        No purchases this month.{" "}
                        <Link
                          href="/purchases?add=1"
                          className="text-[var(--gk-secondary)] underline-offset-4 hover:underline"
                        >
                          Add your first purchase
                        </Link>
                      </>
                    ) : (
                      "No purchases this month."
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {dialog}
    </>
  );
}
