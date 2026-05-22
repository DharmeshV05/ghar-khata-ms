import { NextRequest, NextResponse } from "next/server";
import { getHouseholdContext } from "@/lib/household";
import { fetchReportPurchases } from "@/lib/reports/queries";
import { buildPurchasesPdf } from "@/lib/reports/pdf";
import { buildPurchasesWorkbook } from "@/lib/reports/excel";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, "export");
  if (limited) return limited;

  const ctx = await getHouseholdContext();
  if (!ctx?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "pdf";
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;

  const rows = await fetchReportPurchases(ctx.householdId, year, month);
  const title = month
    ? `Report ${year}-${String(month).padStart(2, "0")}`
    : `Report ${year}`;

  if (format === "xlsx") {
    const buffer = await buildPurchasesWorkbook(title, rows as never);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gharkhata-${year}${month ? `-${month}` : ""}.xlsx"`,
      },
    });
  }

  const doc = buildPurchasesPdf(title, rows as never);
  const pdf = doc.output("arraybuffer");
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="gharkhata-${year}${month ? `-${month}` : ""}.pdf"`,
    },
  });
}
