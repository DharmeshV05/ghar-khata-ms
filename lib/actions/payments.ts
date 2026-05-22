"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canEditLedger, canManageHousehold, requireHousehold } from "@/lib/household";
import { paymentFormSchema } from "@/lib/validations/purchase";

export async function addPayment(input: unknown) {
  const ctx = await requireHousehold();
  if (!canEditLedger(ctx.role)) return { error: "Forbidden" };
  const parsed = paymentFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const supabase = await createClient();
  const { data: p } = await supabase
    .from("purchases")
    .select("id, household_id")
    .eq("id", parsed.data.purchase_id)
    .maybeSingle();
  if (!p || p.household_id !== ctx.householdId) return { error: "Purchase not found" };

  const { error } = await supabase.from("payments").insert({
    purchase_id: parsed.data.purchase_id,
    amount: parsed.data.amount,
    paid_at: parsed.data.paid_at ?? new Date().toISOString(),
    method: parsed.data.method,
    note: parsed.data.note ?? null,
    created_by: ctx.userId,
  });
  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    household_id: ctx.householdId,
    user_id: ctx.userId,
    action: "payment",
    entity_type: "purchase",
    entity_id: parsed.data.purchase_id,
    metadata: { amount: parsed.data.amount },
  });

  revalidatePath("/dashboard");
  revalidatePath("/purchases");
  return { ok: true as const };
}

export async function deletePayment(id: string) {
  const ctx = await requireHousehold();
  if (!canManageHousehold(ctx.role)) return { error: "Only admins can delete payment records" };
  const supabase = await createClient();
  const { data: pay } = await supabase.from("payments").select("id, purchase_id").eq("id", id).maybeSingle();
  if (!pay) return { error: "Not found" };
  const { data: pur } = await supabase
    .from("purchases")
    .select("household_id")
    .eq("id", pay.purchase_id)
    .maybeSingle();
  if (!pur || pur.household_id !== ctx.householdId) return { error: "Not found" };

  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  return { ok: true as const };
}
