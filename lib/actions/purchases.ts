"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canEditLedger, getHouseholdContext, requireHousehold } from "@/lib/household";
import { purchaseFormSchema } from "@/lib/validations/purchase";

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

export async function createPurchase(input: unknown) {
  const ctx = await requireHousehold();
  if (!canEditLedger(ctx.role)) return { error: "Viewers cannot add purchases" };

  const parsed = purchaseFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const supabase = await createClient();
  const payload = {
    household_id: ctx.householdId,
    item_name: parsed.data.item_name,
    category_id: parsed.data.category_id ?? null,
    vendor_id: parsed.data.vendor_id ?? null,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    unit_price: parsed.data.unit_price,
    tax_rate: parsed.data.tax_rate ?? null,
    purchase_date: parsed.data.purchase_date,
    notes: parsed.data.notes ?? null,
    is_archived: parsed.data.is_archived ?? false,
    created_by: ctx.userId,
  };

  const { data, error } = await supabase.from("purchases").insert(payload).select("id").single();
  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    household_id: ctx.householdId,
    user_id: ctx.userId,
    action: "create",
    entity_type: "purchase",
    entity_id: data.id,
    metadata: { item_name: parsed.data.item_name },
  });

  revalidatePath("/dashboard");
  revalidatePath("/purchases");
  return { ok: true as const, id: data.id };
}

export async function updatePurchase(id: string, input: unknown) {
  const ctx = await requireHousehold();
  if (!canEditLedger(ctx.role)) return { error: "Forbidden" };
  const parsed = purchaseFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("purchases")
    .select("id, household_id")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.household_id !== ctx.householdId) return { error: "Not found" };

  const { error } = await supabase
    .from("purchases")
    .update({
      item_name: parsed.data.item_name,
      category_id: parsed.data.category_id ?? null,
      vendor_id: parsed.data.vendor_id ?? null,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      unit_price: parsed.data.unit_price,
      tax_rate: parsed.data.tax_rate ?? null,
      purchase_date: parsed.data.purchase_date,
      notes: parsed.data.notes ?? null,
      is_archived: parsed.data.is_archived ?? false,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    household_id: ctx.householdId,
    user_id: ctx.userId,
    action: "update",
    entity_type: "purchase",
    entity_id: id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/purchases");
  return { ok: true as const };
}

export async function deletePurchase(id: string) {
  const ctx = await requireHousehold();
  if (!canEditLedger(ctx.role)) return { error: "Forbidden" };
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("purchases")
    .select("id, household_id")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.household_id !== ctx.householdId) return { error: "Not found" };

  const { error } = await supabase.from("purchases").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/purchases");
  return { ok: true as const };
}

export async function duplicatePurchase(id: string) {
  const ctx = await requireHousehold();
  if (!canEditLedger(ctx.role)) return { error: "Forbidden" };
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("purchases")
    .select(
      "household_id, category_id, vendor_id, item_name, quantity, unit, unit_price, tax_rate, line_total, total_with_tax, notes, is_archived"
    )
    .eq("id", id)
    .eq("household_id", ctx.householdId)
    .maybeSingle();
  if (error || !row) return { error: "Not found" };

  const r = asRecord(row);
  const { data: ins, error: insErr } = await supabase
    .from("purchases")
    .insert({
      household_id: ctx.householdId,
      category_id: (r.category_id as string) ?? null,
      vendor_id: (r.vendor_id as string) ?? null,
      item_name: r.item_name as string,
      quantity: r.quantity as number,
      unit: r.unit as string,
      unit_price: r.unit_price as number,
      tax_rate: (r.tax_rate as number | null) ?? null,
      purchase_date: new Date().toISOString().slice(0, 10),
      notes: (r.notes as string | null) ?? null,
      is_archived: Boolean(r.is_archived),
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (insErr) return { error: insErr.message };

  revalidatePath("/purchases");
  return { ok: true as const, id: ins.id };
}
