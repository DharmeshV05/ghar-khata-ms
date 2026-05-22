import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, "cron");
  if (limited) return limited;
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: households, error: hErr } = await supabase.from("households").select("id");
  if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 });

  let upserted = 0;
  for (const h of households ?? []) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

    const { data: purchases } = await supabase
      .from("purchases")
      .select("line_total, total_with_tax, amount_paid, balance_due, category_id")
      .eq("household_id", h.id)
      .eq("is_archived", false)
      .gte("purchase_date", start)
      .lte("purchase_date", end);

    let totalExpense = 0;
    let totalPaid = 0;
    let totalPending = 0;
    const byCategory: Record<string, number> = {};

    for (const p of purchases ?? []) {
      const gross = Number(p.total_with_tax ?? p.line_total);
      totalExpense += gross;
      totalPaid += Number(p.amount_paid);
      totalPending += Number(p.balance_due);
      const key = p.category_id ?? "uncategorized";
      byCategory[key] = (byCategory[key] ?? 0) + gross;
    }

    const { error } = await supabase.from("monthly_summaries").upsert(
      {
        household_id: h.id,
        year,
        month,
        total_expense: totalExpense,
        total_paid: totalPaid,
        total_pending: totalPending,
        by_category: byCategory,
        computed_at: new Date().toISOString(),
        version: 1,
      },
      { onConflict: "household_id,year,month" }
    );
    if (!error) upserted += 1;
  }

  return NextResponse.json({ ok: true, upserted, year, month });
}
