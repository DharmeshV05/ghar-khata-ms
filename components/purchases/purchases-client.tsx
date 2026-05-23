"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const PurchaseForm = dynamic(
  () => import("@/components/purchases/purchase-form").then((m) => m.PurchaseForm),
  { ssr: false, loading: () => <p className="text-muted-foreground py-8 text-center text-sm">Loading form…</p> }
);

const PaymentDialog = dynamic(
  () => import("@/components/purchases/payment-dialog").then((m) => m.PaymentDialog),
  { ssr: false }
);
import { formatDate, formatInr } from "@/lib/format";
import {
  createPurchase,
  updatePurchase,
  deletePurchase,
  duplicatePurchase,
} from "@/lib/actions/purchases";
import type { PurchaseFormValues } from "@/lib/validations/purchase";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";

export type PurchaseRow = {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
  total_with_tax: number | null;
  purchase_date: string;
  payment_status: string;
  balance_due: number;
  amount_paid: number;
  is_archived: boolean;
  category_id: string | null;
  vendor_id: string | null;
  notes: string | null;
  tax_rate: number | null;
};

type Opt = { id: string; name: string };

type Props = {
  purchases: PurchaseRow[];
  categories: Opt[];
  vendors: Opt[];
  canEdit: boolean;
  canManageCategories?: boolean;
  initialAddOpen?: boolean;
  initialStatus?: string;
  initialPayId?: string;
};

export function PurchasesClient({
  purchases,
  categories,
  vendors,
  canEdit,
  canManageCategories = false,
  initialAddOpen = false,
  initialStatus,
  initialPayId,
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(initialStatus ?? "all");
  const [showArchived, setShowArchived] = useState(false);
  const [addOpen, setAddOpen] = useState(initialAddOpen);
  const [editRow, setEditRow] = useState<PurchaseRow | null>(null);
  const [payRow, setPayRow] = useState<PurchaseRow | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initialPayId) {
      const row = purchases.find((p) => p.id === initialPayId);
      if (row && row.payment_status !== "paid") setPayRow(row);
    }
  }, [initialPayId, purchases]);

  const filtered = useMemo(() => {
    let rows = purchases;
    if (!showArchived) rows = rows.filter((r) => !r.is_archived);
    if (status !== "all") rows = rows.filter((r) => r.payment_status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.item_name.toLowerCase().includes(q));
    }
    return rows;
  }, [purchases, search, status, showArchived]);

  async function handleCreate(values: PurchaseFormValues) {
    const res = await createPurchase(values);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Purchase added");
    setAddOpen(false);
  }

  async function handleUpdate(values: PurchaseFormValues) {
    if (!editRow) return;
    const res = await updatePurchase(editRow.id, values);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Updated");
    setEditRow(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground text-sm">
            Add what you bought today — tap Pay when you settle the bill
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add purchase
          </Button>
        )}
      </div>

      {addOpen && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New purchase</DialogTitle>
            </DialogHeader>
            <PurchaseForm
              categories={categories}
              vendors={vendors}
              canManageCategories={canManageCategories}
              onSubmit={handleCreate}
              onCancel={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search item…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={showArchived ? "default" : "outline"}
          size="sm"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="w-32" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.item_name}</div>
                  <div className="text-muted-foreground text-xs">
                    {r.quantity} {r.unit} × {formatInr(r.unit_price)}
                  </div>
                </TableCell>
                <TableCell>{formatDate(r.purchase_date)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatInr(Number(r.total_with_tax ?? r.line_total))}
                  {Number(r.balance_due) > 0 && (
                    <div className="text-amber-600 text-xs dark:text-amber-400">
                      Due {formatInr(r.balance_due)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={r.payment_status === "paid" ? "default" : "secondary"}>
                    {r.payment_status}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {r.payment_status !== "paid" && (
                        <Button type="button" size="sm" variant="outline" onClick={() => setPayRow(r)}>
                          Pay
                        </Button>
                      )}
                      <Button type="button" size="icon" variant="ghost" onClick={() => setEditRow(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await duplicatePurchase(r.id);
                            if ("error" in res && res.error) toast.error(res.error);
                            else toast.success("Duplicated");
                          })
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            if (!confirm("Delete this purchase?")) return;
                            const res = await deletePurchase(r.id);
                            if ("error" in res && res.error) toast.error(res.error);
                            else toast.success("Deleted");
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="text-muted-foreground text-center">
                  No purchases match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editRow && (
        <Dialog open onOpenChange={(o) => !o && setEditRow(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit purchase</DialogTitle>
            </DialogHeader>
            <PurchaseForm
              mode="full"
              categories={categories}
              vendors={vendors}
              canManageCategories={canManageCategories}
              defaultValues={{
                item_name: editRow.item_name,
                quantity: editRow.quantity,
                unit: editRow.unit as PurchaseFormValues["unit"],
                unit_price: editRow.unit_price,
                purchase_date: editRow.purchase_date,
                category_id: editRow.category_id,
                vendor_id: editRow.vendor_id,
                notes: editRow.notes,
                is_archived: editRow.is_archived,
                tax_rate: editRow.tax_rate,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditRow(null)}
              submitLabel="Update"
            />
          </DialogContent>
        </Dialog>
      )}

      {payRow && (
        <PaymentDialog
          purchaseId={payRow.id}
          itemName={payRow.item_name}
          balanceDue={Number(payRow.balance_due)}
          open={!!payRow}
          onOpenChange={(o) => !o && setPayRow(null)}
        />
      )}
    </div>
  );
}
