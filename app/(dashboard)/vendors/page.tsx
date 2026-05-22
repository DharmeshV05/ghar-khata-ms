import { requireHousehold, canEditLedger, canManageHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { VendorsClient } from "@/components/vendors/vendors-client";

export default async function VendorsPage() {
  const ctx = await requireHousehold();
  const supabase = await createClient();

  const [{ data: vendors }, { data: pendingPurchases }] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, name, phone, address, notes")
      .eq("household_id", ctx.householdId)
      .eq("archived", false)
      .order("name"),
    supabase
      .from("purchases")
      .select("vendor_id, balance_due")
      .eq("household_id", ctx.householdId)
      .eq("is_archived", false)
      .in("payment_status", ["unpaid", "partial"]),
  ]);

  const pendingByVendor = new Map<string, number>();
  for (const p of pendingPurchases ?? []) {
    if (!p.vendor_id) continue;
    pendingByVendor.set(
      p.vendor_id,
      (pendingByVendor.get(p.vendor_id) ?? 0) + Number(p.balance_due)
    );
  }

  const rows = (vendors ?? []).map((v) => ({
    ...v,
    pending: pendingByVendor.get(v.id) ?? 0,
  }));

  return (
    <VendorsClient
      vendors={rows}
      canEdit={canEditLedger(ctx.role)}
      canDelete={canManageHousehold(ctx.role)}
    />
  );
}
