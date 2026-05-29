import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@/lib/query";
import { api, type Category, type Expense } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMemo, useState } from "react";
import { inr, fmtDate } from "@/lib/format";
import { iconFor, colorFor } from "@/lib/categories";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Search, Pencil, Trash2, Truck, Plus, FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { exportExpensesToPDF, exportExpensesToExcel } from "@/lib/exports";

const PAGE_SIZE = 15;

export default function DispatchPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [allottedTo, setAllottedTo] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "dispatch_asc" | "dispatch_desc">("dispatch_asc");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [page, setPage] = useState(1);

  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/categories") });
  const category = cats?.find((c) => c.slug === slug);
  if (cats && !category) return <Navigate to="/dashboard" replace />;

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
      if (q && !`${e.item_name} ${e.allotted_to ?? ""} ${e.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (allottedTo && !(e.allotted_to || "").toLowerCase().includes(allottedTo.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "newest") return b.purchase_date.localeCompare(a.purchase_date);
      if (sort === "oldest") return a.purchase_date.localeCompare(b.purchase_date);
      if (sort === "dispatch_asc") return (a.dispatch_date || "9999").localeCompare(b.dispatch_date || "9999");
      if (sort === "dispatch_desc") return (b.dispatch_date || "").localeCompare(a.dispatch_date || "");
      return 0;
    });
    return list;
  }, [expenses, q, allottedTo, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!category || !expenses) return <div className="text-muted-foreground">Loading…</div>;
  const Icon = iconFor(category.icon);
  const color = colorFor(category.color);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/category/${slug}`} className="rounded-md p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <div className={`grid h-10 w-10 place-items-center rounded-lg ring-1 ${color.bg} ${color.text} ${color.ring}`}><Truck className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{category.name} — Dispatch</h1>
            <p className="text-xs text-muted-foreground">{filtered.length} entries</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportExpensesToPDF({ title: `${category.name} Dispatches`, expenses: filtered, categoryById })}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <FileDown className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => exportExpensesToExcel({ title: `${category.name} Dispatches`, expenses: filtered, categoryById })}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => { setEditing(null); setOpenAdd(true); }}
            className="inline-flex items-center gap-2 rounded-lg gradient-bg px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)]">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 grid gap-3 md:grid-cols-6">
        <div className="md:col-span-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search items, names…"
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-ring" />
          </div>
        </div>
        <input value={allottedTo} onChange={(e) => { setAllottedTo(e.target.value); setPage(1); }} placeholder="Allotted To"
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
        
        <select value={sort} onChange={(e) => setSort(e.target.value as any)}
          className="md:col-span-2 rounded-lg border bg-background px-3 py-2 text-sm outline-none">
          <option value="dispatch_asc">Sort: Dispatch Date (Earliest)</option>
          <option value="dispatch_desc">Sort: Dispatch Date (Latest)</option>
          <option value="newest">Sort: Newest first</option>
          <option value="oldest">Sort: Oldest first</option>
        </select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Allotted To</th>
                <th className="p-3">Dispatch Date</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e) => (
                <tr key={e.id} className="border-t hover:bg-accent/40">
                  <td className="p-3 font-medium">{e.item_name}</td>
                  <td className="p-3 font-medium text-primary">{e.allotted_to || "—"}</td>
                  <td className="p-3">{e.dispatch_date ? fmtDate(e.dispatch_date) : "—"}</td>
                  <td className="p-3">{e.quantity}</td>
                  <td className="p-3">{inr(e.price)}</td>
                  <td className="p-3"><StatusBadge status={e.status} /></td>
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
                <tr><td colSpan={7} className="p-12 text-center text-sm text-muted-foreground">No entries match your filters.</td></tr>
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
