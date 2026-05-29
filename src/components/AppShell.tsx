import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Sparkles, Menu, X, CheckSquare } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@/lib/query";
import { api, type Category } from "@/lib/api";
import { iconFor } from "@/lib/categories";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-sidebar transform transition-transform md:relative md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 px-5 border-b">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-bg text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold">LedgerFlow</span>
        </div>
        <nav className="p-3 space-y-1 pb-32">
          <NavItem to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} active={path === "/dashboard"}>
            Dashboard
          </NavItem>
          {user?.role === "admin" && (
            <NavItem to="/approvals" icon={<CheckSquare className="h-4 w-4" />} active={path === "/approvals"}>
              Approvals
            </NavItem>
          )}
          <div className="pt-4 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categories</div>
          {cats?.map((c) => {
            const Icon = iconFor(c.icon);
            const active = path.includes(`/category/${c.slug}`) || path.includes(`/items/${c.slug}`);
            return (
              <NavItem key={c.id} to="/category/$slug" params={{ slug: c.slug }} icon={<Icon className="h-4 w-4" />} active={active}>
                {c.name}
              </NavItem>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-3 bg-sidebar">
          <div className="flex items-center gap-2 rounded-lg p-2">
            <div className="h-8 w-8 rounded-full gradient-bg grid place-items-center text-white text-sm font-medium">
              {(user?.email?.[0] || "?").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{user?.display_name || user?.email}</div>
              <div className="truncate text-[11px] text-muted-foreground capitalize">{user?.role}</div>
            </div>
            <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="rounded-md p-2 hover:bg-accent" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 backdrop-blur px-4 md:px-6">
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-md hover:bg-accent">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-sm font-medium text-muted-foreground">Expense & Inventory CRM</h1>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ to, params, icon, active, children }: any) {
  return (
    <Link to={to} params={params}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active ? "gradient-bg text-primary-foreground shadow-[var(--shadow-glow)]" : "hover:bg-accent text-foreground/80"
      }`}>
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}
