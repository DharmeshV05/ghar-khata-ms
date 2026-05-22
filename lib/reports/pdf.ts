import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatInr } from "@/lib/format";

type Row = {
  item_name: string;
  purchase_date: string;
  line_total: number;
  total_with_tax: number | null;
  payment_status: string;
  balance_due: number;
};

export function buildPurchasesPdf(title: string, rows: Row[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("GharKhata", 14, 18);
  doc.setFontSize(12);
  doc.text(title, 14, 28);

  let total = 0;
  let pending = 0;
  const body = rows.map((r) => {
    const amt = Number(r.total_with_tax ?? r.line_total);
    total += amt;
    pending += Number(r.balance_due);
    return [
      r.item_name,
      formatDate(r.purchase_date),
      formatInr(amt),
      r.payment_status,
      formatInr(r.balance_due),
    ];
  });

  autoTable(doc, {
    startY: 34,
    head: [["Item", "Date", "Amount", "Status", "Balance"]],
    body,
  });

  const y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
  doc.text(`Total: ${formatInr(total)}`, 14, y + 10);
  doc.text(`Pending: ${formatInr(pending)}`, 14, y + 18);

  return doc;
}
