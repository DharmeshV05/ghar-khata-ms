import { createClient } from "@/lib/supabase/server";

export async function fetchReportPurchases(
  householdId: string,
  year: number,
  month?: number
) {
  const supabase = await createClient();
  let q = supabase
    .from("purchases")
    .select(
      "id, item_name, quantity, unit, unit_price, line_total, total_with_tax, purchase_date, payment_status, balance_due, amount_paid, notes, category_id, vendor_id"
    )
    .eq("household_id", householdId)
    .eq("is_archived", false);

  if (month) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0);
    const end = endDate.toISOString().slice(0, 10);
    q = q.gte("purchase_date", start).lte("purchase_date", end);
  } else {
    q = q.gte("purchase_date", `${year}-01-01`).lte("purchase_date", `${year}-12-31`);
  }

  const { data, error } = await q.order("purchase_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
