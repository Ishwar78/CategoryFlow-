import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Category, type Expense } from "@/lib/api";
import { iconFor, colorFor } from "@/lib/categories";
import { inr, fmtDate } from "@/lib/format";
import { TrendingUp, Wallet, Package, ArrowRight, CalendarDays, FileDown, FileSpreadsheet } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";
import { exportExpensesToPDF, exportExpensesToExcel, filterByMonth } from "@/lib/exports";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/categories") });
  const { data: expenses } = useQuery({ queryKey: ["expenses", "all"], queryFn: () => api<Expense[]>("/expenses") });

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const categoryById = useMemo(() => new Map((cats || []).map((c) => [c.id, c])), [cats]);

  if (!cats || !expenses) return <div className="text-muted-foreground">Loading…</div>;

  const approved = expenses.filter((e) => e.status === "approved");
  const total = approved.reduce((a, e) => a + e.price * e.quantity, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayTotal = approved.filter((e) => e.purchase_date === today).reduce((a, e) => a + e.price * e.quantity, 0);
  const monthStart = new Date(); monthStart.setDate(1);
  const monthTotal = approved
    .filter((e) => new Date(e.purchase_date) >= monthStart)
    .reduce((a, e) => a + e.price * e.quantity, 0);

  const byCat = new Map<string, { total: number; count: number; last: string | null }>();
  for (const e of approved) {
    const k = e.category_id;
    const cur = byCat.get(k) || { total: 0, count: 0, last: null };
    cur.total += e.price * e.quantity;
    cur.count += 1;
    if (!cur.last || e.purchase_date > cur.last) cur.last = e.purchase_date;
    byCat.set(k, cur);
  }

  const days: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const sum = approved.filter((e) => e.purchase_date === key).reduce((a, e) => a + e.price * e.quantity, 0);
    days.push({ date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), total: sum });
  }

  const catBars = cats.map((c) => ({ name: c.name, total: byCat.get(c.id)?.total || 0 }));

  function exportMonth(kind: "pdf" | "excel") {
    const filtered = filterByMonth(approved, year, month);
    const monthName = new Date(year, month).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const opts = { title: `Expenses — ${monthName}`, expenses: filtered, categoryById };
    if (kind === "pdf") exportExpensesToPDF(opts); else exportExpensesToExcel(opts);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Approved expenses overview.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border bg-card px-3 py-2 text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{new Date(2000, i).toLocaleDateString("en-IN", { month: "long" })}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border bg-card px-3 py-2 text-sm">
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => exportMonth("pdf")} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <FileDown className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => exportMonth("excel")} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={<Wallet className="h-5 w-5" />} label="Total Approved" value={inr(total)} />
        <Stat icon={<CalendarDays className="h-5 w-5" />} label="Today" value={inr(todayTotal)} />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="This Month" value={inr(monthTotal)} />
        <Stat icon={<Package className="h-5 w-5" />} label="Total Items" value={String(approved.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-semibold">Last 30 days</h3>
          <p className="text-xs text-muted-foreground">Daily approved expense trend</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.6 0.2 280)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.6 0.2 280)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="total" stroke="oklch(0.55 0.22 275)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold">By category</h3>
          <p className="text-xs text-muted-foreground">Lifetime totals</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catBars} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="total" fill="oklch(0.6 0.2 290)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cats.map((c) => {
            const Icon = iconFor(c.icon);
            const color = colorFor(c.color);
            const agg = byCat.get(c.id);
            return (
              <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }}
                className="group glass-card rounded-2xl p-5 hover:shadow-[var(--shadow-glow)] transition-shadow">
                <div className="flex items-start justify-between">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${color.bg} ${color.text} ${color.ring}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-4 font-semibold">{c.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-semibold">{inr(agg?.total || 0)}</div>
                    <div className="text-[11px] text-muted-foreground">{agg?.count || 0} items</div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    {agg?.last ? <>Updated<br />{fmtDate(agg.last)}</> : "No entries yet"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg gradient-bg text-white">{icon}</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}
