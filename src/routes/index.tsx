import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Sparkles, BarChart3, Wallet, ShieldCheck, ArrowRight } from "lucide-react";

export default function Landing() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen" />;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen soft-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-bg text-white shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">LedgerFlow</span>
        </div>
        <Link to="/login" className="rounded-lg gradient-bg px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)]">
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-14 pb-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3" /> Modern Expense & Inventory CRM
          </span>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-6xl">
            Run your shop on a <span className="gradient-text">single ledger</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Track every rupee category-wise — ACG, Medicine, Grocery, Electrical and more. Upload bills, see live analytics, and stay on top of your business.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg gradient-bg px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)]">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: Wallet, title: "Category-wise expenses", desc: "Dedicated dashboards per category with totals, trends and items." },
            { icon: BarChart3, title: "Live analytics", desc: "Today, monthly and lifetime totals with rich charts." },
            { icon: ShieldCheck, title: "Bills & vendors", desc: "Attach bills, track vendors, payment methods and authors." },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg gradient-bg text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
