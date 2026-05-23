"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { purchaseFormSchema, type PurchaseFormValues } from "@/lib/validations/purchase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PURCHASE_UNITS } from "@/lib/constants";
import { formatInr } from "@/lib/format";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { createVendor, createCategory } from "@/lib/actions/vendors";

type Opt = { id: string; name: string };

type Props = {
  defaultValues?: Partial<PurchaseFormValues>;
  categories: Opt[];
  vendors: Opt[];
  onSubmit: (values: PurchaseFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  disabled?: boolean;
  /** Quick mode shows only essential fields; full mode shows everything (used when editing). */
  mode?: "quick" | "full";
  canManageCategories?: boolean;
};

export function PurchaseForm({
  defaultValues,
  categories: initialCategories,
  vendors: initialVendors,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  disabled,
  mode = "quick",
  canManageCategories = false,
}: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [vendors, setVendors] = useState(initialVendors);
  const [showMore, setShowMore] = useState(mode === "full");
  const [newVendorName, setNewVendorName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingVendor, setAddingVendor] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      item_name: "",
      quantity: 1,
      unit: "PIECE",
      unit_price: 0,
      purchase_date: new Date().toISOString().slice(0, 10),
      notes: "",
      is_archived: false,
      category_id: null,
      vendor_id: null,
      tax_rate: null,
      ...defaultValues,
    },
  });

  const qty = form.watch("quantity");
  const price = form.watch("unit_price");
  const tax = form.watch("tax_rate");

  const linePreview = useMemo(() => {
    const q = Number(qty) || 0;
    const p = Number(price) || 0;
    const line = Math.round(q * p * 100) / 100;
    if (tax != null && tax > 0) {
      const taxAmt = Math.round(line * (Number(tax) / 100) * 100) / 100;
      return { line, withTax: Math.round((line + taxAmt) * 100) / 100, taxAmt };
    }
    return { line, withTax: line, taxAmt: 0 };
  }, [qty, price, tax]);

  async function handleAddVendor() {
    const name = newVendorName.trim();
    if (!name) return;
    const res = await createVendor({ name });
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    if (res.id) {
      const opt = { id: res.id, name };
      setVendors((v) => [...v, opt]);
      form.setValue("vendor_id", res.id);
      setNewVendorName("");
      setAddingVendor(false);
      toast.success("Shop added");
    }
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const res = await createCategory({ name });
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    if (res.id) {
      const opt = { id: res.id, name };
      setCategories((c) => [...c, opt]);
      form.setValue("category_id", res.id);
      setNewCategoryName("");
      setAddingCategory(false);
      toast.success("Category added");
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (data) => {
        await onSubmit(data);
      })}
    >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item_name">What did you buy?</Label>
            <Input
              id="item_name"
              placeholder="e.g. Milk, Rice, Vegetables"
              autoFocus
              {...form.register("item_name")}
            />
            {form.formState.errors.item_name && (
              <p className="text-destructive text-sm">{form.formState.errors.item_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_price">Amount (₹)</Label>
            <Input
              id="unit_price"
              type="number"
              step="any"
              placeholder="0"
              {...form.register("unit_price", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_date">Date</Label>
            <Input id="purchase_date" type="date" {...form.register("purchase_date")} />
          </div>

          {showMore && (
            <>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  {...form.register("quantity", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={form.watch("unit")}
                  onValueChange={(v) => v && form.setValue("unit", v as PurchaseFormValues["unit"])}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURCHASE_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Category</Label>
                  {canManageCategories && !addingCategory && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setAddingCategory(true)}
                    >
                      <Plus className="h-3 w-3" /> New
                    </Button>
                  )}
                </div>
                {addingCategory ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void handleAddCategory())}
                    />
                    <Button type="button" size="sm" onClick={() => void handleAddCategory()}>
                      Add
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAddingCategory(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={form.watch("category_id") ?? "__none__"}
                    onValueChange={(v) =>
                      form.setValue("category_id", !v || v === "__none__" ? null : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Uncategorized</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Shop / Vendor</Label>
                  {!addingVendor && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setAddingVendor(true)}
                    >
                      <Plus className="h-3 w-3" /> New
                    </Button>
                  )}
                </div>
                {addingVendor ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Shop name"
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void handleAddVendor())}
                    />
                    <Button type="button" size="sm" onClick={() => void handleAddVendor()}>
                      Add
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAddingVendor(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={form.watch("vendor_id") ?? "__none__"}
                    onValueChange={(v) => form.setValue("vendor_id", !v || v === "__none__" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">GST/Tax % (optional)</Label>
                <Input id="tax_rate" type="number" step="any" {...form.register("tax_rate")} />
              </div>
            </>
          )}
        </div>

        {mode === "quick" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 w-full gap-1"
            onClick={() => setShowMore((v) => !v)}
          >
            {showMore ? (
              <>
                <ChevronUp className="h-4 w-4" /> Hide extra options
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" /> More options (quantity, shop, category…)
              </>
            )}
          </Button>
        )}

        <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatInr(linePreview.taxAmt > 0 ? linePreview.withTax : linePreview.line)}
            </span>
          </div>
          {linePreview.taxAmt > 0 && (
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Before tax</span>
              <span className="tabular-nums">{formatInr(linePreview.line)}</span>
            </div>
          )}
        </div>

        {showMore && (
          <>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" rows={2} placeholder="Any details…" {...form.register("notes")} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="arch"
                checked={Boolean(form.watch("is_archived"))}
                onCheckedChange={(c) => form.setValue("is_archived", Boolean(c))}
              />
              <Label htmlFor="arch" className="font-normal">
                Archived
              </Label>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={disabled || form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
  );
}
