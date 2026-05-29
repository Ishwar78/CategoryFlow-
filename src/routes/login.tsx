import { useNavigate, Link, Navigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="min-h-screen" />;
  if (user) return <Navigate to="/dashboard" />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, name);
        toast.success("Account created!");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-bg text-white shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold">LedgerFlow</span>
        </Link>

        <div className="glass-card rounded-2xl p-7">
          <h1 className="text-2xl font-semibold">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to manage your expenses." : "First user becomes admin."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your name" />
              </Field>
            )}
            <Field label="Email">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@business.com" />
            </Field>
            <Field label="Password">
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </Field>

            <button type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg gradient-bg px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-medium text-primary hover:underline">
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
      <style>{`.input{width:100%;border-radius:0.6rem;border:1px solid var(--input);background:color-mix(in oklab, var(--card) 80%, transparent);padding:0.55rem 0.75rem;font-size:0.875rem;outline:none;transition:all .15s} .input:focus{border-color:var(--ring);box-shadow:0 0 0 3px color-mix(in oklab, var(--ring) 25%, transparent)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
