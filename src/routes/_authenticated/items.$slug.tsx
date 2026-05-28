import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, fileUrl, type Category, type Expense } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMemo, useState } from "react";
import { inr, fmtDate } from "@/lib/format";
import { iconFor, colorFor } from "@/lib/categories";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Search, Pencil, Trash2, FileText, Plus, FileDown, FileSpreadsheet, Check, X } from "lucide-react";
import { toast } from "sonner";
import { exportExpensesToPDF, exportExpensesToExcel } from "@/lib/exports";

export const Route = createFileRoute("/_authenticated/items/$slug")({
  component: ItemsPage,
});

const PAGE_SIZE = 15;

function ItemsPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [vendor, setVendor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "high" | "low">("newest");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [page, setPage] = useState(1);

  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/categories") });
  const category = cats?.find((c) => c.slug === slug);
  if (cats && !category) throw notFound();

  const { data: expenses } = useQuery({
    queryKey: ["expenses", category?.id],
    enabled: !!category,
    queryFn: () => api<Expense[]>(`/expenses?category_id=${category!.id}`),
  });

  const categoryById = useMemo(() => new Map((cats || []).map((c) => [c.id, c])), [cats]);

  const del = useMutation({
    mutationFn: (id: string) => api(`/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("Expense deleted"); qc.invalidateQueries({ queryKey: ["expenses"] }); },
    onError: (e: any) => toast.error(e.message),
  });


  const filtered = useMemo(() => {
    if (!expenses) return [];
    let list = expenses.filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (q && !`${e.item_name} ${e.vendor ?? ""} ${e.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (vendor && !(e.vendor || "").toLowerCase().includes(vendor.toLowerCase())) return false;
      if (from && e.purchase_date < from) return false;
      if (to && e.purchase_date > to) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "newest") return b.purchase_date.localeCompare(a.purchase_date);
      if (sort === "oldest") return a.purchase_date.localeCompare(b.purchase_date);
      const av = a.price * a.quantity, bv = b.price * b.quantity;
      return sort === "high" ? bv - av : av - bv;
    });
    return list;
  }, [expenses, q, vendor, from, to, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!category || !expenses) return <div className="text-muted-foreground">Loading…</div>;
  const Icon = iconFor(category.icon);
  const color = colorFor(category.color);
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/category/$slug" params={{ slug }} className="rounded-md p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <div className={`grid h-10 w-10 place-items-center rounded-lg ring-1 ${color.bg} ${color.text} ${color.ring}`}><Icon className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{category.name} — All Items</h1>
            <p className="text-xs text-muted-foreground">{filtered.length} of {expenses.length} entries</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportExpensesToPDF({ title: `${category.name} expenses`, expenses: filtered, categoryById })}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <FileDown className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => exportExpensesToExcel({ title: `${category.name} expenses`, expenses: filtered, categoryById })}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => { setEditing(null); setOpenAdd(true); }}
            className="inline-flex items-center gap-2 rounded-lg gradient-bg px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)]">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 grid gap-3 md:grid-cols-6">
        <div className="md:col-span-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search items, vendors…"
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-ring" />
          </div>
          <button 
            onClick={() => {
              if (q.trim()) {
                toast.success(`Filtering for: "${q}"`);
              } else {
                toast.info("Showing all entries");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4.5 py-2 text-sm font-medium hover:bg-accent cursor-pointer transition-colors"
          >
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
        <input value={vendor} onChange={(e) => { setVendor(e.target.value); setPage(1); }} placeholder="Vendor"
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring" />

        <select value={sort} onChange={(e) => setSort(e.target.value as any)}
          className="md:col-span-6 md:max-w-xs rounded-lg border bg-background px-3 py-2 text-sm outline-none">
          <option value="newest">Sort: Newest first</option>
          <option value="oldest">Sort: Oldest first</option>
          <option value="high">Sort: Highest amount</option>
          <option value="low">Sort: Lowest amount</option>
        </select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Item</th><th className="p-3">Qty</th><th className="p-3">Price</th>
                <th className="p-3">Total</th><th className="p-3">Vendor</th><th className="p-3">Date</th>
                <th className="p-3">Added by</th><th className="p-3">Status</th><th className="p-3">Bill</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e) => (
                <tr key={e.id} className="border-t hover:bg-accent/40">
                  <td className="p-3 font-medium">{e.item_name}</td>
                  <td className="p-3">{e.quantity}</td>
                  <td className="p-3">{inr(e.price)}</td>
                  <td className="p-3 font-semibold">{inr(e.price * e.quantity)}</td>
                  <td className="p-3 text-muted-foreground">{e.vendor || "—"}</td>
                  <td className="p-3 text-muted-foreground">{fmtDate(e.purchase_date)}</td>
                  <td className="p-3 text-muted-foreground">{e.added_by_name || "—"}</td>
                  <td className="p-3"><StatusBadge status={e.status} /></td>
                  <td className="p-3">
                    {e.bill_path ? (
                      <a href={fileUrl(e.bill_path)!} target="_blank" rel="noreferrer" className="inline-flex rounded p-1.5 hover:bg-accent"><FileText className="h-4 w-4" /></a>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">

                      <button onClick={() => { setEditing(e); setOpenAdd(true); }} className="rounded p-1.5 hover:bg-accent" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { if (confirm("Delete this expense?")) del.mutate(e.id); }}
                        className="rounded p-1.5 hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="p-12 text-center text-sm text-muted-foreground">No entries match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {safePage} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="rounded border px-3 py-1 disabled:opacity-50">Prev</button>
              <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      <AddExpenseDialog open={openAdd} onClose={() => { setOpenAdd(false); setEditing(null); }}
        categoryId={category.id} categoryName={category.name} editing={editing} />
    </div>
  );
}
