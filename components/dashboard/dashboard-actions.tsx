"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Link href="/purchases?add=1" className={cn(buttonVariants())}>
        <Plus className="mr-2 h-4 w-4" />
        Add purchase
      </Link>
      {totalPending > 0 && (
        <Link href="/purchases?status=unpaid" className={cn(buttonVariants({ variant: "outline" }))}>
          <Receipt className="mr-2 h-4 w-4" />
          View dues ({formatInr(totalPending)})
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
      <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Payments due
              </CardTitle>
              <CardDescription>Tap Pay to record a payment without leaving home</CardDescription>
            </div>
            <Link
              href="/purchases?status=unpaid"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}
            >
              See all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {dueRows.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/60 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.item_name}</p>
                  <p className="text-muted-foreground text-xs">{formatDate(d.purchase_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-700 tabular-nums dark:text-amber-300">
                    {formatInr(Number(d.balance_due))}
                  </span>
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => openPay(d)}>
                      Pay
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
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

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Recent purchases</CardTitle>
          <Link href="/purchases" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            View all
          </Link>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.item_name}</TableCell>
                  <TableCell>{formatDate(r.purchase_date)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatInr(Number(r.total_with_tax ?? r.line_total))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.payment_status === "paid" ? "default" : "secondary"}>
                      {r.payment_status}
                    </Badge>
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
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    {canEdit ? (
                      <>
                        No purchases this month.{" "}
                        <Link
                          href="/purchases?add=1"
                          className="text-primary underline-offset-4 hover:underline"
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
        </CardContent>
      </Card>
      {dialog}
    </>
  );
}
