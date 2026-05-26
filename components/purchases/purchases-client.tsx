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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const PurchaseForm = dynamic(
  () => import("@/components/purchases/purchase-form").then((m) => m.PurchaseForm),
  { ssr: false, loading: () => <p className="py-8 text-center text-sm text-muted-foreground">Loading form…</p> }
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
import { Copy, Pencil, Plus, Trash2, Search, RefreshCw, Calendar, Filter } from "lucide-react";

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

  // Compute stats
  const totalSpend = purchases.filter((p) => !p.is_archived).reduce((s, p) => s + Number(p.total_with_tax ?? p.line_total), 0);
  const pendingAmount = purchases.filter((p) => !p.is_archived && p.payment_status !== "paid").reduce((s, p) => s + Number(p.balance_due), 0);
  const activeVendors = new Set(purchases.filter((p) => !p.is_archived && p.vendor_id).map((p) => p.vendor_id)).size;

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

  function statusClass(s: string) {
    switch (s) {
      case "paid": return "status-paid";
      case "unpaid": return "status-unpaid";
      case "partial": return "status-partial";
      default: return "status-pending";
    }
  }

  function statusLabel(s: string) {
    switch (s) {
      case "paid": return "Paid";
      case "unpaid": return "Pending";
      case "partial": return "Partial";
      default: return s;
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Purchase Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your household bill books and vendor payments.
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-transform"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Entry
          </Button>
        )}
      </div>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="financial-card-lift rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Monthly Spend
          </p>
          <div className="flex items-center justify-between">
            <p className="font-numeric text-2xl text-foreground">{formatInr(totalSpend)}</p>
            <span className="status-paid text-[11px]">
              <svg className="mr-0.5 inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              This month
            </span>
          </div>
        </div>
        <div className="financial-card-lift rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Clearances
          </p>
          <div className="flex items-center justify-between">
            <p className="font-numeric text-2xl text-destructive">{formatInr(pendingAmount)}</p>
            <span className="category-chip">{filtered.filter((r) => r.payment_status !== "paid").length} Vendors</span>
          </div>
        </div>
        <div className="financial-card-lift rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Creditors
          </p>
          <div className="flex items-center justify-between">
            <p className="font-numeric text-2xl text-[var(--gk-secondary)]">{activeVendors}</p>
            <span className="category-chip">Current Month</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-accent p-3">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search item or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border focus-visible:ring-[var(--gk-secondary)]"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="w-36 bg-card border-border">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
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
          className="border-border"
        >
          {showArchived ? "Hide archived" : "Archived"}
        </Button>
      </div>

      {/* Data Table */}
      <div className="financial-card-lift overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--gk-surface-container-high)] hover:bg-[var(--gk-surface-container-high)]">
                <TableHead className="text-xs font-bold uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Item Name</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Qty / Unit</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Price / Unit</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Total</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
                {canEdit && <TableHead className="w-32" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="group transition-colors hover:bg-accent/50">
                  <TableCell className="font-numeric text-sm text-muted-foreground">
                    {formatDate(r.purchase_date)}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-foreground">{r.item_name}</span>
                  </TableCell>
                  <TableCell className="text-right font-numeric">
                    {r.quantity} {r.unit}
                  </TableCell>
                  <TableCell className="text-right font-numeric">
                    {formatInr(r.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-numeric font-bold">
                    {formatInr(Number(r.total_with_tax ?? r.line_total))}
                    {Number(r.balance_due) > 0 && (
                      <div className="text-xs text-destructive">Due {formatInr(r.balance_due)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={statusClass(r.payment_status)}>
                      {statusLabel(r.payment_status)}
                    </span>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                  <TableCell colSpan={canEdit ? 7 : 6} className="text-center text-muted-foreground py-8">
                    No purchases match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {purchases.length} entries
          </p>
        </div>
      </div>

      {/* Dialogs */}
      {addOpen && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Purchase</DialogTitle>
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

      {editRow && (
        <Dialog open onOpenChange={(o) => !o && setEditRow(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Purchase</DialogTitle>
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
