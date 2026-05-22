"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireHousehold, canManageHousehold } from "@/lib/household";

const BACKUP_VERSION = 1;

export async function exportHouseholdBackup() {
  const ctx = await requireHousehold();
  const supabase = await createClient();

  const { data: purchaseRows } = await supabase
    .from("purchases")
    .select("id")
    .eq("household_id", ctx.householdId);
  const purchaseIds = (purchaseRows ?? []).map((p) => p.id);

  let paymentsList: unknown[] = [];
  if (purchaseIds.length) {
    const { data: pays } = await supabase.from("payments").select("*").in("purchase_id", purchaseIds);
    paymentsList = pays ?? [];
  }

  const [categories, vendors, purchases, members] = await Promise.all([
    supabase.from("categories").select("*").eq("household_id", ctx.householdId),
    supabase.from("vendors").select("*").eq("household_id", ctx.householdId),
    supabase.from("purchases").select("*").eq("household_id", ctx.householdId),
    supabase.from("household_members").select("household_id, user_id, role, status").eq("household_id", ctx.householdId),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    householdId: ctx.householdId,
    categories: categories.data ?? [],
    vendors: vendors.data ?? [],
    purchases: purchases.data ?? [],
    payments: paymentsList,
    members: members.data ?? [],
  };
}

export async function importHouseholdBackup(json: string) {
  const ctx = await requireHousehold();
  if (!canManageHousehold(ctx.role)) return { error: "Only admins can import backups" };

  let payload: {
    version?: number;
    categories?: { name: string; color?: string; icon?: string; sort_order?: number }[];
    vendors?: { name: string; phone?: string; address?: string; notes?: string }[];
    purchases?: Record<string, unknown>[];
  };

  try {
    payload = JSON.parse(json);
  } catch {
    return { error: "Invalid JSON" };
  }

  if (payload.version !== BACKUP_VERSION) {
    return { error: "Unsupported backup version" };
  }

  const supabase = await createClient();

  for (const c of payload.categories ?? []) {
    await supabase.from("categories").upsert({
      household_id: ctx.householdId,
      name: c.name,
      color: c.color ?? null,
      icon: c.icon ?? null,
      sort_order: c.sort_order ?? 0,
    });
  }

  for (const v of payload.vendors ?? []) {
    await supabase.from("vendors").insert({
      household_id: ctx.householdId,
      name: v.name,
      phone: v.phone ?? null,
      address: v.address ?? null,
      notes: v.notes ?? null,
    });
  }

  revalidatePath("/settings");
  return { ok: true as const, message: "Categories and vendors imported. Purchases import is manual for safety." };
}
