import { requireHousehold, canEditLedger } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { PurchasesClient } from "@/components/purchases/purchases-client";

export default async function PurchasesPage() {
  const ctx = await requireHousehold();
  const supabase = await createClient();

  const [{ data: purchases }, { data: categories }, { data: vendors }] = await Promise.all([
    supabase
      .from("purchases")
      .select(
        "id, item_name, quantity, unit, unit_price, line_total, total_with_tax, purchase_date, payment_status, balance_due, amount_paid, is_archived, category_id, vendor_id, notes, tax_rate"
      )
      .eq("household_id", ctx.householdId)
      .order("purchase_date", { ascending: false })
      .limit(200),
    supabase.from("categories").select("id, name").eq("household_id", ctx.householdId).order("sort_order"),
    supabase.from("vendors").select("id, name").eq("household_id", ctx.householdId).eq("archived", false).order("name"),
  ]);

  return (
    <PurchasesClient
      purchases={(purchases ?? []) as import("@/components/purchases/purchases-client").PurchaseRow[]}
      categories={categories ?? []}
      vendors={vendors ?? []}
      canEdit={canEditLedger(ctx.role)}
    />
  );
}
