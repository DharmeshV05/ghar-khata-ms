"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canEditLedger, canManageHousehold, requireHousehold } from "@/lib/household";
import { vendorFormSchema, categoryFormSchema } from "@/lib/validations/purchase";

export async function createVendor(input: unknown) {
  const ctx = await requireHousehold();
  if (!canEditLedger(ctx.role)) return { error: "Forbidden" };
  const parsed = vendorFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      household_id: ctx.householdId,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/vendors");
  revalidatePath("/purchases");
  return { ok: true as const, id: data.id };
}

export async function updateVendor(id: string, input: unknown) {
  const ctx = await requireHousehold();
  if (!canEditLedger(ctx.role)) return { error: "Forbidden" };
  const parsed = vendorFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id)
    .eq("household_id", ctx.householdId);
  if (error) return { error: error.message };
  revalidatePath("/vendors");
  return { ok: true as const };
}

export async function deleteVendor(id: string) {
  const ctx = await requireHousehold();
  if (!canManageHousehold(ctx.role)) return { error: "Only admins can delete vendors" };
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").delete().eq("id", id).eq("household_id", ctx.householdId);
  if (error) return { error: error.message };
  revalidatePath("/vendors");
  return { ok: true as const };
}

export async function createCategory(input: unknown) {
  const ctx = await requireHousehold();
  if (!canManageHousehold(ctx.role)) return { error: "Forbidden" };
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      household_id: ctx.householdId,
      name: parsed.data.name,
      color: parsed.data.color ?? null,
      icon: parsed.data.icon ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  revalidatePath("/settings");
  return { ok: true as const, id: data.id };
}

export async function deleteCategory(id: string) {
  const ctx = await requireHousehold();
  if (!canManageHousehold(ctx.role)) return { error: "Forbidden" };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id).eq("household_id", ctx.householdId);
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  return { ok: true as const };
}
