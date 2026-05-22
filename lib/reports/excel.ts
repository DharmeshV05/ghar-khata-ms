import ExcelJS from "exceljs";
import { formatDate } from "@/lib/format";

type Row = {
  item_name: string;
  purchase_date: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
  total_with_tax: number | null;
  payment_status: string;
  amount_paid: number;
  balance_due: number;
};

export async function buildPurchasesWorkbook(title: string, rows: Row[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "GharKhata";
  const sheet = wb.addWorksheet("Purchases");
  sheet.addRow([title]);
  sheet.addRow([]);
  sheet.addRow([
    "Item",
    "Date",
    "Qty",
    "Unit",
    "Unit price",
    "Line total",
    "With tax",
    "Status",
    "Paid",
    "Balance",
  ]);

  let total = 0;
  let pending = 0;
  for (const r of rows) {
    const gross = Number(r.total_with_tax ?? r.line_total);
    total += gross;
    pending += Number(r.balance_due);
    sheet.addRow([
      r.item_name,
      formatDate(r.purchase_date),
      r.quantity,
      r.unit,
      r.unit_price,
      r.line_total,
      r.total_with_tax ?? r.line_total,
      r.payment_status,
      r.amount_paid,
      r.balance_due,
    ]);
  }
  sheet.addRow([]);
  sheet.addRow(["Totals", "", "", "", "", total, "", "", "", pending]);

  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
}
