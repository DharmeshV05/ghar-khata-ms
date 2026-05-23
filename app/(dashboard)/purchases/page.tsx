import { requireHousehold, canEditLedger, canManageHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { PurchasesClient } from "@/components/purchases/purchases-client";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string; status?: string; pay?: string }>;
}) {
  const ctx = await requireHousehold();
  const params = await searchParams;
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
      canManageCategories={canManageHousehold(ctx.role)}
      initialAddOpen={params.add === "1"}
      initialStatus={params.status === "unpaid" ? "unpaid" : undefined}
      initialPayId={params.pay}
    />
  );
}
