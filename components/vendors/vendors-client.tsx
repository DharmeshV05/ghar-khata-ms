"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatInr } from "@/lib/format";
import { createVendor, updateVendor, deleteVendor } from "@/lib/actions/vendors";
import { vendorFormSchema } from "@/lib/validations/purchase";
import { Plus, Phone, UserPlus, TrendingUp, Store, ShoppingBasket, Utensils } from "lucide-react";

export type VendorRow = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  pending: number;
};

type Props = {
  vendors: VendorRow[];
  canEdit: boolean;
  canDelete: boolean;
};

const vendorIcons = [Store, ShoppingBasket, Utensils];

export function VendorsClient({ vendors, canEdit, canDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<VendorRow | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const totalOutstanding = vendors.reduce((s, v) => s + v.pending, 0);
  const paidPct = totalOutstanding > 0 ? Math.min(64, Math.round((vendors.filter((v) => v.pending === 0).length / Math.max(vendors.length, 1)) * 100)) : 100;

  function resetForm(v?: VendorRow | null) {
    setName(v?.name ?? "");
    setPhone(v?.phone ?? "");
    setAddress(v?.address ?? "");
    setNotes(v?.notes ?? "");
  }

  async function save() {
    const payload = vendorFormSchema.safeParse({
      name,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    });
    if (!payload.success) {
      toast.error(payload.error.message);
      return;
    }
    const res = edit
      ? await updateVendor(edit.id, payload.data)
      : await createVendor(payload.data);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(edit ? "Vendor updated" : "Vendor added");
    setOpen(false);
    setEdit(null);
    resetForm();
  }

  return (
    <div className="space-y-8">
      {/* Hero Section — Total Outstanding Debt */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative col-span-1 overflow-hidden rounded-xl bg-[var(--gk-primary-container)] p-6 text-white shadow-sm md:col-span-2">
          {/* Decorative background */}
          <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-[var(--gk-secondary)] opacity-20 blur-3xl" />
          <div className="relative z-10">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--gk-on-surface-variant)]">
              Total Outstanding Debt
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              {formatInr(totalOutstanding)}
            </h2>
            {totalOutstanding > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="flex items-center text-[var(--gk-tertiary-dim)]">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span className="font-numeric font-bold">{vendors.filter((v) => v.pending > 0).length}</span>
                </span>
                <span className="text-[var(--gk-on-surface-variant)]">vendors with pending balance</span>
              </div>
            )}
          </div>
          <div className="relative z-10 mt-6 flex gap-3">
            {canEdit && (
              <Button
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
                className="bg-[var(--gk-secondary)] text-white hover:bg-[var(--gk-secondary)]/90 active:scale-95 transition-transform"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            )}
          </div>
        </div>

        {/* Next Settle Date / Progress Card */}
        <div className="financial-card-lift flex flex-col justify-between rounded-xl border border-border bg-card p-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vendor Summary
            </p>
            <h3 className="text-xl font-semibold text-foreground">
              {vendors.length} Registered
            </h3>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-end justify-between">
              <p className="text-sm text-muted-foreground">Cleared Vendors</p>
              <span className="font-numeric text-sm font-bold text-[var(--gk-secondary)]">{paidPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
              <div
                className="h-full rounded-full bg-[var(--gk-secondary)] animate-progress"
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Registered Vendors</h2>
          <p className="text-sm text-muted-foreground">
            Manage your regular suppliers and household accounts
          </p>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v, i) => {
          const Icon = vendorIcons[i % vendorIcons.length];
          const hasOverdue = v.pending > 0;

          return (
            <div
              key={v.id}
              className="vendor-card-hover group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gk-surface-container-high)] text-[var(--gk-secondary)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-foreground">{v.name}</h4>
                    {v.address && (
                      <p className="text-xs text-muted-foreground">{v.address}</p>
                    )}
                  </div>
                </div>
                <span
                  className={
                    hasOverdue
                      ? "status-unpaid text-[10px] uppercase"
                      : "status-paid text-[10px] uppercase"
                  }
                >
                  {hasOverdue ? "Overdue" : "Clear"}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {v.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{v.phone}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">Pending Balance</p>
                  <p className="font-numeric text-lg text-foreground">{formatInr(v.pending)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {canEdit && (
                <div className="mt-3 flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-border"
                    onClick={() => {
                      setEdit(v);
                      resetForm(v);
                    }}
                  >
                    Edit
                  </Button>
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        if (!confirm("Delete vendor?")) return;
                        const res = await deleteVendor(v.id);
                        if ("error" in res && res.error) toast.error(res.error);
                        else toast.success("Deleted");
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Vendor Skeleton Card */}
        {canEdit && (
          <button
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-muted-foreground transition-all hover:border-[var(--gk-secondary)] hover:text-[var(--gk-secondary)]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent transition-all group-hover:bg-[var(--gk-secondary)]/10">
              <UserPlus className="h-7 w-7" />
            </div>
            <span className="text-base font-semibold">Register New Vendor</span>
          </button>
        )}

        {!vendors.length && !canEdit && (
          <p className="col-span-full text-sm text-muted-foreground">No vendors yet.</p>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {canEdit && (
        <Dialog
          open={open || !!edit}
          onOpenChange={(o) => {
            if (!o) {
              setOpen(false);
              setEdit(null);
              resetForm();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{edit ? "Edit Vendor" : "New Vendor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vendor Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mother Dairy"
                  className="border-border focus-visible:ring-[var(--gk-secondary)]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="border-border focus-visible:ring-[var(--gk-secondary)]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Address
                </Label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="border-border focus-visible:ring-[var(--gk-secondary)]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notes
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="border-border focus-visible:ring-[var(--gk-secondary)]"
                />
              </div>
              <Button
                className="w-full bg-[var(--gk-secondary)] text-white hover:bg-[var(--gk-secondary)]/90"
                onClick={() => void save()}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
