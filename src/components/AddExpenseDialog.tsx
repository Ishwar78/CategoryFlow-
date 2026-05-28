import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Expense } from "@/lib/api";
import { useServerFn } from "@tanstack/react-start";
import { ocrBill } from "@/lib/ocr.functions";
import { toast } from "sonner";
import { Loader2, Upload, X, ScanLine } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  editing?: Expense | null;
}

export function AddExpenseDialog({ open, onClose, categoryId, categoryName, editing }: Props) {
  const qc = useQueryClient();
  const runOcr = useServerFn(ocrBill);
  const [form, setForm] = useState({
    item_name: "", quantity: "1", price: "", vendor: "", description: "",
    purchase_date: new Date().toISOString().slice(0, 10), payment_method: "cash",
    allotted_to: "", dispatch_date: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        item_name: editing.item_name, quantity: String(editing.quantity), price: String(editing.price),
        vendor: editing.vendor || "", description: editing.description || "",
        purchase_date: editing.purchase_date, payment_method: editing.payment_method,
        allotted_to: editing.allotted_to || "", dispatch_date: editing.dispatch_date || "",
      });
    } else {
      setForm({ item_name: "", quantity: "1", price: "", vendor: "", description: "",
        purchase_date: new Date().toISOString().slice(0, 10), payment_method: "cash", allotted_to: "", dispatch_date: "" });
    }
    setFile(null);
  }, [editing, open]);

  async function handleOcr() {
    if (!file) { toast.error("Pehle bill upload karo"); return; }
    setOcrBusy(true);
    try {
      const data_url: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const result = await runOcr({ data: { data_url } });
      if (!result.ok) { toast.error(result.error); return; }
      const f = result.fields;
      setForm((cur) => ({
        ...cur,
        item_name: f.item_name || cur.item_name,
        vendor: f.vendor || cur.vendor,
        price: f.price != null ? String(f.price) : cur.price,
        quantity: f.quantity != null ? String(f.quantity) : cur.quantity,
        purchase_date: f.purchase_date || cur.purchase_date,
        payment_method: f.payment_method || cur.payment_method,
        description: f.description || cur.description,
      }));
      toast.success("Bill se data extract ho gaya");
    } catch (e: any) {
      toast.error(e.message || "OCR failed");
    } finally {
      setOcrBusy(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("category_id", categoryId);
      fd.append("item_name", form.item_name.trim());
      fd.append("quantity", form.quantity);
      fd.append("price", form.price);
      fd.append("vendor", form.vendor.trim());
      fd.append("description", form.description.trim());
      fd.append("purchase_date", form.purchase_date);
      fd.append("payment_method", form.payment_method);
      fd.append("allotted_to", form.allotted_to.trim());
      fd.append("dispatch_date", form.dispatch_date);
      if (file) fd.append("bill", file);
      if (editing) {
        await api(`/expenses/${editing.id}`, { method: "PATCH", form: fd });
      } else {
        await api(`/expenses`, { method: "POST", form: fd });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Expense updated" : "Expense added");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{editing ? "Edit Expense" : "Add Expense"}</h2>
            <p className="text-xs text-muted-foreground">Category: {categoryName}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="p-6 grid gap-4 md:grid-cols-2">
          <Field label="Bill (image / PDF) — optional" className="md:col-span-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex flex-1 items-center gap-2 dlg-input cursor-pointer">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="truncate text-sm text-muted-foreground">{file ? file.name : editing?.bill_path ? "Replace existing" : "Upload bill"}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <button type="button" onClick={handleOcr} disabled={!file || ocrBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
                {ocrBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                Auto-fill from bill
              </button>
            </div>
          </Field>
          <Field label="Item name" className="md:col-span-2">
            <input required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className="dlg-input" />
          </Field>
          <Field label="Quantity">
            <input required type="number" step="0.01" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="dlg-input" />
          </Field>
          <Field label="Price (₹)">
            <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="dlg-input" />
          </Field>
          <Field label="Vendor / Shop">
            <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="dlg-input" />
          </Field>
          <Field label="Purchase date">
            <input required type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} className="dlg-input" />
          </Field>
          <Field label="Payment method">
            <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="dlg-input">
              <option value="cash">Cash</option><option value="upi">UPI</option>
              <option value="card">Card</option><option value="bank">Bank Transfer</option>
            </select>
          </Field>
          <Field label="Allotted To">
            <input value={form.allotted_to} onChange={(e) => setForm({ ...form, allotted_to: e.target.value })} className="dlg-input" placeholder="Person name / ID" />
          </Field>
          <Field label="Dispatch date">
            <input type="date" value={form.dispatch_date} onChange={(e) => setForm({ ...form, dispatch_date: e.target.value })} className="dlg-input" />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="dlg-input resize-none" />
          </Field>
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={save.isPending}
              className="flex items-center gap-2 rounded-lg gradient-bg px-5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Save expense"}
            </button>
          </div>
        </form>
        <style>{`.dlg-input{width:100%;border-radius:0.55rem;border:1px solid var(--input);background:var(--background);padding:0.5rem 0.7rem;font-size:0.875rem;outline:none} .dlg-input:focus{border-color:var(--ring);box-shadow:0 0 0 3px color-mix(in oklab, var(--ring) 25%, transparent)}`}</style>
      </div>
    </div>
  );
}

function Field({ label, className = "", children }: any) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
