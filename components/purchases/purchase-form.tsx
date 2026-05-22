"use client";

import { useMemo } from "react";
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
import { useCalculatorStore } from "@/stores/calculator-store";
import { Calculator } from "lucide-react";

import dynamic from "next/dynamic";

const CalculatorModal = dynamic(
  () => import("@/components/calculator/calculator-modal").then((m) => m.CalculatorModal),
  { ssr: false }
);

type Opt = { id: string; name: string };

type Props = {
  defaultValues?: Partial<PurchaseFormValues>;
  categories: Opt[];
  vendors: Opt[];
  onSubmit: (values: PurchaseFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  disabled?: boolean;
};

export function PurchaseForm({
  defaultValues,
  categories,
  vendors,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  disabled,
}: Props) {
  const { setOpen, setApplyField } = useCalculatorStore();
  const applyField = useCalculatorStore((s) => s.applyField);

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

  return (
    <>
      <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (data) => {
        await onSubmit(data);
      })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="item_name">Item</Label>
          <Input id="item_name" {...form.register("item_name")} />
          {form.formState.errors.item_name && (
            <p className="text-destructive text-sm">{form.formState.errors.item_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={form.watch("category_id") ?? "__none__"}
            onValueChange={(v) => form.setValue("category_id", !v || v === "__none__" ? null : v)}
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
        </div>
        <div className="space-y-2">
          <Label>Vendor</Label>
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
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="quantity">Quantity</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => {
                setApplyField("quantity");
                setOpen(true);
              }}
            >
              <Calculator className="h-3 w-3" /> Calc
            </Button>
          </div>
          <Input id="quantity" type="number" step="any" {...form.register("quantity", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="unit">Unit</Label>
          </div>
          <Select value={form.watch("unit")} onValueChange={(v) => v && form.setValue("unit", v as PurchaseFormValues["unit"])}>
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
            <Label htmlFor="unit_price">Price per unit</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => {
                setApplyField("unit_price");
                setOpen(true);
              }}
            >
              <Calculator className="h-3 w-3" /> Calc
            </Button>
          </div>
          <Input id="unit_price" type="number" step="any" {...form.register("unit_price", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Date</Label>
          <Input id="purchase_date" type="date" {...form.register("purchase_date")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax_rate">GST/Tax % (optional)</Label>
          <Input id="tax_rate" type="number" step="any" {...form.register("tax_rate")} />
        </div>
      </div>

      <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Line total</span>
          <span className="tabular-nums">{formatInr(linePreview.line)}</span>
        </div>
        {linePreview.taxAmt > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">With tax</span>
            <span className="font-semibold tabular-nums">{formatInr(linePreview.withTax)}</span>
          </div>
        )}
        <p className="text-muted-foreground pt-1 text-xs">
          Monthly total in dashboard uses recorded purchases. Partial payments are tracked after you save.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...form.register("notes")} />
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
      <CalculatorModal
        onApply={(val) => {
          if (applyField === "quantity") form.setValue("quantity", val);
          if (applyField === "unit_price") form.setValue("unit_price", val);
          if (applyField === "tax_rate") form.setValue("tax_rate", val);
        }}
      />
    </>
  );
}
