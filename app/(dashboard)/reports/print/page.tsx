import { requireHousehold } from "@/lib/household";
import { fetchReportPurchases } from "@/lib/reports/queries";
import { PrintButton } from "@/components/reports/print-button";
import { formatDate, formatInr } from "@/lib/format";

export default async function PrintReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const ctx = await requireHousehold();
  const sp = await searchParams;
  const year = Number(sp.year ?? new Date().getFullYear());
  const month = Number(sp.month ?? new Date().getMonth() + 1);
  const rows = await fetchReportPurchases(ctx.householdId, year, month);

  let total = 0;
  let pending = 0;
  for (const r of rows) {
    total += Number(r.total_with_tax ?? r.line_total);
    pending += Number(r.balance_due);
  }

  return (
    <div className="print:bg-white mx-auto max-w-3xl p-8">
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print mb-6">
        <PrintButton />
      </div>
      <h1 className="text-2xl font-bold">GharKhata — Statement</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {year}-{String(month).padStart(2, "0")}
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Item</th>
            <th>Date</th>
            <th className="text-right">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-dashed">
              <td className="py-2">{r.item_name}</td>
              <td>{formatDate(r.purchase_date)}</td>
              <td className="text-right tabular-nums">
                {formatInr(Number(r.total_with_tax ?? r.line_total))}
              </td>
              <td>{r.payment_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 space-y-1 text-sm font-medium">
        <p>Total: {formatInr(total)}</p>
        <p>Pending: {formatInr(pending)}</p>
      </div>
    </div>
  );
}
