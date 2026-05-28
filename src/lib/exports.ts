import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Expense, Category } from "@/lib/api";
import { inr, fmtDate } from "@/lib/format";

export function exportExpensesToPDF(opts: { title: string; expenses: Expense[]; categoryById: Map<string, Category> }) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(opts.title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString("en-IN")}`, 14, 25);

  const total = opts.expenses.reduce((a, e) => a + e.price * e.quantity, 0);
  doc.setTextColor(20);
  doc.text(`Total: ${inr(total)}    Entries: ${opts.expenses.length}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [["Date", "Category", "Item", "Vendor", "Qty", "Price", "Total", "Status"]],
    body: opts.expenses.map((e) => [
      fmtDate(e.purchase_date),
      opts.categoryById.get(e.category_id)?.name || "—",
      e.item_name,
      e.vendor || "—",
      String(e.quantity),
      inr(e.price),
      inr(e.price * e.quantity),
      e.status,
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [99, 102, 241] },
  });

  doc.save(`${slug(opts.title)}.pdf`);
}

export function exportExpensesToExcel(opts: { title: string; expenses: Expense[]; categoryById: Map<string, Category> }) {
  const rows = opts.expenses.map((e) => ({
    Date: e.purchase_date,
    Category: opts.categoryById.get(e.category_id)?.name || "",
    Item: e.item_name,
    Vendor: e.vendor,
    Quantity: e.quantity,
    Price: e.price,
    Total: +(e.price * e.quantity).toFixed(2),
    "Payment Method": e.payment_method,
    Status: e.status,
    "Added By": e.added_by_name || "",
    "Approved By": e.approved_by_name || "",
    Description: e.description,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  XLSX.writeFile(wb, `${slug(opts.title)}.xlsx`);
}

function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

// Filters
export function filterByMonth(expenses: Expense[], year: number, monthIndex: number) {
  return expenses.filter((e) => {
    const d = new Date(e.purchase_date);
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });
}
