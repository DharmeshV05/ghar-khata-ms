import { z } from "zod";
import { PURCHASE_UNITS } from "@/lib/constants";

export const paymentStatusSchema = z.enum(["unpaid", "partial", "paid"]);

export const purchaseFormSchema = z.object({
  item_name: z.string().min(1, "Item is required").max(500),
  category_id: z.string().uuid().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  quantity: z.number().positive().max(1_000_000),
  unit: z.enum(PURCHASE_UNITS as unknown as [string, ...string[]]),
  unit_price: z.number().min(0).max(99_999_999),
  tax_rate: z.number().min(0).max(100).optional().nullable(),
  purchase_date: z.string().min(1),
  payment_status: paymentStatusSchema.optional(),
  notes: z.string().max(2000).optional().nullable(),
  is_archived: z.boolean().optional(),
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export const vendorFormSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const paymentFormSchema = z.object({
  purchase_id: z.string().uuid(),
  amount: z.number().positive(),
  paid_at: z.string().optional(),
  method: z.enum(["CASH", "UPI", "CARD", "OTHER"]),
  note: z.string().max(500).optional().nullable(),
});

export const categoryFormSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().max(20).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
});

export const householdCreateSchema = z.object({
  name: z.string().min(1).max(200),
});
