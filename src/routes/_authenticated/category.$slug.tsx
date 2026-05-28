import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Category, type Expense } from "@/lib/api";
import { iconFor, colorFor } from "@/lib/categories";
import { inr, fmtDate } from "@/lib/format";
import { useMemo, useState } from "react";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { Plus, ListOrdered, Wallet, CalendarDays, TrendingUp, Package, FileDown, FileSpreadsheet, Truck } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { exportExpensesToPDF, exportExpensesToExcel } from "@/lib/exports";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [open, setOpen] = useState(false);

  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/categories") });
  const category = cats?.find((c) => c.slug === slug);
  if (cats && !category) throw notFound();

  const { data: expenses } = useQuery({
    queryKey: ["expenses", category?.id],
    enabled: !!category,
    queryFn: () => api<Expense[]>(`/expenses?category_id=${category!.id}`),
  });

  const categoryById = useMemo(() => new Map((cats || []).map((c) => [c.id, c])), [cats]);

  if (!category || !expenses) return <div className="text-muted-foreground">Loading…</div>;

  const Icon = iconFor(category.icon);
  const color = colorFor(category.color);

  const approved = expenses.filter((e) => e.status === "approved");
  const total = approved.reduce((a, e) => a + e.price * e.quantity, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayTotal = approved.filter((e) => e.purchase_date === today).reduce((a, e) => a + e.price * e.quantity, 0);
  const monthStart = new Date(); monthStart.setDate(1);
  const monthExp = approved.filter((e) => new Date(e.purchase_date) >= monthStart);
  const monthTotal = monthExp.reduce((a, e) => a + e.price * e.quantity, 0);
  const avg = approved.length ? total / approved.length : 0;

  const months: { name: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const sum = approved
      .filter((e) => new Date(e.purchase_date) >= start && new Date(e.purchase_date) < end)
      .reduce((a, e) => a + e.price * e.quantity, 0);
    months.push({ name: d.toLocaleDateString("en-IN", { month: "short" }), total: sum });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`grid h-14 w-14 place-items-center rounded-2xl ring-1 ${color.bg} ${color.text} ${color.ring}`}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{category.name}</h1>
            <p className="text-muted-foreground text-sm">{category.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportExpensesToPDF({ title: `${category.name} expenses`, expenses, categoryById })}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <FileDown className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => exportExpensesToExcel({ title: `${category.name} expenses`, expenses, categoryById })}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <Link to="/dispatch/$slug" params={{ slug }}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
            <Truck className="h-4 w-4" /> Dispatch
          </Link>
          <Link to="/items/$slug" params={{ slug }}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
            <ListOrdered className="h-4 w-4" /> View All Items
          </Link>
          <button onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg gradient-bg px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)]">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Stat icon={<Wallet className="h-5 w-5" />} label="Total (approved)" value={inr(total)} />
        <Stat icon={<CalendarDays className="h-5 w-5" />} label="Today" value={inr(todayTotal)} />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="This Month" value={inr(monthTotal)} />
        <Stat icon={<Package className="h-5 w-5" />} label="Items" value={String(approved.length)} />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Avg / item" value={inr(avg)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-semibold">Monthly trend</h3>
          <p className="text-xs text-muted-foreground">Last 6 months (approved)</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="total" fill="oklch(0.6 0.2 285)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold">Recent entries</h3>
          <div className="mt-4 space-y-3">
            {expenses.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{e.item_name}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(e.purchase_date)} · {e.vendor || "—"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={e.status} />
                  <div className="text-sm font-semibold">{inr(e.price * e.quantity)}</div>
                </div>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
          </div>
        </div>
      </div>

      <AddExpenseDialog open={open} onClose={() => setOpen(false)} categoryId={category.id} categoryName={category.name} />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg gradient-bg text-white">{icon}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}
